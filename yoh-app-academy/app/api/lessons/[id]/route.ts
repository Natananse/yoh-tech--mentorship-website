import { getUser,requireMentor } from '../../../../lib/server/auth';
import { getDb } from '../../../../lib/server/db';
import { ApiError,assertSameOrigin,handleError,json,number,readJson,text } from '../../../../lib/server/http';
import { findLesson,parseChapters,requireLesson,requireLessonOwner } from '../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request,{params}:{params:{id:string}}){try{return json({lesson:requireLesson(params.id,getUser(request))});}catch(error){return handleError(error);}}
export async function PATCH(request:Request,{params}:{params:{id:string}}){try{
 assertSameOrigin(request);const user=requireMentor(request);const old=requireLessonOwner(params.id,user);const body=await readJson(request);
 const title=body.title===undefined?old.title:text(body.title,'Title',3,160);const description=body.description===undefined?old.description:text(body.description,'Description',0,5000);
 const courseId=body.courseId===undefined?old.courseId:text(body.courseId,'Course',1,80);if(!/^[a-zA-Z0-9_-]+$/.test(courseId))throw new ApiError(400,'Choose a valid course.');
 const published=body.published===undefined?old.published:body.published;if(typeof published!=='boolean')throw new ApiError(400,'Published must be true or false.');
 if(published&&!old.videoUrl)throw new ApiError(400,'Upload a video before publishing this lesson.');
 const chapters=body.chapters===undefined?old.chapters:parseChapters(body.chapters);
 getDb().prepare("UPDATE lessons SET title=?,description=?,course_id=?,duration=?,published=?,chapters=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(title,description,courseId,number(body.duration,old.duration),published?1:0,JSON.stringify(chapters),old.id);
 return json({lesson:findLesson(old.id)});
}catch(error){return handleError(error);}}
