import { getDb,type DataExecutor } from './db';
import type { LessonNote,LessonQuestion } from '../platform-types';
export async function notesForUser(userId:string,lessonId:string,executor:DataExecutor=getDb()):Promise<LessonNote[]>{
 const rows=await executor.all<{id:string;user_id:string;lesson_id:string;position:number;body:string;created_at:string}>('SELECT id,user_id,lesson_id,position,body,created_at FROM lesson_notes WHERE user_id=? AND lesson_id=? ORDER BY position,created_at',userId,lessonId);
 return rows.map(row=>({id:row.id,userId:row.user_id,lessonId:row.lesson_id,position:row.position,body:row.body,createdAt:row.created_at}));
}
export async function listQuestions(lessonId:string,executor:DataExecutor=getDb()):Promise<LessonQuestion[]>{
 const rows=await executor.all<{id:string;user_id:string;lesson_id:string;position:number|null;body:string;answer:string|null;answered_at:string|null;created_at:string;author_name:string;answerer_name:string|null}>(`SELECT q.*,author.name author_name,answerer.name answerer_name FROM lesson_questions q JOIN users author ON author.id=q.user_id LEFT JOIN users answerer ON answerer.id=q.answered_by WHERE q.lesson_id=? ORDER BY q.created_at DESC`,lessonId);
 return rows.map(row=>({id:row.id,lessonId:row.lesson_id,authorId:row.user_id,authorName:row.author_name,position:row.position,body:row.body,answer:row.answer,answeredByName:row.answerer_name,answeredAt:row.answered_at,createdAt:row.created_at}));
}
