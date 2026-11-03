import type { Lesson, LessonChapter, Progress, User } from '../platform-types';
import { getDb,type DataExecutor } from './db';
import { ApiError, number, text } from './http';

type LessonRow = { id:string; title:string; description:string; course_id:string; mentor_id:string; mentor_name:string; duration:number; published:number; chapters:string; created_at:string; updated_at:string };
type FileRow={id:string;kind:string;original_name:string;mime:string;size:number};
export async function lessonFromRow(row:LessonRow,executor:DataExecutor=getDb()):Promise<Lesson>{
 const files=await executor.all<FileRow>('SELECT id,kind,original_name,mime,size FROM files WHERE lesson_id=? ORDER BY created_at,id',row.id);
 return{id:row.id,title:row.title,description:row.description,courseId:row.course_id,mentorId:row.mentor_id,mentorName:row.mentor_name,videoUrl:files.find(file=>file.kind==='video')?`/api/files/${files.find(file=>file.kind==='video')!.id}`:null,duration:row.duration,published:!!row.published,chapters:JSON.parse(row.chapters),createdAt:row.created_at,updatedAt:row.updated_at,resources:files.filter(file=>file.kind==='resource').map(file=>({id:file.id,name:file.original_name,mime:file.mime,size:file.size,url:`/api/files/${file.id}`}))};
}
export async function findLesson(id:string,executor:DataExecutor=getDb()):Promise<Lesson|null>{
 const row=await executor.get<LessonRow>('SELECT l.*,u.name mentor_name FROM lessons l JOIN users u ON u.id=l.mentor_id WHERE l.id=?',id);
 return row?lessonFromRow(row,executor):null;
}
export function canReadLesson(lesson:Lesson,user:User|null){return lesson.published||!!user&&(user.role==='admin'||lesson.mentorId===user.id);}
export async function requireLesson(id:string,user:User|null,executor:DataExecutor=getDb()):Promise<Lesson>{
 const lesson=await findLesson(id,executor);if(!lesson||!canReadLesson(lesson,user))throw new ApiError(404,'Lesson not found.');return lesson;
}
export async function requireLessonOwner(id:string,user:User,executor:DataExecutor=getDb()):Promise<Lesson>{
 const lesson=await findLesson(id,executor);if(!lesson)throw new ApiError(404,'Lesson not found.');if(user.role!=='admin'&&lesson.mentorId!==user.id)throw new ApiError(403,'You can edit only your own lessons.');return lesson;
}
export async function listLessons(user:User|null):Promise<Lesson[]>{
 const sql='SELECT l.*,u.name mentor_name FROM lessons l JOIN users u ON u.id=l.mentor_id';const db=getDb();
 const rows=user?.role==='admin'?await db.all<LessonRow>(`${sql} ORDER BY l.created_at DESC`):user?.role==='mentor'?await db.all<LessonRow>(`${sql} WHERE l.published=1 OR l.mentor_id=? ORDER BY l.created_at DESC`,user.id):await db.all<LessonRow>(`${sql} WHERE l.published=1 ORDER BY l.created_at DESC`);
 return Promise.all(rows.map(row=>lessonFromRow(row)));
}
export function parseChapters(value:unknown):LessonChapter[]{
 if(value===undefined)return[];if(!Array.isArray(value)||value.length>100)throw new ApiError(400,'Provide up to 100 chapters.');
 return value.map((chapter:any)=>{if(!chapter||typeof chapter!=='object')throw new ApiError(400,'Each chapter needs a title and timestamp.');const parsed:LessonChapter={title:text(chapter.title,'Chapter title',1,120),time:number(chapter.time)};if(chapter.code!==undefined)parsed.code=text(chapter.code,'Chapter code',0,6000);if(chapter.screen!==undefined)parsed.screen=text(chapter.screen,'Chapter screen',0,1000);return parsed;}).sort((a,b)=>a.time-b.time);
}
export async function getProgress(userId:string,lessonId:string,executor:DataExecutor=getDb()):Promise<Progress>{
 const row=await executor.get<{position:number;duration:number;completed:number;updated_at:string}>('SELECT position,duration,completed,updated_at FROM progress WHERE user_id=? AND lesson_id=?',userId,lessonId);
 return{lessonId,position:row?.position||0,duration:row?.duration||0,completed:!!row?.completed,updatedAt:row?.updated_at||''};
}
