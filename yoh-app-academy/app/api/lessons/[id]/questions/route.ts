import { convexEnabled,convexMutation,convexQuery } from '../../../../../lib/server/convex-client';
import { randomUUID } from 'node:crypto';
import { requireUser } from '../../../../../lib/server/auth';
import { getDb } from '../../../../../lib/server/db';
import { listQuestions } from '../../../../../lib/server/discussion';
import { ApiError,assertSameOrigin,handleError,json,number,readJson,text } from '../../../../../lib/server/http';
import { requireLesson } from '../../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){try{const{id}=await params;const user=await requireUser(request);if(convexEnabled())return json(await convexQuery('academy:listQuestions',{lessonId:id},request));await requireLesson(id,user);return json({questions:await listQuestions(id)});}catch(error){return handleError(error);}}
export async function POST(request:Request,{params}:Context){try{
 const{ id:lessonId}=await params;assertSameOrigin(request);const user=await requireUser(request);const payload=await readJson(request);const body=text(payload.body,'Question',1,4000);const position=payload.position===undefined||payload.position===null?null:number(payload.position);
 if(convexEnabled())return json(await convexMutation('academy:createQuestion',{id:randomUUID(),lessonId,position,body},request),201);
 const question=await getDb().transaction(async transaction=>{
  await requireLesson(lessonId,user,transaction);
  const count=await transaction.get<{total:number}>('SELECT count(*) total FROM lesson_questions WHERE user_id=? AND lesson_id=?',user.id,lessonId);if((count?.total||0)>=100)throw new ApiError(400,'You have reached 100 questions for this lesson.');
  const id=randomUUID();await transaction.run('INSERT INTO lesson_questions(id,user_id,lesson_id,position,body) VALUES(?,?,?,?,?)',id,user.id,lessonId,position,body);
  return(await listQuestions(lessonId,transaction)).find(question=>question.id===id);
 });return json({question},201);
}catch(error){return handleError(error);}}
