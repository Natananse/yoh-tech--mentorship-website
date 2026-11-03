import { getDb } from '../../../../lib/server/db';
import { createSession, sessionCookie, throttle, verifyPassword, hashPassword } from '../../../../lib/server/auth';
import { ApiError, assertSameOrigin, handleError, json, readJson, text } from '../../../../lib/server/http';
import type { User } from '../../../../lib/platform-types';
export const runtime='nodejs';export const dynamic='force-dynamic';
let dummyHash:Promise<string>|undefined;
export async function POST(request:Request){try{
 assertSameOrigin(request);const body=await readJson(request);const email=text(body.email,'Email',3,254).toLowerCase();
 const password=typeof body.password==='string'?body.password:'';if(password.length>256)throw new ApiError(400,'The password is too long.');
 const clearThrottle=throttle(request,`login:${email}`);const row=getDb().prepare('SELECT id,name,email,role,password_hash FROM users WHERE email=?').get(email) as User&{password_hash:string}|undefined;
 dummyHash ||= hashPassword('unavailable-account-check-password');
 const valid=await verifyPassword(password,row?.password_hash||await dummyHash);
 if(!row||!valid)throw new ApiError(401,'Email or password is incorrect.');
 const user:User={id:row.id,name:row.name,email:row.email,role:row.role};const response=json({user});response.headers.set('Set-Cookie',sessionCookie(request,createSession(user.id)));clearThrottle();return response;
}catch(error){return handleError(error);}}
