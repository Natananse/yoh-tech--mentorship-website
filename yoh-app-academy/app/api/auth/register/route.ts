import { randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { getDb } from '../../../../lib/server/db';
import { createSession, hashPassword, sessionCookie, throttle } from '../../../../lib/server/auth';
import { ApiError, assertSameOrigin, handleError, json, readJson, text } from '../../../../lib/server/http';
import type { User } from '../../../../lib/platform-types';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){try{
  assertSameOrigin(request);const body=await readJson(request);
  const name=text(body.name,'Name',2,80);const email=text(body.email,'Email',3,254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400,'Enter a valid email address.');
  const password=typeof body.password==='string'?body.password:'';
  if(password.length<10||password.length>256) throw new ApiError(400,'Use a password between 10 and 256 characters.');
  const clearThrottle=throttle(request,`register:${email}`,5);
  const role=body.role===undefined?'student':body.role;
  if(role!=='student'&&role!=='mentor') throw new ApiError(400,'Register as a student, or use a mentor invitation.');
  if(role==='mentor'){
    const invite=process.env.YOH_MENTOR_INVITE;
    const supplied=typeof body.inviteCode==='string'?body.inviteCode:'';
    if(!invite||!timingSafeEqual(createHash('sha256').update(invite).digest(),createHash('sha256').update(supplied).digest())) throw new ApiError(403,'A valid mentor invitation is required.');
  }
  if(getDb().prepare('SELECT id FROM users WHERE email=?').get(email)) throw new ApiError(409,'This email is already registered. Sign in instead.');
  const user:User={id:randomUUID(),name,email,role};const passwordHash=await hashPassword(password);
  try{getDb().prepare('INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)').run(user.id,name,email,passwordHash,role);}catch(error){if(String(error).includes('UNIQUE'))throw new ApiError(409,'This email is already registered.');throw error;}
  const token=createSession(user.id);const response=json({user},201);response.headers.set('Set-Cookie',sessionCookie(request,token));clearThrottle();return response;
}catch(error){return handleError(error);}}
