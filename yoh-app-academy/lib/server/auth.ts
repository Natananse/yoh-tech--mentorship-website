import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { User } from '../platform-types';
import { getDb } from './db';
import { ApiError } from './http';
import { applicationOrigin } from './origin';
import { convexEnabled,convexMutation,convexQuery } from './convex-client';

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = 'yoh_session';
const SESSION_SECONDS = 60 * 60 * 24 * 14;
export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [salt, encodedKey] = encoded.split(':');
  if (!salt || !encodedKey || !/^[a-f0-9]{128}$/.test(encodedKey)) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(encodedKey, 'hex'), actual);
}
export async function getUser(request: Request):Promise<User|null> {
  if(convexEnabled())return convexQuery<User|null>('academy:me',{},request);
  const cookie = request.headers.get('cookie') || '';
  const entry = cookie.split(';').map(x => x.trim()).find(x => x.startsWith(`${SESSION_COOKIE}=`));
  if (!entry) return null;
  const token = entry.slice(SESSION_COOKIE.length + 1);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return await getDb().get<User>(`SELECT u.id,u.name,u.email,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?`,hashToken(token),Date.now())||null;
}
export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) throw new ApiError(401, 'Sign in to continue.');
  return user;
}
export async function requireMentor(request: Request) {
  const user = await requireUser(request);
  if (user.role !== 'mentor' && user.role !== 'admin') throw new ApiError(403, 'A mentor or admin account is required.');
  return user;
}
export function sessionCookie(request: Request, token: string, clear = false) {
  const secure = new URL(applicationOrigin(request)||request.url).protocol === 'https:';
  return `${SESSION_COOKIE}=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');const now = Date.now();
  if(convexEnabled()){await convexMutation('academy:createSession',{userId,tokenHash:hashToken(token),expiresAt:now+SESSION_SECONDS*1000});return token;}
  await getDb().transaction(async transaction=>{
    await transaction.run('DELETE FROM sessions WHERE expires_at<=?',now);
    await transaction.run('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)',hashToken(token),userId,now+SESSION_SECONDS*1000,now);
  });
  return token;
}
export async function clearSession(request: Request) {
  if(convexEnabled()){await convexMutation('academy:logout',{},request);return;}
  const token = (request.headers.get('cookie') || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length+1);
  if (token) await getDb().run('DELETE FROM sessions WHERE token_hash=?',hashToken(token));
}
export async function throttle(_request: Request, identity: string, limit = 8) {
  const key=hashToken(`identity:${identity.toLowerCase()}`);const now=Date.now();
  if(convexEnabled()){await convexMutation('academy:throttleAttempt',{key,limit});return async()=>{await convexMutation('academy:clearThrottle',{key});};}
  const db=getDb();
  await db.transaction(async transaction=>{
    await transaction.run('DELETE FROM login_attempts WHERE reset_at<=?',now);
    const row=await transaction.get<{count:number;reset_at:number}>('SELECT count,reset_at FROM login_attempts WHERE key=?',key);
    if(row&&row.count>=limit)throw new ApiError(429,'Too many attempts. Please wait 15 minutes and try again.');
    await transaction.run('INSERT INTO login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',key,now+15*60*1000);
  });
  return async()=>{await db.run('DELETE FROM login_attempts WHERE key=?',key);};
}
