import { convexEnabled,convexMutation,convexQuery } from '../../../../lib/server/convex-client';
import { requireUser } from '../../../../lib/server/auth';
import { getDb } from '../../../../lib/server/db';
import { ApiError,assertSameOrigin,handleError,json,number,readJson } from '../../../../lib/server/http';
import { getProgress,requireLesson } from '../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{lessonId:string}>};
export async function GET(request:Request,{params}:Context){try{const{lessonId}=await params;const user=await requireUser(request);if(convexEnabled())return json(await convexQuery('academy:getProgress',{lessonId},request));await requireLesson(lessonId,user);return json({progress:await getProgress(user.id,lessonId)});}catch(error){return handleError(error);}}
export async function PUT(request:Request,{params}:Context){try{
 const{lessonId}=await params;assertSameOrigin(request);const user=await requireUser(request);const body=await readJson(request);
 if(convexEnabled()){
  if(body.completed!==undefined&&typeof body.completed!=='boolean')throw new ApiError(400,'Completed must be true or false.');
  return json(await convexMutation('academy:saveProgress',{lessonId,...(body.position===undefined?{}:{position:number(body.position)}),...(body.duration===undefined?{}:{duration:number(body.duration)}),...(body.completed===undefined?{}:{completed:body.completed as boolean})},request));
 }
 const progress=await getDb().transaction(async transaction=>{
  const lesson=await requireLesson(lessonId,user,transaction);
  const previous=await getProgress(user.id,lesson.id,transaction);const requestedDuration=number(body.duration,previous.duration);const duration=lesson.duration>0?lesson.duration:requestedDuration;const requestedPosition=number(body.position,previous.position);const position=duration>0?Math.min(requestedPosition,duration):requestedPosition;const completed=body.completed===undefined?previous.completed:body.completed;if(typeof completed!=='boolean')throw new ApiError(400,'Completed must be true or false.');
  await transaction.run("INSERT INTO progress(user_id,lesson_id,position,duration,completed) VALUES(?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET position=excluded.position,duration=excluded.duration,completed=excluded.completed,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')",user.id,lesson.id,position,duration,completed?1:0);
  if(user.role==='student'){await transaction.run('INSERT OR IGNORE INTO enrollments(user_id,course_id) VALUES(?,?)',user.id,lesson.courseId);if(position>0)await transaction.run('INSERT OR IGNORE INTO lesson_views(user_id,lesson_id) VALUES(?,?)',user.id,lesson.id);}
  return getProgress(user.id,lesson.id,transaction);
 });return json({progress});
}catch(error){return handleError(error);}}
