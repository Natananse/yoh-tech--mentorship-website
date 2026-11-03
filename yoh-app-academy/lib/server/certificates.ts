import { randomUUID } from 'node:crypto';
import { courses } from '../academy-data';
import type { Certificate,CertificateEligibility,User } from '../platform-types';
import { getDb } from './db';
import { ApiError } from './http';

type CertificateRow={id:string;user_id:string;course_id:string;course_title:string;recipient_name:string;completed_lesson_count:number;issued_at:string};
const validId=(id:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const courseTitle=(id:string)=>courses[Number(id)]?.title||`Course ${id}`;
function publicRecord(row:CertificateRow):Certificate{
 const origin=(process.env.YOH_APP_URL||'').replace(/\/$/,'');
 return{id:row.id,courseId:row.course_id,courseTitle:row.course_title,recipientName:row.recipient_name,completedLessonCount:row.completed_lesson_count,issuedAt:row.issued_at,verifyUrl:`${origin}/verify/${row.id}`,pdfUrl:`/api/certificates/${row.id}/pdf`};
}
export function readPublicCertificate(id:string):Certificate|null{
 if(!validId(id))return null;
 const row=getDb().prepare('SELECT * FROM certificates WHERE id=?').get(id) as CertificateRow|undefined;
 return row?publicRecord(row):null;
}
export function certificateOwner(id:string):string|null{
 if(!validId(id))return null;
 const row=getDb().prepare('SELECT user_id FROM certificates WHERE id=?').get(id) as {user_id:string}|undefined;
 return row?.user_id||null;
}
export function listCertificates(userId:string):Certificate[]{
 return (getDb().prepare('SELECT * FROM certificates WHERE user_id=? ORDER BY issued_at DESC').all(userId) as CertificateRow[]).map(publicRecord);
}
export function certificateEligibility(userId:string):CertificateEligibility[]{
 const rows=getDb().prepare(`SELECT l.course_id,count(*) total,sum(CASE WHEN p.completed=1 THEN 1 ELSE 0 END) completed
   FROM lessons l LEFT JOIN progress p ON p.lesson_id=l.id AND p.user_id=?
   WHERE l.published=1 AND EXISTS(SELECT 1 FROM files f WHERE f.lesson_id=l.id AND f.kind='video')
   GROUP BY l.course_id ORDER BY min(l.created_at)`).all(userId) as {course_id:string;total:number;completed:number}[];
 return rows.map(row=>({courseId:row.course_id,courseTitle:courseTitle(row.course_id),publishedLessons:row.total,completedLessons:row.completed,eligible:row.total>0&&row.total===row.completed}));
}
export function issueCertificate(user:User,courseId:string):{certificate:Certificate;created:boolean}{
 if(user.role!=='student')throw new ApiError(403,'Completion certificates are issued to student accounts.');
 if(!/^[a-zA-Z0-9_-]{1,80}$/.test(courseId))throw new ApiError(400,'Choose a valid course.');
 const db=getDb();db.exec('BEGIN IMMEDIATE');
 try{
  const existing=db.prepare('SELECT * FROM certificates WHERE user_id=? AND course_id=?').get(user.id,courseId) as CertificateRow|undefined;
  if(existing){db.exec('COMMIT');return{certificate:publicRecord(existing),created:false};}
  const eligibility=certificateEligibility(user.id).find(course=>course.courseId===courseId);
  if(!eligibility)throw new ApiError(400,'This course does not have published lessons yet.');
  if(!eligibility.eligible)throw new ApiError(400,'Complete every published lesson in this course before requesting its certificate.');
  const id=randomUUID();db.prepare('INSERT INTO certificates(id,user_id,course_id,course_title,recipient_name,completed_lesson_count) VALUES(?,?,?,?,?,?)').run(id,user.id,courseId,eligibility.courseTitle,user.name,eligibility.completedLessons);
  const row=db.prepare('SELECT * FROM certificates WHERE id=?').get(id) as CertificateRow;db.exec('COMMIT');return{certificate:publicRecord(row),created:true};
 }catch(error){db.exec('ROLLBACK');throw error;}
}
