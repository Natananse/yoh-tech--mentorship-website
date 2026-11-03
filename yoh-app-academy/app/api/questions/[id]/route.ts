import { convexEnabled,convexMutation,convexQuery } from '../../../../lib/server/convex-client';
import { requireMentor } from '../../../../lib/server/auth';
import { getDb } from '../../../../lib/server/db';
import { listQuestions } from '../../../../lib/server/discussion';
import { ApiError,assertSameOrigin,handleError,json,readJson,text } from '../../../../lib/server/http';
import { requireLessonOwner } from '../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const{id}=await params;assertSameOrigin(request);const user=await requireMentor(request);const payload=await readJson(request);const answer=text(payload.answer,'Answer',1,8000);
 if(convexEnabled())return json(await convexMutation('academy:answerQuestion',{id,answer},request));
 const question=await getDb().transaction(async transaction=>{
  const row=await transaction.get<{lesson_id:string}>('SELECT lesson_id FROM lesson_questions WHERE id=?',id);if(!row)throw new ApiError(404,'Question not found.');await requireLessonOwner(row.lesson_id,user,transaction);
  await transaction.run("UPDATE lesson_questions SET answer=?,answered_by=?,answered_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",answer,user.id,id);
  return(await listQuestions(row.lesson_id,transaction)).find(item=>item.id===id);
 });return json({question});
}catch(error){return handleError(error);}}
