import { randomUUID } from 'node:crypto';
import { requireUser } from '../../../../../lib/server/auth';
import { getDb } from '../../../../../lib/server/db';
import { notesForUser } from '../../../../../lib/server/discussion';
import { ApiError,assertSameOrigin,handleError,json,number,readJson,text } from '../../../../../lib/server/http';
import { requireLesson } from '../../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function GET(request:Request,{params}:{params:{id:string}}){try{const user=requireUser(request);requireLesson(params.id,user);return json({notes:notesForUser(user.id,params.id)});}catch(error){return handleError(error);}}
export async function POST(request:Request,{params}:{params:{id:string}}){try{
 assertSameOrigin(request);const user=requireUser(request);const lesson=requireLesson(params.id,user);const payload=await readJson(request);const body=text(payload.body,'Note',1,4000);const position=number(payload.position);
 const db=getDb();if((db.prepare('SELECT count(*) total FROM lesson_notes WHERE user_id=? AND lesson_id=?').get(user.id,lesson.id) as {total:number}).total>=500)throw new ApiError(400,'This lesson already has 500 saved notes.');
 const id=randomUUID();db.prepare('INSERT INTO lesson_notes(id,user_id,lesson_id,position,body) VALUES(?,?,?,?,?)').run(id,user.id,lesson.id,position,body);
 return json({note:notesForUser(user.id,lesson.id).find(note=>note.id===id)},201);
}catch(error){return handleError(error);}}
