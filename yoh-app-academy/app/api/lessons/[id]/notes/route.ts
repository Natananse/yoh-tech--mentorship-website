import { convexEnabled,convexMutation,convexQuery } from '../../../../../lib/server/convex-client';
import { randomUUID } from 'node:crypto';
import { requireUser } from '../../../../../lib/server/auth';
import { getDb } from '../../../../../lib/server/db';
import { notesForUser } from '../../../../../lib/server/discussion';
import { ApiError,assertSameOrigin,handleError,json,number,readJson,text } from '../../../../../lib/server/http';
import { requireLesson } from '../../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,{params}:Context){try{const{id}=await params;const user=await requireUser(request);if(convexEnabled())return json(await convexQuery('academy:listNotes',{lessonId:id},request));await requireLesson(id,user);return json({notes:await notesForUser(user.id,id)});}catch(error){return handleError(error);}}
export async function POST(request:Request,{params}:Context){try{
 const{ id:lessonId}=await params;assertSameOrigin(request);const user=await requireUser(request);const payload=await readJson(request);const body=text(payload.body,'Note',1,4000);const position=number(payload.position);
 if(convexEnabled())return json(await convexMutation('academy:createNote',{id:randomUUID(),lessonId,position,body},request),201);
 const note=await getDb().transaction(async transaction=>{
  await requireLesson(lessonId,user,transaction);
  const count=await transaction.get<{total:number}>('SELECT count(*) total FROM lesson_notes WHERE user_id=? AND lesson_id=?',user.id,lessonId);if((count?.total||0)>=500)throw new ApiError(400,'This lesson already has 500 saved notes.');
  const id=randomUUID();await transaction.run('INSERT INTO lesson_notes(id,user_id,lesson_id,position,body) VALUES(?,?,?,?,?)',id,user.id,lessonId,position,body);
  return(await notesForUser(user.id,lessonId,transaction)).find(note=>note.id===id);
 });return json({note},201);
}catch(error){return handleError(error);}}
