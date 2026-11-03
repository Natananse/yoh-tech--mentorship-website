import { randomUUID } from 'node:crypto';
import { defineTestApp } from 'convex-test';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import schema from '../convex/schema';
import * as academy from '../convex/academy';

const app=defineTestApp({schema}).defineModules({academy});
const bridge={requestTime:Date.now(),serverSecret:'test-only-private-bridge-secret-1234567890'};
const passwordHash=`${'a'.repeat(32)}:${'b'.repeat(128)}`;
const invitation='test-only-mentor-invitation';
async function fixture(){
 const t=app.createTest();
 const users=[];
 const roles=['mentor','mentor','student','student'];
 for(let index=0;index<roles.length;index++){
  const role=roles[index];
  const user=await t.mutation(app.api.academy.registerUser,{...bridge,id:randomUUID(),name:index===2?'ሐና Tesfaye':`Test ${role} ${index}`,email:`user${index}@example.test`,passwordHash,role:role as 'mentor'|'student',...(role==='mentor'?{inviteCode:invitation}:{})});
  const sessionHash=String(index+1).repeat(64);await t.mutation(app.api.academy.createSession,{...bridge,userId:user.id,tokenHash:sessionHash,expiresAt:Date.now()+3600000});users.push({auth:{...bridge,sessionHash},user});
  if(role==='student')await t.run(ctx=>ctx.db.insert('programEnrollments',{studentId:user.id,status:'approved',requestedAt:null,approvedAt:new Date().toISOString()}));
 }
 return{t,mentor:users[0].auth,otherMentor:users[1].auth,student:users[2].auth,otherStudent:users[3].auth,mentorRecord:users[0].user,studentRecord:users[2].user};
}
async function draft(t:ReturnType<typeof app.createTest>,auth:typeof bridge&{sessionHash:string},courseId='0'){
 return(await t.mutation(app.api.academy.createLesson,{...auth,id:randomUUID(),title:'A real published lesson',description:'A lesson used to verify persisted activity.',courseId,duration:120,chapters:[{title:'Start',time:0}]})).lesson;
}
async function publish(t:ReturnType<typeof app.createTest>,auth:typeof bridge&{sessionHash:string},id:string){
 await t.run(async ctx=>{const storageName=await ctx.storage.store(new Blob(['test video fixture'],{type:'video/mp4'}));await ctx.db.insert('files',{id:randomUUID(),lessonId:id,kind:'video',originalName:'lesson.mp4',storageName,mime:'video/mp4',size:18,createdAt:new Date().toISOString()});});
 return(await t.mutation(app.api.academy.updateLesson,{...auth,id,published:true})).lesson;
}
beforeEach(()=>{vi.stubEnv('YOH_CONVEX_SERVER_SECRET',bridge.serverSecret);vi.stubEnv('YOH_MENTOR_INVITE',invitation);});
afterEach(()=>vi.unstubAllEnvs());

describe('Convex academy authorization and persisted behavior',()=>{
 it('protects credentials and privileged mutations with both bridge and server-side sessions',async()=>{
  const{t,mentor,student,mentorRecord,studentRecord}=await fixture();
  await expect(t.query(app.api.academy.credentials,{...bridge,serverSecret:'wrong',email:studentRecord.email})).rejects.toMatchObject({data:{status:403}});
  const me=await t.query(app.api.academy.me,student);expect(me).toEqual(studentRecord);expect(me).not.toHaveProperty('passwordHash');
  await expect(draft(t,student)).rejects.toMatchObject({data:{status:403}});
  await expect(t.mutation(app.api.academy.registerUser,{...bridge,id:randomUUID(),name:'Uninvited mentor',email:'uninvited@example.test',passwordHash,role:'mentor',inviteCode:'wrong'})).rejects.toMatchObject({data:{status:403}});
  await t.mutation(app.api.academy.logout,mentor);expect(await t.query(app.api.academy.me,mentor)).toBeNull();await expect(draft(t,mentor)).rejects.toMatchObject({data:{status:401}});
 });
 it('requires a finite safe nonnegative server request time on every call',async()=>{
  const t=app.createTest();
  for(const requestTime of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])await expect(t.query(app.api.academy.me,{...bridge,requestTime})).rejects.toMatchObject({data:{status:400}});
  await expect(t.query(app.api.academy.me,{serverSecret:bridge.serverSecret} as unknown as typeof bridge)).rejects.toThrow(/requestTime/);
  expect(await t.query(app.api.academy.me,{...bridge,requestTime:0})).toBeNull();
 });
 it('expires the same cached-query session when only the trusted request time advances',async()=>{
  const{t,mentor,student,studentRecord}=await fixture();const lesson=await draft(t,mentor);await publish(t,mentor,lesson.id);
  const session=await t.run(ctx=>ctx.db.query('sessions').withIndex('by_tokenHash',q=>q.eq('tokenHash',student.sessionHash)).unique());
  const before={...student,requestTime:session!.expiresAt-1};const expired={...student,requestTime:session!.expiresAt};
  expect(await t.query(app.api.academy.me,before)).toEqual(studentRecord);expect((await t.query(app.api.academy.getLesson,{...before,id:lesson.id})).lesson.canWatch).toBe(true);
  expect(await t.query(app.api.academy.me,expired)).toBeNull();expect(await t.query(app.api.academy.me,{...expired,requestTime:expired.requestTime+1})).toBeNull();
  expect((await t.query(app.api.academy.getLesson,{...expired,id:lesson.id})).lesson).toMatchObject({canWatch:false,videoUrl:null,resources:[],chapters:[]});
  await expect(t.query(app.api.academy.getProgress,{...expired,lessonId:lesson.id})).rejects.toMatchObject({data:{status:401}});
  expect(await t.run(ctx=>ctx.db.query('sessions').withIndex('by_tokenHash',q=>q.eq('tokenHash',student.sessionHash)).unique())).toEqual(session);
 });
 it('keeps drafts private and enforces lesson ownership in Convex',async()=>{
  const{t,mentor,otherMentor,student,mentorRecord,studentRecord}=await fixture();const lesson=await draft(t,mentor);
  expect((await t.query(app.api.academy.listLessons,bridge)).lessons).toHaveLength(0);
  await expect(t.query(app.api.academy.getLesson,{...student,id:lesson.id})).rejects.toMatchObject({data:{status:404}});
  await expect(t.mutation(app.api.academy.updateLesson,{...otherMentor,id:lesson.id,title:'Unauthorized change'})).rejects.toMatchObject({data:{status:403}});
  await expect(t.mutation(app.api.academy.updateLesson,{...mentor,id:lesson.id,published:true})).rejects.toMatchObject({data:{status:400}});
  await publish(t,mentor,lesson.id);expect((await t.query(app.api.academy.listLessons,bridge)).lessons[0]).toMatchObject({canWatch:false,videoUrl:null,resources:[],chapters:[]});expect((await t.query(app.api.academy.listLessons,student)).lessons[0].videoUrl).toMatch(/^\/api\/files\//);
 });
 it('enforces an atomic identity-wide login throttle under concurrent requests',async()=>{
  const t=app.createTest();const results=await Promise.allSettled(Array.from({length:24},()=>t.mutation(app.api.academy.throttleAttempt,{...bridge,key:'a'.repeat(64),limit:8})));
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(8);
  expect(results.filter(result=>result.status==='rejected')).toHaveLength(16);
  await t.mutation(app.api.academy.clearThrottle,{...bridge,key:'a'.repeat(64)});await expect(t.mutation(app.api.academy.throttleAttempt,{...bridge,key:'a'.repeat(64),limit:8})).resolves.toBeNull();
 });
 it('persists isolated progress, unique viewers, enrollments, and actual completions',async()=>{
  const{t,mentor,student,otherStudent,mentorRecord,studentRecord}=await fixture();const lesson=await draft(t,mentor);await publish(t,mentor,lesson.id);
  for(let index=0;index<3;index++)await t.mutation(app.api.academy.saveProgress,{...student,lessonId:lesson.id,position:42,duration:120,completed:true});
  await t.mutation(app.api.academy.saveProgress,{...otherStudent,lessonId:lesson.id,position:0,duration:120,completed:false});
  expect((await t.query(app.api.academy.getProgress,{...student,lessonId:lesson.id})).progress).toMatchObject({position:42,completed:true});
  expect((await t.query(app.api.academy.getProgress,{...otherStudent,lessonId:lesson.id})).progress).toMatchObject({position:0,completed:false});
  expect(await t.query(app.api.academy.stats,bridge)).toEqual({publishedLessons:1,enrolledStudents:2,completedLessons:1});
  const analytics=await t.query(app.api.academy.analytics,mentor);expect(analytics.metrics).toEqual({uniqueViewers:1,completions:1,enrollments:2,publishedLessons:1});expect(analytics.lessons[0]).toMatchObject({id:lesson.id,uniqueViewers:1,completions:1,enrollments:2});
  expect((await t.query(app.api.academy.dashboard,student)).progress).toHaveLength(1);
 });
 it('keeps timestamped notes private and allows only the owning mentor to answer Q&A',async()=>{
  const{t,mentor,otherMentor,student,otherStudent,mentorRecord,studentRecord}=await fixture();const lesson=await draft(t,mentor);await publish(t,mentor,lesson.id);
  const note=await t.mutation(app.api.academy.createNote,{...student,id:randomUUID(),lessonId:lesson.id,position:21,body:'Only I can read this note.'});
  expect((await t.query(app.api.academy.listNotes,{...student,lessonId:lesson.id})).notes).toEqual([note.note]);expect((await t.query(app.api.academy.listNotes,{...otherStudent,lessonId:lesson.id})).notes).toEqual([]);expect((await t.query(app.api.academy.listNotes,{...mentor,lessonId:lesson.id})).notes).toEqual([]);
  const {question}=await t.mutation(app.api.academy.createQuestion,{...student,id:randomUUID(),lessonId:lesson.id,position:22,body:'How does this state update work?'});
  await expect(t.mutation(app.api.academy.answerQuestion,{...otherMentor,id:question.id,answer:'A forbidden answer'})).rejects.toMatchObject({data:{status:403}});
  await expect(t.mutation(app.api.academy.answerQuestion,{...otherStudent,id:question.id,answer:'A forbidden answer'})).rejects.toMatchObject({data:{status:403}});
  await t.mutation(app.api.academy.answerQuestion,{...mentor,id:question.id,answer:'The setter schedules the next render.'});const result=await t.query(app.api.academy.listQuestions,{...otherStudent,lessonId:lesson.id});expect(result.questions[0]).toMatchObject({answer:'The setter schedules the next render.',authorName:'ሐና Tesfaye',answeredByName:mentorRecord.name});expect(JSON.stringify(result)).not.toContain(studentRecord.email);
 });
 it('issues one Unicode-safe certificate only after all published video lessons are complete',async()=>{
  const{t,mentor,student,otherStudent,mentorRecord,studentRecord}=await fixture();const first=await draft(t,mentor);const second=await draft(t,mentor);await publish(t,mentor,first.id);await publish(t,mentor,second.id);await draft(t,mentor);
  await t.mutation(app.api.academy.saveProgress,{...student,lessonId:first.id,position:120,completed:true});
  await expect(t.mutation(app.api.academy.issueCertificate,{...student,id:randomUUID(),courseId:'0'})).rejects.toMatchObject({data:{status:400}});
  await t.mutation(app.api.academy.saveProgress,{...student,lessonId:second.id,position:120,completed:true});
  const results=await Promise.all(Array.from({length:5},()=>t.mutation(app.api.academy.issueCertificate,{...student,id:randomUUID(),courseId:'0'})));
  expect(results.filter(row=>row.created)).toHaveLength(1);expect(new Set(results.map(row=>row.certificate.id)).size).toBe(1);const certificate=results[0].certificate;expect(certificate).toMatchObject({recipientName:'ሐና Tesfaye',completedLessonCount:2});
  expect(await t.query(app.api.academy.publicCertificate,{...bridge,requestTime:Number.MAX_SAFE_INTEGER,id:certificate.id})).toEqual(certificate);expect(JSON.stringify(certificate)).not.toContain(studentRecord.email);expect(certificate).not.toHaveProperty('userId');
  await expect(t.query(app.api.academy.downloadCertificate,{...otherStudent,id:certificate.id})).rejects.toMatchObject({data:{status:403}});await expect(t.query(app.api.academy.downloadCertificate,{...student,id:certificate.id})).resolves.toEqual(certificate);
  expect((await t.query(app.api.academy.certificates,student)).certificates).toHaveLength(1);
 });
 it('omits historical progress from the dashboard when a lesson is no longer visible',async()=>{
  const{t,mentor,student}=await fixture();const lesson=await draft(t,mentor);await publish(t,mentor,lesson.id);
  await t.mutation(app.api.academy.saveProgress,{...student,lessonId:lesson.id,position:42,completed:true});
  await t.mutation(app.api.academy.updateLesson,{...mentor,id:lesson.id,published:false});
  const result=await t.query(app.api.academy.dashboard,student);expect(result.lessons).toEqual([]);expect(result.progress).toEqual([]);
  await expect(t.query(app.api.academy.getProgress,{...student,lessonId:lesson.id})).rejects.toMatchObject({data:{status:404}});
 });
 it('keeps administrative role grants behind the private CLI bridge',async()=>{
  const{t,student,mentorRecord,studentRecord}=await fixture();await expect(t.mutation(app.api.academy.adminUpsert,{...bridge,serverSecret:'wrong',id:randomUUID(),name:'Admin',email:studentRecord.email})).rejects.toMatchObject({data:{status:403}});
  await t.mutation(app.api.academy.adminUpsert,{...bridge,id:randomUUID(),name:'Admin',email:studentRecord.email});expect((await t.query(app.api.academy.me,student))?.role).toBe('admin');
 });
});
