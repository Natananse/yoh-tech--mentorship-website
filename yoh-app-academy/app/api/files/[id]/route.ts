import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { getUser } from '../../../../lib/server/auth';
import { getDb,uploadDirectory } from '../../../../lib/server/db';
import { ApiError,handleError } from '../../../../lib/server/http';
import { requireLesson } from '../../../../lib/server/lessons';
import { convexEnabled,convexQuery } from '../../../../lib/server/convex-client';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function respond(request:Request,id:string,head=false){try{
 if(convexEnabled()){
  const file=await convexQuery<{url:string;mime:string;size:number;kind:string;originalName:string}>('fileStorage:readFile',{id},request);
  const asciiName=file.originalName.replace(/[^\x20-\x7e]|["\\]/g,'_');
  const headers=new Headers({'Content-Type':file.mime,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Vary':'Cookie','Content-Disposition':`${file.kind==='resource'?'attachment':'inline'}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`});
  if(head){headers.set('Content-Length',String(file.size));return new Response(null,{headers});}
  headers.set('Location',file.url);
  // Video and document bytes travel from Convex to the browser, not through Vercel.
  return new Response(null,{status:302,headers});
 }
 const file=await getDb().get<{lesson_id:string;storage_name:string;original_name:string;mime:string;kind:string}>('SELECT lesson_id,storage_name,original_name,mime,kind FROM files WHERE id=?',id);
 if(!file)throw new ApiError(404,'File not found.');await requireLesson(file.lesson_id,await getUser(request));
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
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const{id}=await params;return respond(request,id);}
export async function HEAD(request:Request,{params}:{params:Promise<{id:string}>}){const{id}=await params;return respond(request,id,true);}
