import { requireMentor } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { handleError,json } from '../../../lib/server/http';
import type { MentorAnalytics } from '../../../lib/platform-types';
export const runtime='nodejs';export const dynamic='force-dynamic';

export function GET(request:Request){try{
 const user=requireMentor(request);const db=getDb();const owner=user.role==='admin'?null:user.id;
 const rows=db.prepare(`SELECT l.id,l.title,l.course_id,l.published,u.name mentor_name,
   (SELECT count(*) FROM lesson_views v JOIN users student ON student.id=v.user_id WHERE v.lesson_id=l.id AND student.role='student') unique_viewers,
   (SELECT count(*) FROM progress p JOIN users student ON student.id=p.user_id WHERE p.lesson_id=l.id AND p.completed=1 AND student.role='student') completions,
   (SELECT count(*) FROM enrollments e JOIN users student ON student.id=e.user_id WHERE e.course_id=l.course_id AND student.role='student') enrollments
   FROM lessons l JOIN users u ON u.id=l.mentor_id WHERE (? IS NULL OR l.mentor_id=?) ORDER BY l.created_at DESC`).all(owner,owner) as {id:string;title:string;course_id:string;published:number;mentor_name:string;unique_viewers:number;completions:number;enrollments:number}[];
 const metrics=db.prepare(`SELECT
   (SELECT count(DISTINCT v.user_id) FROM lesson_views v JOIN lessons l ON l.id=v.lesson_id JOIN users student ON student.id=v.user_id WHERE student.role='student' AND (? IS NULL OR l.mentor_id=?)) unique_viewers,
   (SELECT count(*) FROM progress p JOIN lessons l ON l.id=p.lesson_id JOIN users student ON student.id=p.user_id WHERE p.completed=1 AND student.role='student' AND (? IS NULL OR l.mentor_id=?)) completions,
   (SELECT count(DISTINCT e.user_id) FROM enrollments e JOIN users student ON student.id=e.user_id WHERE student.role='student' AND EXISTS(SELECT 1 FROM lessons l WHERE l.course_id=e.course_id AND (? IS NULL OR l.mentor_id=?))) enrollments,
   (SELECT count(*) FROM lessons l WHERE l.published=1 AND (? IS NULL OR l.mentor_id=?)) published_lessons
 `).get(owner,owner,owner,owner,owner,owner,owner,owner) as {unique_viewers:number;completions:number;enrollments:number;published_lessons:number};
 const result:MentorAnalytics={metrics:{uniqueViewers:metrics.unique_viewers,completions:metrics.completions,enrollments:metrics.enrollments,publishedLessons:metrics.published_lessons},lessons:rows.map(row=>({id:row.id,title:row.title,courseId:row.course_id,mentorName:row.mentor_name,published:!!row.published,uniqueViewers:row.unique_viewers,completions:row.completions,enrollments:row.enrollments}))};
 return json(result);
}catch(error){return handleError(error);}}
