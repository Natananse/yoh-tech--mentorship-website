import { convexEnabled,convexMutation,convexQuery } from '../../../../lib/server/convex-client';
import { getUser,requireMentor } from '../../../../lib/server/auth';
import { getDb } from '../../../../lib/server/db';
import { ApiError,assertSameOrigin,handleError,json,number,readJson,text } from '../../../../lib/server/http';
import { findLesson,parseChapters,requireLesson,requireLessonOwner } from '../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){try{const{id}=await params;if(convexEnabled())return json(await convexQuery('academy:getLesson',{id},request));return json({lesson:await requireLesson(id,await getUser(request))});}catch(error){return handleError(error);}}
export async function PATCH(request:Request,{params}:Context){try{
 const{id}=await params;assertSameOrigin(request);const user=await requireMentor(request);const body=await readJson(request);
 if(convexEnabled()){
  if(body.published!==undefined&&typeof body.published!=='boolean')throw new ApiError(400,'Published must be true or false.');
  return json(await convexMutation('academy:updateLesson',{id,...(body.title===undefined?{}:{title:text(body.title,'Title',3,160)}),...(body.description===undefined?{}:{description:text(body.description,'Description',0,5000)}),...(body.courseId===undefined?{}:{courseId:text(body.courseId,'Course',1,80)}),...(body.duration===undefined?{}:{duration:number(body.duration)}),...(body.published===undefined?{}:{published:body.published as boolean}),...(body.chapters===undefined?{}:{chapters:parseChapters(body.chapters)})},request));
 }
 const lesson=await getDb().transaction(async transaction=>{
  const old=await requireLessonOwner(id,user,transaction);const title=body.title===undefined?old.title:text(body.title,'Title',3,160);const description=body.description===undefined?old.description:text(body.description,'Description',0,5000);const courseId=body.courseId===undefined?old.courseId:text(body.courseId,'Course',1,80);
  if(!/^[a-zA-Z0-9_-]+$/.test(courseId))throw new ApiError(400,'Choose a valid course.');const published=body.published===undefined?old.published:body.published;if(typeof published!=='boolean')throw new ApiError(400,'Published must be true or false.');if(published&&!old.videoUrl)throw new ApiError(400,'Upload a video before publishing this lesson.');
  const chapters=body.chapters===undefined?old.chapters:parseChapters(body.chapters);
  await transaction.run("UPDATE lessons SET title=?,description=?,course_id=?,duration=?,published=?,chapters=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",title,description,courseId,number(body.duration,old.duration),published?1:0,JSON.stringify(chapters),old.id);
  return findLesson(old.id,transaction);
 });return json({lesson});
}catch(error){return handleError(error);}}
