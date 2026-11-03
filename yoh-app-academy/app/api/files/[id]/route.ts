import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { getUser } from '../../../../lib/server/auth';
import { getDb,uploadDirectory } from '../../../../lib/server/db';
import { ApiError,handleError } from '../../../../lib/server/http';
import { requireLesson } from '../../../../lib/server/lessons';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function respond(request:Request,id:string,head=false){try{
 const file=getDb().prepare('SELECT lesson_id,storage_name,original_name,mime,kind FROM files WHERE id=?').get(id) as {lesson_id:string;storage_name:string;original_name:string;mime:string;kind:string}|undefined;
 if(!file)throw new ApiError(404,'File not found.');requireLesson(file.lesson_id,getUser(request));
 const filePath=path.join(uploadDirectory,file.storage_name);let size:number;
 try{size=(await stat(filePath)).size;}catch{throw new ApiError(404,'The file is no longer available.');}
 const disposition=file.kind==='resource'?'attachment':'inline';
 const asciiName=file.original_name.replace(/[^\x20-\x7e]|["\\]/g,'_');
 const headers=new Headers({'Content-Type':file.mime,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Disposition':`${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.original_name)}`});
 let start=0,end=size-1;let status=200;
 const range=request.headers.get('range');
 if(range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  if(!match[1]){const suffix=Number(match[2]);if(suffix<=0)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});start=Math.max(0,size-suffix);}else{start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),size-1);}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  status=206;headers.set('Content-Range',`bytes ${start}-${end}/${size}`);
 }
 headers.set('Content-Length',String(end-start+1));
 return new Response(head?null:Readable.toWeb(createReadStream(filePath,{start,end})) as ReadableStream<Uint8Array>,{status,headers});
}catch(error){return handleError(error);}}
export function GET(request:Request,{params}:{params:{id:string}}){return respond(request,params.id);}
export function HEAD(request:Request,{params}:{params:{id:string}}){return respond(request,params.id,true);}
