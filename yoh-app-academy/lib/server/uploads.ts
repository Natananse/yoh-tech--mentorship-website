import { ApiError } from './http';

export const VIDEO_LIMIT=250*1024*1024;
export const RESOURCE_LIMIT=25*1024*1024;
export async function readUpload(request:Request) {
  const contentType=request.headers.get('content-type')||'';
  if(!contentType.startsWith('multipart/form-data;'))throw new ApiError(400,'Upload a file using multipart form data.');
  const maximum=VIDEO_LIMIT+1024*1024;
  const length=Number(request.headers.get('content-length')||0);
  if(length>maximum)throw new ApiError(413,'Videos must be 250 MB or smaller.');
  if(!request.body)throw new ApiError(400,'Choose a file to upload.');
  const chunks:Uint8Array[]=[];let total=0;const reader=request.body.getReader();
  try{
    while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>maximum){await reader.cancel();throw new ApiError(413,'Videos must be 250 MB or smaller.');}chunks.push(value);}
  }finally{reader.releaseLock();}
  let form:FormData;
  try{form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':contentType}}).formData();}catch{throw new ApiError(400,'The upload could not be read. Choose the file again.');}
  const kind=form.get('kind');const file=form.get('file');
  if(kind!=='video'&&kind!=='resource')throw new ApiError(400,'Choose a video or resource upload.');
  if(!file||typeof file==='string'||typeof file.arrayBuffer!=='function')throw new ApiError(400,'Choose a file to upload.');
  if(file.size===0)throw new ApiError(400,'The selected file is empty.');
  if(file.size>(kind==='video'?VIDEO_LIMIT:RESOURCE_LIMIT))throw new ApiError(413,kind==='video'?'Videos must be 250 MB or smaller.':'Documents must be 25 MB or smaller.');
  const bytes=Buffer.from(await file.arrayBuffer());
  const name=file.name.replace(/[\u0000-\u001f\u007f/\\]/g,'_').slice(0,160)||'download';
  const extension=name.toLowerCase().split('.').pop();
  let mime='';
  if(kind==='video'&&extension==='mp4'&&bytes.length>=12&&bytes.subarray(4,8).toString('ascii')==='ftyp')mime='video/mp4';
  if(kind==='video'&&extension==='webm'&&bytes.length>=4&&bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))mime='video/webm';
  if(kind==='resource'&&extension==='pdf'&&bytes.subarray(0,5).toString('ascii')==='%PDF-')mime='application/pdf';
  if(kind==='resource'&&extension==='zip'&&bytes.length>=4&&['504b0304','504b0506','504b0708'].includes(bytes.subarray(0,4).toString('hex')))mime='application/zip';
  if(!mime)throw new ApiError(400,kind==='video'?'Use a valid MP4 or WebM video.':'Use a valid PDF or ZIP resource.');
  const acceptedTypes=[mime,'application/octet-stream','application/x-zip-compressed',''];
  if(!acceptedTypes.includes(file.type))throw new ApiError(400,'The file type does not match its contents.');
  return {kind,file,bytes,name,mime,extension};
}
