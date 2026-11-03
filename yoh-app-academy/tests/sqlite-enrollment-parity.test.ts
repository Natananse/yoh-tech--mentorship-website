import { randomUUID } from 'node:crypto';
import { access,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import type { User } from '../lib/platform-types';

type State=typeof globalThis&{__yohDatabase?:{close():void};__yohAsyncDatabase?:unknown;__yohDatabasePath?:string;__yohDatabaseSchema?:number};
let directory:string;
let dbModule:typeof import('../lib/server/db');
let db:ReturnType<(typeof import('../lib/server/db'))['getDb']>;
function closeDatabase(){const state=globalThis as State;if(state.__yohDatabasePath?.startsWith(directory)){state.__yohDatabase?.close();delete state.__yohDatabase;delete state.__yohAsyncDatabase;delete state.__yohDatabasePath;delete state.__yohDatabaseSchema;}}
async function createUser(role:User['role']='student'):Promise<User>{const user={id:randomUUID(),name:`Parity ${role}`,email:`${randomUUID()}@example.test`,role};await db.run('INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)',user.id,user.name,user.email,'preserved-password-hash',role);return user;}
beforeEach(async()=>{directory=await mkdtemp(path.join(tmpdir(),'yoh-sqlite-parity-'));vi.stubEnv('YOH_DATA_DIR',directory);vi.stubEnv('VERCEL','');vi.stubEnv('NETLIFY','');vi.stubEnv('SITE_ID','');vi.stubEnv('CONVEX_URL','');vi.stubEnv('NEXT_PUBLIC_CONVEX_URL','');vi.resetModules();dbModule=await import('../lib/server/db');db=dbModule.getDb();});
afterEach(async()=>{closeDatabase();vi.unstubAllEnvs();await rm(directory,{recursive:true,force:true});});

describe('SQLite enrollment and hosted-runtime parity',()=>{
 it('migrates a v4 NOT NULL enrollment table without changing records or foreign keys',async()=>{
  const students=await Promise.all([createUser(),createUser(),createUser()]);const admin=await createUser('admin');const timestamp='2026-01-02T03:04:05.000Z';
  await db.run('DROP TABLE program_enrollments');await db.run("CREATE TABLE program_enrollments(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,status TEXT NOT NULL CHECK(status IN ('pending','approved','revoked')),requested_at TEXT NOT NULL,approved_at TEXT)");await db.run('CREATE INDEX program_enrollments_status ON program_enrollments(status)');
  for(let index=0;index<students.length;index++)await db.run('INSERT INTO program_enrollments VALUES(?,?,?,?)',students[index].id,['pending','approved','revoked'][index],timestamp,index===1?timestamp:null);
  const lessonId=randomUUID();await db.run('INSERT INTO lessons(id,title,course_id,mentor_id) VALUES(?,?,?,?)',lessonId,'Preserved lesson','0',admin.id);await db.run('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)','f'.repeat(64),students[0].id,Date.now()+600000,Date.now());await db.run('INSERT INTO progress(user_id,lesson_id,position,duration,completed) VALUES(?,?,30,60,1)',students[0].id,lessonId);
  const tables=['users','sessions','lessons','progress','program_enrollments'];const before=await Promise.all(tables.map(table=>db.all(`SELECT * FROM ${table} ORDER BY 1`)));closeDatabase();db=dbModule.getDb();
  expect((await db.all<{name:string;notnull:number}>('PRAGMA table_info(program_enrollments)')).find(column=>column.name==='requested_at')?.notnull).toBe(0);
  for(let index=0;index<tables.length;index++)expect(await db.all(`SELECT * FROM ${tables[index]} ORDER BY 1`)).toEqual(before[index]);expect(await db.all('PRAGMA foreign_key_check')).toEqual([]);expect(await db.get("SELECT name FROM sqlite_master WHERE type='index' AND name='program_enrollments_status'")).toBeTruthy();
  // A later reopen is idempotent and the restored foreign key still cascades.
  closeDatabase();db=dbModule.getDb();expect(await db.all('SELECT * FROM program_enrollments ORDER BY 1')).toEqual(before[4]);await db.run('DELETE FROM users WHERE id=?',students[2].id);expect(await db.get('SELECT * FROM program_enrollments WHERE user_id=?',students[2].id)).toBeUndefined();
 });
 it('records direct admin grants with requestedAt=null until a real student request',async()=>{
  const admin=await createUser('admin');const student=await createUser();const service=await import('../lib/server/enrollment');const granted=await service.setEnrollment(admin,student.id,'approved');expect(granted).toMatchObject({status:'approved',requestedAt:null});expect(granted.approvedAt).toBeTypeOf('string');expect((await service.setEnrollment(admin,student.id,'approved')).approvedAt).toBe(granted.approvedAt);expect((await service.requestEnrollment(student)).enrollment).toEqual({status:'approved',requestedAt:null,approvedAt:granted.approvedAt});
  const revoked=await service.setEnrollment(admin,student.id,'revoked');expect(revoked).toMatchObject({requestedAt:null,approvedAt:null,status:'revoked'});const requested=await service.requestEnrollment(student);expect(requested.enrollment).toMatchObject({status:'pending',approvedAt:null});expect(requested.enrollment.requestedAt).toBeTypeOf('string');expect((await service.setEnrollment(admin,student.id,'approved')).requestedAt).toBe(requested.enrollment.requestedAt);
 });
 it('returns 404 for invalid student approval targets',async()=>{
  const admin=await createUser('admin');const mentor=await createUser('mentor');const service=await import('../lib/server/enrollment');await expect(service.setEnrollment(admin,randomUUID(),'approved')).rejects.toMatchObject({status:404});await expect(service.setEnrollment(admin,mentor.id,'approved')).rejects.toMatchObject({status:404});
 });
 it('rejects SQLite on Vercel and either Netlify deployment signal before creating a directory',async()=>{
  const forbidden=path.join(directory,'must-not-create');vi.stubEnv('YOH_DATA_DIR',forbidden);vi.resetModules();const adapter=await import('../lib/server/database.mjs');
  for(const signals of [{VERCEL:'1',NETLIFY:'',SITE_ID:''},{VERCEL:'',NETLIFY:'true',SITE_ID:''},{VERCEL:'',NETLIFY:'',SITE_ID:'test-site-id'}]){for(const[name,value]of Object.entries(signals))vi.stubEnv(name,value);expect(()=>adapter.getDatabase()).toThrow('Local SQLite is disabled');try{adapter.getDatabase();throw new Error('Expected hosted-runtime rejection');}catch(error){expect(error).toMatchObject({code:'YOH_REMOTE_DATABASE_REQUIRED'});}await expect(access(forbidden)).rejects.toMatchObject({code:'ENOENT'});}
 });
});
