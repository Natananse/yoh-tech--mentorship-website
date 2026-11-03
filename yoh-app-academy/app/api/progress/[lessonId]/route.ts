import { requireUser } from '../../../../lib/server/auth';
import { getDb } from '../../../../lib/server/db';
import { ApiError,assertSameOrigin,handleError,json,number,readJson } from '../../../../lib/server/http';
import { getProgress,requireLesson } from '../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request,{params}:{params:{lessonId:string}}){try{const user=requireUser(request);requireLesson(params.lessonId,user);return json({progress:getProgress(user.id,params.lessonId)});}catch(error){return handleError(error);}}
export async function PUT(request:Request,{params}:{params:{lessonId:string}}){try{
 assertSameOrigin(request);const user=requireUser(request);const lesson=requireLesson(params.lessonId,user);const body=await readJson(request);const previous=getProgress(user.id,lesson.id);
 const requestedDuration=number(body.duration,previous.duration);const duration=lesson.duration>0?lesson.duration:requestedDuration;
 const requestedPosition=number(body.position,previous.position);const position=duration>0?Math.min(requestedPosition,duration):requestedPosition;
 const completed=body.completed===undefined?previous.completed:body.completed;if(typeof completed!=='boolean')throw new ApiError(400,'Completed must be true or false.');
 const db=getDb();db.prepare("INSERT INTO progress(user_id,lesson_id,position,duration,completed) VALUES(?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET position=excluded.position,duration=excluded.duration,completed=excluded.completed,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')").run(user.id,lesson.id,position,duration,completed?1:0);
 if(user.role==='student'){
  db.prepare('INSERT OR IGNORE INTO enrollments(user_id,course_id) VALUES(?,?)').run(user.id,lesson.courseId);
  if(position>0)db.prepare('INSERT OR IGNORE INTO lesson_views(user_id,lesson_id) VALUES(?,?)').run(user.id,lesson.id);
 }
 return json({progress:getProgress(user.id,lesson.id)});
}catch(error){return handleError(error);}}
