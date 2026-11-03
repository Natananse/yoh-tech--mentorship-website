import { convexEnabled,convexMutation,convexQuery } from '../../../lib/server/convex-client';
import { randomUUID } from 'node:crypto';
import { getUser,requireMentor } from '../../../lib/server/auth';
import { getDb } from '../../../lib/server/db';
import { ApiError,assertSameOrigin,handleError,json,number,readJson,text } from '../../../lib/server/http';
import { findLesson,listLessons,parseChapters } from '../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{if(convexEnabled())return json(await convexQuery('academy:listLessons',{},request));return json({lessons:await listLessons(await getUser(request))});}catch(error){return handleError(error);}}
export async function POST(request:Request){try{
 assertSameOrigin(request);const user=await requireMentor(request);const body=await readJson(request);const title=text(body.title,'Title',3,160);const description=text(body.description??'','Description',0,5000);const courseId=text(body.courseId,'Course',1,80);
 if(!/^[a-zA-Z0-9_-]+$/.test(courseId))throw new ApiError(400,'Choose a valid course.');if(body.published===true)throw new ApiError(400,'Create a draft and upload a video before publishing.');
 const id=randomUUID();if(convexEnabled())return json(await convexMutation('academy:createLesson',{id,title,description,courseId,duration:number(body.duration),chapters:parseChapters(body.chapters)},request),201);await getDb().run('INSERT INTO lessons(id,title,description,course_id,mentor_id,duration,chapters) VALUES(?,?,?,?,?,?,?)',id,title,description,courseId,user.id,number(body.duration),JSON.stringify(parseChapters(body.chapters)));
 return json({lesson:await findLesson(id)},201);
}catch(error){return handleError(error);}}
