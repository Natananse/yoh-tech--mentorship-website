import { convexEnabled,convexMutation,convexQuery } from '../../../lib/server/convex-client';
import { requireUser } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { handleError,json } from '../../../lib/server/http';
import { getProgress,listLessons } from '../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const user=await requireUser(request);if(convexEnabled())return json(await convexQuery('academy:dashboard',{},request));const lessons=(await listLessons(user)).filter(lesson=>user.role==='student'||user.role==='admin'||lesson.mentorId===user.id);
 const rows=await getDb().all<{lesson_id:string}>('SELECT lesson_id FROM progress WHERE user_id=?',user.id);
 return json({user,lessons,progress:await Promise.all(rows.map(row=>getProgress(user.id,row.lesson_id)))});
}catch(error){return handleError(error);}}
