import { createHash } from 'node:crypto';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { ConvexError,type Value } from 'convex/values';
import { ApiError } from './http';
import { isHostedEnvironment } from './origin';

export function convexEnabled():boolean{
 const url=process.env.CONVEX_URL||process.env.NEXT_PUBLIC_CONVEX_URL;const secret=process.env.YOH_CONVEX_SERVER_SECRET;
 if(url&&secret&&secret.length>=32)return true;
 if(url||isHostedEnvironment())throw new ApiError(503,'The academy service is not ready yet. Please contact YO Tech Academy.');
 return false;
}
export function requestSessionHash(request?:Request):string|undefined{
 const token=(request?.headers.get('cookie')||'').split(';').map(part=>part.trim()).find(part=>part.startsWith('yoh_session='))?.slice('yoh_session='.length);
 return token&&/^[a-f0-9]{64}$/.test(token)?createHash('sha256').update(token).digest('hex'):undefined;
}
async function call<T>(kind:'query'|'mutation',name:string,args:Record<string,Value>,request?:Request):Promise<T>{
 if(!convexEnabled())throw new ApiError(503,'Convex is not configured.');
 const client=new ConvexHttpClient((process.env.CONVEX_URL||process.env.NEXT_PUBLIC_CONVEX_URL)!,{logger:false});
 // Query cache keys must include trusted request time so session/ticket expiry stays current.
 const sessionHash=requestSessionHash(request);const parameters={...args,serverSecret:process.env.YOH_CONVEX_SERVER_SECRET!,requestTime:Date.now(),...(sessionHash?{sessionHash}:{})};
 try{return(kind==='query'?await client.query(makeFunctionReference<'query'>(name),parameters):await client.mutation(makeFunctionReference<'mutation'>(name),parameters)) as T;}
 catch(error){
  if(error instanceof ConvexError&&error.data&&typeof error.data==='object'&&!Array.isArray(error.data)){
   const data=error.data as {status?:unknown;message?:unknown};if(typeof data.status==='number'&&typeof data.message==='string')throw new ApiError(data.status,data.message);
  }
  throw new ApiError(503,'The academy service is unavailable. Please try again shortly.');
 }
}
export const convexQuery=<T=any>(name:string,args:Record<string,Value>={},request?:Request)=>call<T>('query',name,args,request);
export const convexMutation=<T=any>(name:string,args:Record<string,Value>={},request?:Request)=>call<T>('mutation',name,args,request);
