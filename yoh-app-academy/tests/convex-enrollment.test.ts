import { randomUUID } from 'node:crypto';
import { defineTestApp } from 'convex-test';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import schema from '../convex/schema';
import * as academy from '../convex/academy';
import * as enrollment from '../convex/enrollment';
import * as storage from '../convex/fileStorage';

const app=defineTestApp({schema}).defineModules({academy,enrollment,'fileStorage':storage});
const bridge={requestTime:Date.now(),serverSecret:'test-only-enrollment-bridge-secret-1234567890'};
async function fixture(){
 const t=app.createTest();const ids={admin:randomUUID(),mentor:randomUUID(),student:randomUUID(),otherStudent:randomUUID()};
 const auth={admin:{...bridge,sessionHash:'a'.repeat(64)},mentor:{...bridge,sessionHash:'b'.repeat(64)},student:{...bridge,sessionHash:'c'.repeat(64)},otherStudent:{...bridge,sessionHash:'d'.repeat(64)}};
 const lessonId=randomUUID();const videoId=randomUUID();const resourceId=randomUUID();
 await t.run(async ctx=>{
  for(const name of ['admin','mentor','student','otherStudent'] as const){const role=name==='otherStudent'?'student':name;await ctx.db.insert('users',{id:ids[name],name:`Enrollment ${name}`,email:`${name}@example.test`,passwordHash:`${'a'.repeat(32)}:${'b'.repeat(128)}`,role,createdAt:new Date().toISOString()});await ctx.db.insert('sessions',{userId:ids[name],tokenHash:auth[name].sessionHash,expiresAt:Date.now()+3600000,createdAt:Date.now()});}
  await ctx.db.insert('lessons',{id:lessonId,title:'Approval-only recorded lesson',description:'Public lesson metadata, protected lesson content.',courseId:'0',mentorId:ids.mentor,duration:60,published:true,chapters:[{title:'Private chapter',time:0,code:'private lesson source'}],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  const video=await ctx.storage.store(new Blob(['recording fixture'],{type:'video/mp4'}));const pdf=await ctx.storage.store(new Blob(['%PDF-1.7 fixture'],{type:'application/pdf'}));
  await ctx.db.insert('files',{id:videoId,lessonId,kind:'video',originalName:'recording.mp4',storageName:video,mime:'video/mp4',size:17,createdAt:new Date().toISOString()});await ctx.db.insert('files',{id:resourceId,lessonId,kind:'resource',originalName:'notes.pdf',storageName:pdf,mime:'application/pdf',size:16,createdAt:new Date().toISOString()});
 });
 return{t,ids,auth,lessonId,videoId,resourceId};
}
async function approve(f:Awaited<ReturnType<typeof fixture>>){return f.t.mutation(app.api.enrollment.setEnrollment,{...f.auth.admin,studentId:f.ids.student,status:'approved'});}
async function expectContentDenied(f:Awaited<ReturnType<typeof fixture>>){
 const{t,auth,lessonId,videoId,resourceId}=f;const status={data:{status:403}};
 await expect(t.query(app.api['fileStorage'].readFile,{...auth.student,id:videoId})).rejects.toMatchObject(status);await expect(t.query(app.api['fileStorage'].readFile,{...auth.student,id:resourceId})).rejects.toMatchObject(status);
 await expect(t.query(app.api.academy.getProgress,{...auth.student,lessonId})).rejects.toMatchObject(status);await expect(t.mutation(app.api.academy.saveProgress,{...auth.student,lessonId,position:20,completed:true})).rejects.toMatchObject(status);
 await expect(t.query(app.api.academy.listNotes,{...auth.student,lessonId})).rejects.toMatchObject(status);await expect(t.mutation(app.api.academy.createNote,{...auth.student,id:randomUUID(),lessonId,position:10,body:'Blocked note'})).rejects.toMatchObject(status);
 await expect(t.query(app.api.academy.listQuestions,{...auth.student,lessonId})).rejects.toMatchObject(status);await expect(t.mutation(app.api.academy.createQuestion,{...auth.student,id:randomUUID(),lessonId,position:10,body:'Blocked question'})).rejects.toMatchObject(status);
 expect((await t.query(app.api.academy.dashboard,auth.student)).progress).toEqual([]);expect((await t.query(app.api.academy.certificates,auth.student)).eligibleCourses).toEqual([]);
}
beforeEach(()=>vi.stubEnv('YOH_CONVEX_SERVER_SECRET',bridge.serverSecret));
afterEach(()=>vi.unstubAllEnvs());

describe('Program enrollment approval',()=>{
 it('exposes public metadata without releasing files, resources, chapters, or activity before approval',async()=>{
  const f=await fixture();const{t,auth,lessonId,videoId}=f;
  expect(await t.query(app.api.enrollment.getEnrollment,bridge)).toEqual({enrollment:{status:'none',requestedAt:null,approvedAt:null},canViewLessons:false});expect(await t.query(app.api.enrollment.getEnrollment,auth.student)).toEqual({enrollment:{status:'none',requestedAt:null,approvedAt:null},canViewLessons:false});
  for(const viewer of [bridge,auth.student]){const listed=await t.query(app.api.academy.listLessons,viewer);expect(listed.lessons[0]).toMatchObject({id:lessonId,title:'Approval-only recorded lesson',canWatch:false,videoUrl:null,resources:[],chapters:[]});const detail=await t.query(app.api.academy.getLesson,{...viewer,id:lessonId});expect(detail.lesson).toMatchObject({canWatch:false,videoUrl:null,resources:[],chapters:[]});}
  await expect(t.query(app.api['fileStorage'].readFile,{...bridge,id:videoId})).rejects.toMatchObject({data:{status:401}});await expectContentDenied(f);await expect(t.mutation(app.api.academy.issueCertificate,{...auth.student,id:randomUUID(),courseId:'0'})).rejects.toMatchObject({data:{status:403}});
  expect((await t.query(app.api.enrollment.getEnrollment,auth.mentor)).canViewLessons).toBe(true);expect((await t.query(app.api.academy.getLesson,{...auth.mentor,id:lessonId})).lesson.canWatch).toBe(true);
 });
 it('keeps requests pending until an admin approves and preserves idempotent timestamps',async()=>{
  const f=await fixture();const{t,auth,ids,lessonId}=f;
  const requests=await Promise.all(Array.from({length:8},()=>t.mutation(app.api.enrollment.requestEnrollment,auth.student)));expect(requests.every(result=>result.enrollment.status==='pending'&&!result.canViewLessons)).toBe(true);expect(new Set(requests.map(result=>result.enrollment.requestedAt)).size).toBe(1);
  expect(await t.run(ctx=>ctx.db.query('programEnrollments').collect())).toHaveLength(1);await expectContentDenied(f);
  const list=await t.query(app.api.enrollment.listEnrollments,auth.admin);expect(list.enrollments).toHaveLength(1);expect(list.enrollments[0]).toMatchObject({studentId:ids.student,email:'student@example.test',status:'pending',approvedAt:null});
  const approved=await approve(f);expect(approved.enrollment).toMatchObject({studentId:ids.student,status:'approved',requestedAt:requests[0].enrollment.requestedAt});expect(approved.enrollment.approvedAt).toBeTruthy();
  const again=await t.mutation(app.api.enrollment.requestEnrollment,auth.student);expect(again).toEqual({enrollment:{status:'approved',requestedAt:approved.enrollment.requestedAt,approvedAt:approved.enrollment.approvedAt},canViewLessons:true});
  const lesson=(await t.query(app.api.academy.getLesson,{...auth.student,id:lessonId})).lesson;expect(lesson.canWatch).toBe(true);expect(lesson.videoUrl).toMatch(/^\/api\/files\//);expect(lesson.resources).toHaveLength(1);expect(lesson.chapters[0].code).toBe('private lesson source');expect((await t.query(app.api.academy.stats,bridge)).enrolledStudents).toBe(1);
 });
 it('blocks student/mentor self-approval and rejects invalid student targets',async()=>{
  const f=await fixture();for(const caller of [f.auth.student,f.auth.mentor]){await expect(f.t.mutation(app.api.enrollment.setEnrollment,{...caller,studentId:f.ids.student,status:'approved'})).rejects.toMatchObject({data:{status:403}});await expect(f.t.query(app.api.enrollment.listEnrollments,caller)).rejects.toMatchObject({data:{status:403}});}
  await expect(f.t.mutation(app.api.enrollment.requestEnrollment,f.auth.mentor)).rejects.toMatchObject({data:{status:403}});await expect(f.t.mutation(app.api.enrollment.requestEnrollment,bridge)).rejects.toMatchObject({data:{status:401}});await expect(f.t.query(app.api.enrollment.getEnrollment,{...bridge,serverSecret:'wrong'})).rejects.toMatchObject({data:{status:403}});
  await expect(f.t.mutation(app.api.enrollment.setEnrollment,{...f.auth.admin,studentId:f.ids.mentor,status:'approved'})).rejects.toMatchObject({data:{status:404}});await expect(f.t.mutation(app.api.enrollment.setEnrollment,{...f.auth.admin,studentId:randomUUID(),status:'approved'})).rejects.toMatchObject({data:{status:404}});
 });
 it('revokes every content API while preserving issued certificates and private records',async()=>{
  const f=await fixture();const{t,auth,lessonId,videoId}=f;await t.mutation(app.api.enrollment.requestEnrollment,auth.student);await approve(f);
  expect(await t.query(app.api['fileStorage'].readFile,{...auth.student,id:videoId})).toHaveProperty('url');await t.mutation(app.api.academy.saveProgress,{...auth.student,lessonId,position:60,completed:true});await t.mutation(app.api.academy.createNote,{...auth.student,id:randomUUID(),lessonId,position:10,body:'A preserved private note'});await t.mutation(app.api.academy.createQuestion,{...auth.student,id:randomUUID(),lessonId,position:10,body:'A preserved question'});
  const issued=await t.mutation(app.api.academy.issueCertificate,{...auth.student,id:randomUUID(),courseId:'0'});await t.mutation(app.api.enrollment.setEnrollment,{...auth.admin,studentId:f.ids.student,status:'revoked'});
  expect(await t.query(app.api.enrollment.getEnrollment,auth.student)).toMatchObject({enrollment:{status:'revoked',approvedAt:null},canViewLessons:false});await expectContentDenied(f);expect((await t.query(app.api.academy.listLessons,auth.student)).lessons[0]).toMatchObject({canWatch:false,videoUrl:null,resources:[],chapters:[]});expect((await t.query(app.api.academy.stats,bridge)).enrolledStudents).toBe(0);
  expect(await t.query(app.api.academy.publicCertificate,{...bridge,id:issued.certificate.id})).toEqual(issued.certificate);expect(await t.query(app.api.academy.downloadCertificate,{...auth.student,id:issued.certificate.id})).toEqual(issued.certificate);expect((await t.query(app.api.academy.certificates,auth.student)).certificates).toEqual([issued.certificate]);expect((await t.mutation(app.api.academy.issueCertificate,{...auth.student,id:randomUUID(),courseId:'0'})).created).toBe(false);
  await expect(t.mutation(app.api.academy.issueCertificate,{...auth.student,id:randomUUID(),courseId:'1'})).rejects.toMatchObject({data:{status:403}});
  await approve(f);expect((await t.query(app.api.academy.listNotes,{...auth.student,lessonId})).notes).toHaveLength(1);expect((await t.query(app.api.academy.getProgress,{...auth.student,lessonId})).progress.completed).toBe(true);
 });
 it('preserves existing approvals and makes a revoked re-request pending again',async()=>{
  const f=await fixture();await approve(f);const old='2025-01-02T03:04:05.000Z';await f.t.run(async ctx=>{const row=await ctx.db.query('programEnrollments').withIndex('by_studentId',q=>q.eq('studentId',f.ids.student)).unique();await ctx.db.patch(row!._id,{requestedAt:old,approvedAt:old});});
  expect((await approve(f)).enrollment.approvedAt).toBe(old);const approvedRequest=await f.t.mutation(app.api.enrollment.requestEnrollment,f.auth.student);expect(approvedRequest.enrollment).toEqual({status:'approved',requestedAt:old,approvedAt:old});
  const revoked=await f.t.mutation(app.api.enrollment.setEnrollment,{...f.auth.admin,studentId:f.ids.student,status:'revoked'});expect(revoked.enrollment).toMatchObject({requestedAt:old,approvedAt:null});const pending=await f.t.mutation(app.api.enrollment.requestEnrollment,f.auth.student);expect(pending.enrollment).toMatchObject({status:'pending',approvedAt:null});expect(pending.enrollment.requestedAt).not.toBe(old);expect(pending.canViewLessons).toBe(false);
 });
});
