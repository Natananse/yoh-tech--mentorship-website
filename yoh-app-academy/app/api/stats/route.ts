import { convexEnabled,convexMutation,convexQuery } from '../../../lib/server/convex-client';
import { getDb } from '../../../lib/server/db';
import { handleError,json } from '../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{if(convexEnabled())return json(await convexQuery('academy:stats'));const db=getDb();return json({
 publishedLessons:(await db.get("SELECT count(*) total FROM lessons l WHERE published=1 AND EXISTS(SELECT 1 FROM files f WHERE f.lesson_id=l.id AND f.kind='video')") as {total:number}).total,
 enrolledStudents:(await db.get("SELECT count(*) total FROM program_enrollments e JOIN users u ON u.id=e.user_id WHERE e.status='approved' AND u.role='student'") as {total:number}).total,
 completedLessons:(await db.get("SELECT count(*) total FROM progress p JOIN users u ON u.id=p.user_id WHERE p.completed=1 AND u.role='student'") as {total:number}).total
});}catch(error){return handleError(error);}}
