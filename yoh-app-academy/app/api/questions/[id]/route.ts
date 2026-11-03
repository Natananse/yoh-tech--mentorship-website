import { requireMentor } from '../../../../lib/server/auth';
import { getDb } from '../../../../lib/server/db';
import { listQuestions } from '../../../../lib/server/discussion';
import { ApiError,assertSameOrigin,handleError,json,readJson,text } from '../../../../lib/server/http';
import { requireLessonOwner } from '../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function PATCH(request:Request,{params}:{params:{id:string}}){try{
 assertSameOrigin(request);const user=requireMentor(request);const db=getDb();const question=db.prepare('SELECT lesson_id FROM lesson_questions WHERE id=?').get(params.id) as {lesson_id:string}|undefined;if(!question)throw new ApiError(404,'Question not found.');
 requireLessonOwner(question.lesson_id,user);const payload=await readJson(request);const answer=text(payload.answer,'Answer',1,8000);
 db.prepare("UPDATE lesson_questions SET answer=?,answered_by=?,answered_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(answer,user.id,params.id);
 return json({question:listQuestions(question.lesson_id).find(item=>item.id===params.id)});
}catch(error){return handleError(error);}}
