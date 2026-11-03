import { randomUUID } from 'node:crypto';
import { courses } from '../academy-data';
import type { Certificate,CertificateEligibility,User } from '../platform-types';
import { getDb,type DataExecutor } from './db';
import { ApiError } from './http';
import { applicationOrigin } from './origin';
import { convexEnabled,convexQuery } from './convex-client';
import { canViewLessons,requireApprovedEnrollment } from './enrollment';

type CertificateRow={id:string;user_id:string;course_id:string;course_title:string;recipient_name:string;completed_lesson_count:number;issued_at:string};
const validId=(id:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const courseTitle=(id:string)=>courses[Number(id)]?.title||`Course ${id}`;
function publicRecord(row:CertificateRow):Certificate{
 const origin=applicationOrigin()||'';return{id:row.id,courseId:row.course_id,courseTitle:row.course_title,recipientName:row.recipient_name,completedLessonCount:row.completed_lesson_count,issuedAt:row.issued_at,verifyUrl:`${origin}/verify/${row.id}`,pdfUrl:`/api/certificates/${row.id}/pdf`};
}
export function certificateLinks(certificate:Certificate):Certificate{
 const origin=applicationOrigin()||'';return{...certificate,verifyUrl:`${origin}/verify/${certificate.id}`,pdfUrl:`/api/certificates/${certificate.id}/pdf`};
}
export async function readPublicCertificate(id:string):Promise<Certificate|null>{
 if(!validId(id))return null;if(convexEnabled()){const certificate=await convexQuery<Certificate|null>('academy:publicCertificate',{id});return certificate?certificateLinks(certificate):null;}
 const row=await getDb().get<CertificateRow>('SELECT * FROM certificates WHERE id=?',id);return row?publicRecord(row):null;
}
export async function certificateOwner(id:string):Promise<string|null>{
 if(!validId(id))return null;const row=await getDb().get<{user_id:string}>('SELECT user_id FROM certificates WHERE id=?',id);return row?.user_id||null;
}
export async function listCertificates(userId:string):Promise<Certificate[]>{return(await getDb().all<CertificateRow>('SELECT * FROM certificates WHERE user_id=? ORDER BY issued_at DESC',userId)).map(publicRecord);}
export async function certificateEligibility(userId:string,executor:DataExecutor=getDb()):Promise<CertificateEligibility[]>{
 const user=await executor.get<User>('SELECT id,name,email,role FROM users WHERE id=?',userId);const canWatch=await canViewLessons(user||null,executor);if(!canWatch)return[];
 const rows=await executor.all<{course_id:string;total:number;completed:number}>(`SELECT l.course_id,count(*) total,sum(CASE WHEN p.completed=1 THEN 1 ELSE 0 END) completed FROM lessons l LEFT JOIN progress p ON p.lesson_id=l.id AND p.user_id=? WHERE l.published=1 AND EXISTS(SELECT 1 FROM files f WHERE f.lesson_id=l.id AND f.kind='video') GROUP BY l.course_id ORDER BY min(l.created_at)`,userId);
 return rows.map(row=>({courseId:row.course_id,courseTitle:courseTitle(row.course_id),publishedLessons:row.total,completedLessons:row.completed,eligible:canWatch&&row.total>0&&row.total===row.completed}));
}
export async function issueCertificate(user:User,courseId:string):Promise<{certificate:Certificate;created:boolean}>{
 if(user.role!=='student')throw new ApiError(403,'Completion certificates are issued to student accounts.');if(!/^[a-zA-Z0-9_-]{1,80}$/.test(courseId))throw new ApiError(400,'Choose a valid course.');
 return getDb().transaction(async transaction=>{
  const existing=await transaction.get<CertificateRow>('SELECT * FROM certificates WHERE user_id=? AND course_id=?',user.id,courseId);if(existing)return{certificate:publicRecord(existing),created:false};
  await requireApprovedEnrollment(user,transaction);
  const eligibility=(await certificateEligibility(user.id,transaction)).find(course=>course.courseId===courseId);
  if(!eligibility)throw new ApiError(400,'This course does not have published lessons yet.');if(!eligibility.eligible)throw new ApiError(400,'Complete every published lesson in this course before requesting its certificate.');
  const id=randomUUID();await transaction.run('INSERT INTO certificates(id,user_id,course_id,course_title,recipient_name,completed_lesson_count) VALUES(?,?,?,?,?,?)',id,user.id,courseId,eligibility.courseTitle,user.name,eligibility.completedLessons);
  const row=await transaction.get<CertificateRow>('SELECT * FROM certificates WHERE id=?',id);return{certificate:publicRecord(row!),created:true};
 });
}
