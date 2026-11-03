import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { User } from '../platform-types';
import { getDb } from './db';
import { ApiError } from './http';

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
export function getUser(request: Request): User | null {
  const cookie = request.headers.get('cookie') || '';
  const entry = cookie.split(';').map(x => x.trim()).find(x => x.startsWith(`${SESSION_COOKIE}=`));
  if (!entry) return null;
  const token = entry.slice(SESSION_COOKIE.length + 1);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = getDb();
  const row = db.prepare(`SELECT u.id,u.name,u.email,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?`).get(hashToken(token), Date.now()) as User | undefined;
  return row || null;
}
export function requireUser(request: Request) {
  const user = getUser(request);
  if (!user) throw new ApiError(401, 'Sign in to continue.');
  return user;
}
export function requireMentor(request: Request) {
  const user = requireUser(request);
  if (user.role !== 'mentor' && user.role !== 'admin') throw new ApiError(403, 'A mentor or admin account is required.');
  return user;
}
export function sessionCookie(request: Request, token: string, clear = false) {
  const secure = new URL(process.env.YOH_APP_URL || request.url).protocol === 'https:';
  return `${SESSION_COOKIE}=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}
export function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const db = getDb();const now = Date.now();
  db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(hashToken(token),userId,now+SESSION_SECONDS*1000,now);
  return token;
}
export function clearSession(request: Request) {
  const token = (request.headers.get('cookie') || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length+1);
  if (token) getDb().prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token));
}
export function throttle(_request: Request, identity: string, limit = 8) {
  // An identity-wide limit cannot be bypassed by spoofing proxy/IP headers.
  const key = hashToken(`identity:${identity.toLowerCase()}`);const now=Date.now();const db=getDb();
  db.prepare('DELETE FROM login_attempts WHERE reset_at<=?').run(now);
  const row=db.prepare('SELECT count,reset_at FROM login_attempts WHERE key=?').get(key) as {count:number;reset_at:number}|undefined;
  if(row && row.count>=limit) throw new ApiError(429,'Too many attempts. Please wait 15 minutes and try again.');
  db.prepare('INSERT INTO login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+15*60*1000);
  return () => db.prepare('DELETE FROM login_attempts WHERE key=?').run(key);
}
