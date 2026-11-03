import { requireUser } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { handleError,json } from '../../../lib/server/http';
import { getProgress,listLessons } from '../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request){try{
 const user=requireUser(request);const lessons=listLessons(user).filter(lesson=>user.role==='student'||user.role==='admin'||lesson.mentorId===user.id);
 const rows=getDb().prepare('SELECT lesson_id FROM progress WHERE user_id=?').all(user.id) as {lesson_id:string}[];
 return json({user,lessons,progress:rows.map(row=>getProgress(user.id,row.lesson_id))});
}catch(error){return handleError(error);}}
