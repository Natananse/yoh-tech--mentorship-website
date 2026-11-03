import { createHash,randomUUID } from 'node:crypto';
import { mkdtemp,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll,beforeAll,beforeEach,describe,expect,it,vi } from 'vitest';
import type { User } from '../lib/platform-types';

let temporary:string;
let db:ReturnType<(typeof import('../lib/server/db'))['getDb']>;
let routes:{enrollment:typeof import('../app/api/enrollment/route');enrollments:typeof import('../app/api/enrollments/route');set:typeof import('../app/api/enrollments/[studentId]/route');lessons:typeof import('../app/api/lessons/route');lesson:typeof import('../app/api/lessons/[id]/route');dashboard:typeof import('../app/api/dashboard/route');file:typeof import('../app/api/files/[id]/route');progress:typeof import('../app/api/progress/[lessonId]/route');notes:typeof import('../app/api/lessons/[id]/notes/route');questions:typeof import('../app/api/lessons/[id]/questions/route');certificates:typeof import('../app/api/certificates/route');certificate:typeof import('../app/api/certificates/[id]/route');pdf:typeof import('../app/api/certificates/[id]/pdf/route');stats:typeof import('../app/api/stats/route')};
const people={} as Record<'student'|'second'|'mentor'|'otherMentor'|'admin',User&{token:string}>;
const lessonId=randomUUID(),draftId=randomUUID(),otherCourseId=randomUUID(),videoId=randomUUID(),resourceId=randomUUID();
const context=(id:string)=>({params:Promise.resolve({id})});
const progressContext=()=>({params:Promise.resolve({lessonId})});
function request(endpoint:string,actor?:keyof typeof people,method='GET',body?:unknown){return new Request(`http://localhost:3002/api/${endpoint}`,{method,headers:{...(actor?{cookie:`yoh_session=${people[actor].token}`}:{ }),...(method==='GET'||method==='HEAD'?{}:{origin:'http://localhost:3002','content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});}
async function approve(actor:'student'|'second'='student'){
 const response=await routes.set.PATCH(request(`enrollments/${people[actor].id}`,'admin','PATCH',{status:'approved'}),{params:Promise.resolve({studentId:people[actor].id})});expect(response.status).toBe(200);
}
beforeAll(async()=>{
 temporary=await mkdtemp(path.join(tmpdir(),'yoh-local-enrollment-'));
 vi.stubEnv('YOH_DATA_DIR',temporary);vi.stubEnv('CONVEX_URL','');vi.stubEnv('NEXT_PUBLIC_CONVEX_URL','');vi.stubEnv('VERCEL','');vi.stubEnv('YOH_APP_URL','http://localhost:3002');
 vi.resetModules();db=(await import('../lib/server/db')).getDb();
 routes={enrollment:await import('../app/api/enrollment/route'),enrollments:await import('../app/api/enrollments/route'),set:await import('../app/api/enrollments/[studentId]/route'),lessons:await import('../app/api/lessons/route'),lesson:await import('../app/api/lessons/[id]/route'),dashboard:await import('../app/api/dashboard/route'),file:await import('../app/api/files/[id]/route'),progress:await import('../app/api/progress/[lessonId]/route'),notes:await import('../app/api/lessons/[id]/notes/route'),questions:await import('../app/api/lessons/[id]/questions/route'),certificates:await import('../app/api/certificates/route'),certificate:await import('../app/api/certificates/[id]/route'),pdf:await import('../app/api/certificates/[id]/pdf/route'),stats:await import('../app/api/stats/route')};
 for(const[name,role]of [['student','student'],['second','student'],['mentor','mentor'],['otherMentor','mentor'],['admin','admin']] as const)people[name]={id:randomUUID(),name:`Test ${name}`,email:`${name}@example.test`,role,token:randomUUID().replaceAll('-','').repeat(2)};
 await writeFile(path.join(temporary,'uploads','test.mp4'),Buffer.from('0000ftyp-testvideo'));
 await writeFile(path.join(temporary,'uploads','resource.zip'),Buffer.from('PK-resource'));
});
beforeEach(async()=>{
 await db.transaction(async tx=>{
  for(const table of ['program_enrollments','certificates','lesson_questions','lesson_notes','lesson_views','progress','enrollments','files','lessons','sessions','users'])await tx.run(`DELETE FROM ${table}`);
  for(const user of Object.values(people)){await tx.run('INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)',user.id,user.name,user.email,'test-not-a-login-hash',user.role);await tx.run('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)',createHash('sha256').update(user.token).digest('hex'),user.id,Date.now()+600000,Date.now());}
  for(const[id,published,course]of [[lessonId,1,'0'],[otherCourseId,1,'1'],[draftId,0,'0']] as const){await tx.run('INSERT INTO lessons(id,title,description,course_id,mentor_id,duration,published,chapters) VALUES(?,?,?,?,?,?,?,?)',id,'A lesson with protected content','Public description',course,people.mentor.id,100,published,JSON.stringify([{title:'Protected chapter',time:0,code:'protected-code'}]));await tx.run('INSERT INTO files(id,lesson_id,kind,original_name,storage_name,mime,size) VALUES(?,?,?,?,?,?,?)',id===lessonId?videoId:randomUUID(),id,'video','test.mp4',id===lessonId?'test.mp4':`${id}.mp4`,'video/mp4',18);}
  await tx.run('INSERT INTO files(id,lesson_id,kind,original_name,storage_name,mime,size) VALUES(?,?,?,?,?,?,?)',resourceId,lessonId,'resource','resource.zip','resource.zip','application/zip',11);
  // Legacy course activity must never silently grant program approval.
  await tx.run('INSERT INTO enrollments(user_id,course_id) VALUES(?,?)',people.student.id,'0');
  await tx.run('INSERT INTO progress(user_id,lesson_id,position,duration,completed) VALUES(?,?,100,100,1)',people.student.id,lessonId);
 });
});
afterAll(async()=>{const globals=globalThis as typeof globalThis&{__yohDatabase?:{close():void};__yohAsyncDatabase?:unknown;__yohDatabaseSchema?:unknown;__yohDatabasePath?:unknown};globals.__yohDatabase?.close();delete globals.__yohDatabase;delete globals.__yohAsyncDatabase;delete globals.__yohDatabaseSchema;delete globals.__yohDatabasePath;vi.unstubAllEnvs();await rm(temporary,{recursive:true,force:true});});

describe('local administrator-approved enrollment API',()=>{
 it('keeps public metadata visible while denying every content API before approval',async()=>{
  expect(await(await routes.enrollment.GET(request('enrollment'))).json()).toEqual({enrollment:{status:'none',requestedAt:null,approvedAt:null},canViewLessons:false});
  for(const actor of [undefined,'student'] as const){
   const lesson=await(await routes.lesson.GET(request(`lessons/${lessonId}`,actor),context(lessonId))).json();expect(lesson.lesson).toMatchObject({id:lessonId,canWatch:false,videoUrl:null,resources:[],chapters:[]});
   const listed=await(await routes.lessons.GET(request('lessons',actor))).json();expect(listed.lessons).toHaveLength(2);expect(listed.lessons.every((row:any)=>row.canWatch===false&&row.videoUrl===null&&row.resources.length===0&&row.chapters.length===0)).toBe(true);
   expect((await routes.file.GET(request(`files/${videoId}`,actor),context(videoId))).status).toBe(actor?403:401);
   expect((await routes.file.HEAD(request(`files/${resourceId}`,actor,'HEAD'),context(resourceId))).status).toBe(actor?403:401);
  }
  const dashboard=await(await routes.dashboard.GET(request('dashboard','student'))).json();expect(dashboard.progress).toEqual([]);expect(dashboard.lessons.every((lesson:any)=>lesson.canWatch===false)).toBe(true);
  for(const response of [await routes.progress.GET(request(`progress/${lessonId}`,'student'),progressContext()),await routes.progress.PUT(request(`progress/${lessonId}`,'student','PUT',{position:20}),progressContext()),await routes.notes.GET(request(`lessons/${lessonId}/notes`,'student'),context(lessonId)),await routes.notes.POST(request(`lessons/${lessonId}/notes`,'student','POST',{body:'Blocked note'}),context(lessonId)),await routes.questions.GET(request(`lessons/${lessonId}/questions`,'student'),context(lessonId)),await routes.questions.POST(request(`lessons/${lessonId}/questions`,'student','POST',{body:'Blocked question'}),context(lessonId))])expect(response.status).toBe(403);
  expect((await(await routes.stats.GET()).json()).enrolledStudents).toBe(0);expect((await(await routes.certificates.GET(request('certificates','student'))).json()).eligibleCourses).toEqual([]);
  expect((await routes.lesson.GET(request(`lessons/${draftId}`,'student'),context(draftId))).status).toBe(404);
 });
 it('makes requests idempotent and restricts approval and private student records to administrators',async()=>{
  expect((await routes.enrollment.POST(request('enrollment',undefined,'POST'))).status).toBe(401);
  expect((await routes.enrollment.POST(request('enrollment','mentor','POST'))).status).toBe(403);
  const first=await(await routes.enrollment.POST(request('enrollment','student','POST'))).json();const repeated=await(await routes.enrollment.POST(request('enrollment','student','POST'))).json();expect(first).toEqual(repeated);expect(first).toMatchObject({enrollment:{status:'pending',approvedAt:null},canViewLessons:false});
  for(const actor of ['student','mentor'] as const){expect((await routes.enrollments.GET(request('enrollments',actor))).status).toBe(403);expect((await routes.set.PATCH(request(`enrollments/${people.student.id}`,actor,'PATCH',{status:'approved'}),{params:Promise.resolve({studentId:people.student.id})})).status).toBe(403);}
  const records=await(await routes.enrollments.GET(request('enrollments','admin'))).json();expect(records.enrollments).toEqual([{...first.enrollment,studentId:people.student.id,name:people.student.name,email:people.student.email}]);
  expect((await routes.set.PATCH(request('enrollments/missing','admin','PATCH',{status:'approved'}),{params:Promise.resolve({studentId:'missing'})})).status).toBe(404);
  expect((await routes.set.PATCH(request('enrollments/mentor','admin','PATCH',{status:'approved'}),{params:Promise.resolve({studentId:people.mentor.id})})).status).toBe(404);
  expect((await routes.set.PATCH(request('enrollments/student','admin','PATCH',{status:'pending'}),{params:Promise.resolve({studentId:people.student.id})})).status).toBe(400);
  await approve();const approved=await(await routes.enrollment.GET(request('enrollment','student'))).json();expect(approved).toMatchObject({enrollment:{status:'approved',requestedAt:first.enrollment.requestedAt},canViewLessons:true});expect(approved.enrollment.approvedAt).toBeTypeOf('string');expect(await(await routes.enrollment.POST(request('enrollment','student','POST'))).json()).toEqual(approved);
  expect((await(await routes.stats.GET()).json()).enrolledStudents).toBe(1);
 });
 it('allows approved students content and activity while preserving mentor and draft ownership rules',async()=>{
  await approve();const lesson=await(await routes.lesson.GET(request(`lessons/${lessonId}`,'student'),context(lessonId))).json();expect(lesson.lesson).toMatchObject({canWatch:true,videoUrl:`/api/files/${videoId}`});expect(lesson.lesson.chapters[0].code).toBe('protected-code');expect(lesson.lesson.resources).toHaveLength(1);
  const video=await routes.file.GET(request(`files/${videoId}`,'student'),context(videoId));expect(video.status).toBe(200);expect((await video.arrayBuffer()).byteLength).toBe(18);expect((await routes.file.HEAD(request(`files/${resourceId}`,'student','HEAD'),context(resourceId))).status).toBe(200);
  expect((await routes.progress.PUT(request(`progress/${lessonId}`,'student','PUT',{position:100,completed:true}),progressContext())).status).toBe(200);
  expect((await routes.notes.POST(request(`lessons/${lessonId}/notes`,'student','POST',{body:'Approved note',position:21}),context(lessonId))).status).toBe(201);
  expect((await routes.questions.POST(request(`lessons/${lessonId}/questions`,'student','POST',{body:'Approved question',position:22}),context(lessonId))).status).toBe(201);
  expect((await(await routes.dashboard.GET(request('dashboard','student'))).json()).progress).toHaveLength(1);
  expect((await(await routes.certificates.GET(request('certificates','student'))).json()).eligibleCourses.find((row:any)=>row.courseId==='0').eligible).toBe(true);
  for(const actor of ['mentor','otherMentor','admin'] as const)expect((await(await routes.lesson.GET(request(`lessons/${lessonId}`,actor),context(lessonId))).json()).lesson.canWatch).toBe(true);
  expect((await routes.lesson.GET(request(`lessons/${draftId}`,'mentor'),context(draftId))).status).toBe(200);expect((await routes.lesson.GET(request(`lessons/${draftId}`,'admin'),context(draftId))).status).toBe(200);expect((await routes.lesson.GET(request(`lessons/${draftId}`,'otherMentor'),context(draftId))).status).toBe(404);
 });
 it('revokes future content access without destroying activity or existing issued certificates',async()=>{
  await approve();const issued=await routes.certificates.POST(request('certificates','student','POST',{courseId:'0'}));expect(issued.status).toBe(201);const{certificate}=await issued.json();
  await db.run('INSERT INTO progress(user_id,lesson_id,position,duration,completed) VALUES(?,?,100,100,1)',people.student.id,otherCourseId);
  const revoked=await routes.set.PATCH(request(`enrollments/${people.student.id}`,'admin','PATCH',{status:'revoked'}),{params:Promise.resolve({studentId:people.student.id})});expect((await revoked.json()).enrollment).toMatchObject({status:'revoked',approvedAt:null});
  expect((await routes.file.GET(request(`files/${videoId}`,'student'),context(videoId))).status).toBe(403);expect((await routes.progress.GET(request(`progress/${lessonId}`,'student'),progressContext())).status).toBe(403);expect((await routes.notes.GET(request(`lessons/${lessonId}/notes`,'student'),context(lessonId))).status).toBe(403);expect((await routes.questions.GET(request(`lessons/${lessonId}/questions`,'student'),context(lessonId))).status).toBe(403);
  expect((await routes.certificates.POST(request('certificates','student','POST',{courseId:'1'}))).status).toBe(403);const retained=await(await routes.certificates.GET(request('certificates','student'))).json();expect(retained.eligibleCourses).toEqual([]);expect(retained.certificates[0].id).toBe(certificate.id);
  expect((await routes.certificate.GET(request(`certificates/${certificate.id}`),context(certificate.id))).status).toBe(200);const pdf=await routes.pdf.GET(request(`certificates/${certificate.id}/pdf`,'student'),context(certificate.id));expect(pdf.status).toBe(200);expect(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString()).toBe('%PDF-');
  expect((await db.get<{total:number}>('SELECT count(*) total FROM progress WHERE user_id=?',people.student.id))?.total).toBe(2);expect((await(await routes.stats.GET()).json()).enrolledStudents).toBe(0);
  const reapplied=await(await routes.enrollment.POST(request('enrollment','student','POST'))).json();expect(reapplied).toMatchObject({enrollment:{status:'pending',approvedAt:null},canViewLessons:false});
 });
});
