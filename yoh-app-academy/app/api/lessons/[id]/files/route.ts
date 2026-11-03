import { randomUUID } from 'node:crypto';
import { writeFile,unlink } from 'node:fs/promises';
import path from 'node:path';
import { requireMentor } from '../../../../../lib/server/auth';
import { getDb,uploadDirectory } from '../../../../../lib/server/db';
import { ApiError,assertSameOrigin,handleError,json,readJson } from '../../../../../lib/server/http';
import { findLesson,requireLessonOwner } from '../../../../../lib/server/lessons';
import { readUpload } from '../../../../../lib/server/uploads';
import { convexEnabled,convexMutation,convexQuery } from '../../../../../lib/server/convex-client';
import { uploadDeclaration,uploadSignatureFromUrl,validateUploadSignature } from '../../../../../lib/server/upload-validation';
import type { Lesson,LessonResource } from '../../../../../lib/platform-types';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 let writtenPath:string|undefined;
 try{
  const{id:lessonId}=await params;assertSameOrigin(request);
  const cloud=convexEnabled();
  if((request.headers.get('content-type')||'').startsWith('application/json')){
   const body=await readJson(request);
   if(body.action==='prepare'){
    const declaration=uploadDeclaration(body);
    if(!cloud){const user=await requireMentor(request);const lesson=await requireLessonOwner(lessonId,user);if(declaration.kind==='resource'&&lesson.resources.length>=20)throw new ApiError(400,'A lesson can have up to 20 resource files.');return json({mode:'multipart'});}
    if(body.sha256===undefined){await convexQuery('file-storage:canUpload',{lessonId},request);return json({mode:'convex',requiresHash:true});}
    if(typeof body.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(body.sha256))throw new ApiError(400,'The file checksum is invalid. Choose the file again.');
    const result=await convexMutation<{uploadId:string;uploadUrl:string;mime:string}>('file-storage:prepareUpload',{id:randomUUID(),lessonId,kind:declaration.kind,originalName:declaration.name,mime:declaration.mime,size:declaration.size,sha256:body.sha256.toLowerCase()},request);
    return json({mode:'convex',...result});
   }
   if(body.action==='finalize'&&cloud){
    if(typeof body.uploadId!=='string'||typeof body.storageId!=='string'||body.uploadId.length>80||body.storageId.length>128)throw new ApiError(400,'The uploaded file reference is invalid.');
    const args={lessonId,uploadId:body.uploadId,storageId:body.storageId};
    const info=await convexQuery<{attached:boolean;lesson?:Lesson;file?:LessonResource;mime?:string;url?:string}>('file-storage:uploadInfo',args,request);
    if(info.attached)return json({lesson:info.lesson,file:info.file});
    if(!info.mime||!info.url)throw new ApiError(400,'The uploaded file is not ready. Choose it again.');
    validateUploadSignature(await uploadSignatureFromUrl(info.url),info.mime);
    const attached=await convexMutation<{lesson:Lesson;file:LessonResource}>('file-storage:attachUpload',{...args,verifiedMime:info.mime},request);
    return json(attached,201);
   }
   throw new ApiError(400,'Choose a valid upload action.');
  }
  if(cloud)throw new ApiError(400,'Use the direct upload flow for hosted lesson files.');
  const user=await requireMentor(request);await requireLessonOwner(lessonId,user);
  const upload=await readUpload(request);const id=randomUUID();const storageName=`${id}.${upload.extension}`;writtenPath=path.join(uploadDirectory,storageName);
  await writeFile(writtenPath,upload.bytes,{flag:'wx',mode:0o600});
  const result=await getDb().transaction(async transaction=>{
   await requireLessonOwner(lessonId,user,transaction);
   const count=await transaction.get<{total:number}>("SELECT count(*) total FROM files WHERE lesson_id=? AND kind='resource'",lessonId);
   if(upload.kind==='resource'&&(count?.total||0)>=20)throw new ApiError(400,'A lesson can have up to 20 resource files.');
   const oldVideos=upload.kind==='video'?await transaction.all<{storage_name:string}>("SELECT storage_name FROM files WHERE lesson_id=? AND kind='video'",lessonId):[];
   if(upload.kind==='video')await transaction.run("DELETE FROM files WHERE lesson_id=? AND kind='video'",lessonId);
   await transaction.run('INSERT INTO files(id,lesson_id,kind,original_name,storage_name,mime,size) VALUES(?,?,?,?,?,?,?)',id,lessonId,upload.kind,upload.name,storageName,upload.mime,upload.file.size);
   await transaction.run("UPDATE lessons SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",lessonId);
   return{lesson:await findLesson(lessonId,transaction),oldVideos};
  });
  writtenPath=undefined;await Promise.all(result.oldVideos.map(file=>unlink(path.join(uploadDirectory,file.storage_name)).catch(()=>{})));
  return json({lesson:result.lesson,file:{id,name:upload.name,url:`/api/files/${id}`,size:upload.file.size,mime:upload.mime}},201);
 }catch(error){if(writtenPath)await unlink(writtenPath).catch(()=>{});return handleError(error);}
}
