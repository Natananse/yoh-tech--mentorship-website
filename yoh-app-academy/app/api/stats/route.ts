import { getDb } from '../../../lib/server/db';
import { handleError,json } from '../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(){try{const db=getDb();return json({
 publishedLessons:(db.prepare("SELECT count(*) total FROM lessons l WHERE published=1 AND EXISTS(SELECT 1 FROM files f WHERE f.lesson_id=l.id AND f.kind='video')").get() as {total:number}).total,
 enrolledStudents:(db.prepare("SELECT count(DISTINCT e.user_id) total FROM enrollments e JOIN users u ON u.id=e.user_id WHERE u.role='student'").get() as {total:number}).total,
 completedLessons:(db.prepare("SELECT count(*) total FROM progress p JOIN users u ON u.id=p.user_id WHERE p.completed=1 AND u.role='student'").get() as {total:number}).total
});}catch(error){return handleError(error);}}
