import { randomUUID } from 'node:crypto';
import { writeFile,unlink } from 'node:fs/promises';
import path from 'node:path';
import { requireMentor } from '../../../../../lib/server/auth';
import { getDb,uploadDirectory } from '../../../../../lib/server/db';
import { ApiError,assertSameOrigin,handleError,json } from '../../../../../lib/server/http';
import { findLesson,requireLessonOwner } from '../../../../../lib/server/lessons';
import { readUpload } from '../../../../../lib/server/uploads';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:{id:string}}){
 let writtenPath:string|undefined;
 try{
  assertSameOrigin(request);const user=requireMentor(request);const lesson=requireLessonOwner(params.id,user);
  const upload=await readUpload(request);const db=getDb();
  if(upload.kind==='resource'&&(db.prepare("SELECT count(*) total FROM files WHERE lesson_id=? AND kind='resource'").get(lesson.id) as {total:number}).total>=20)throw new ApiError(400,'A lesson can have up to 20 resource files.');
  const id=randomUUID();const storageName=`${id}.${upload.extension}`;writtenPath=path.join(uploadDirectory,storageName);
  await writeFile(writtenPath,upload.bytes,{flag:'wx',mode:0o600});
  const oldVideos=upload.kind==='video'?db.prepare("SELECT storage_name FROM files WHERE lesson_id=? AND kind='video'").all(lesson.id) as {storage_name:string}[]:[];
  db.exec('BEGIN IMMEDIATE');
  try{
   if(upload.kind==='video')db.prepare("DELETE FROM files WHERE lesson_id=? AND kind='video'").run(lesson.id);
   db.prepare('INSERT INTO files(id,lesson_id,kind,original_name,storage_name,mime,size) VALUES(?,?,?,?,?,?,?)').run(id,lesson.id,upload.kind,upload.name,storageName,upload.mime,upload.file.size);
   db.prepare("UPDATE lessons SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(lesson.id);
   db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  writtenPath=undefined;
  await Promise.all(oldVideos.map(file=>unlink(path.join(uploadDirectory,file.storage_name)).catch(()=>{})));
  return json({lesson:findLesson(lesson.id),file:{id,name:upload.name,url:`/api/files/${id}`,size:upload.file.size,mime:upload.mime}},201);
 }catch(error){if(writtenPath)await unlink(writtenPath).catch(()=>{});return handleError(error);}
}
