import { getDb } from './db';
import type { LessonNote,LessonQuestion } from '../platform-types';

export function notesForUser(userId:string,lessonId:string):LessonNote[]{
 const rows=getDb().prepare('SELECT id,user_id,lesson_id,position,body,created_at FROM lesson_notes WHERE user_id=? AND lesson_id=? ORDER BY position,created_at').all(userId,lessonId) as {id:string;user_id:string;lesson_id:string;position:number;body:string;created_at:string}[];
 return rows.map(row=>({id:row.id,userId:row.user_id,lessonId:row.lesson_id,position:row.position,body:row.body,createdAt:row.created_at}));
}
export function listQuestions(lessonId:string):LessonQuestion[]{
 const rows=getDb().prepare(`SELECT q.*,author.name author_name,answerer.name answerer_name FROM lesson_questions q JOIN users author ON author.id=q.user_id LEFT JOIN users answerer ON answerer.id=q.answered_by WHERE q.lesson_id=? ORDER BY q.created_at DESC`).all(lessonId) as {id:string;user_id:string;lesson_id:string;position:number|null;body:string;answer:string|null;answered_at:string|null;created_at:string;author_name:string;answerer_name:string|null}[];
 return rows.map(row=>({id:row.id,lessonId:row.lesson_id,authorId:row.user_id,authorName:row.author_name,position:row.position,body:row.body,answer:row.answer,answeredByName:row.answerer_name,answeredAt:row.answered_at,createdAt:row.created_at}));
}
