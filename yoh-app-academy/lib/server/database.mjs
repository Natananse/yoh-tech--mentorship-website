import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export const dataDirectory=path.resolve(process.env.YOH_DATA_DIR||path.join(process.cwd(),'.data'));
export const uploadDirectory=path.join(dataDirectory,'uploads');
const SCHEMA_VERSION=5;
const schema=`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','mentor','admin')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', course_id TEXT NOT NULL,
      mentor_id TEXT NOT NULL REFERENCES users(id), duration REAL NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)), chapters TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('video','resource')), original_name TEXT NOT NULL,
      storage_name TEXT NOT NULL UNIQUE, mime TEXT NOT NULL, size INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      position REAL NOT NULL DEFAULT 0, duration REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      PRIMARY KEY (user_id,lesson_id)
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (user_id,course_id)
    );
    CREATE TABLE IF NOT EXISTS program_enrollments (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('pending','approved','revoked')),
      requested_at TEXT, approved_at TEXT
    );
    CREATE INDEX IF NOT EXISTS program_enrollments_status ON program_enrollments(status);
    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lesson_views (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      first_viewed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      PRIMARY KEY(user_id,lesson_id)
    );
    INSERT OR IGNORE INTO lesson_views(user_id,lesson_id,first_viewed_at)
      SELECT p.user_id,p.lesson_id,p.updated_at FROM progress p JOIN users u ON u.id=p.user_id
      WHERE p.position>0 AND u.role='student';
    CREATE TABLE IF NOT EXISTS lesson_notes (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      position REAL NOT NULL DEFAULT 0, body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS notes_owner_lesson ON lesson_notes(user_id,lesson_id);
    CREATE TABLE IF NOT EXISTS lesson_questions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      position REAL, body TEXT NOT NULL, answer TEXT, answered_by TEXT REFERENCES users(id), answered_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS questions_lesson ON lesson_questions(lesson_id);
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL, course_title TEXT NOT NULL, recipient_name TEXT NOT NULL,
      completed_lesson_count INTEGER NOT NULL CHECK(completed_lesson_count>0),
      issued_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      UNIQUE(user_id,course_id)
    );
`;

function migrateEnrollmentRequests(raw){
 const requestedAt=raw.prepare('PRAGMA table_info(program_enrollments)').all().find(column=>column.name==='requested_at');
 if(!requestedAt?.notnull)return;
 // SQLite cannot drop NOT NULL in place. Rebuild only this table atomically,
 // retaining every existing enrollment value and its user foreign key.
 raw.exec('BEGIN IMMEDIATE');
 try{
  raw.exec(`CREATE TABLE program_enrollments_v5 (
   user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
   status TEXT NOT NULL CHECK(status IN ('pending','approved','revoked')),
   requested_at TEXT, approved_at TEXT
  );
  INSERT INTO program_enrollments_v5(user_id,status,requested_at,approved_at)
   SELECT user_id,status,requested_at,approved_at FROM program_enrollments;
  DROP TABLE program_enrollments;
  ALTER TABLE program_enrollments_v5 RENAME TO program_enrollments;
  CREATE INDEX program_enrollments_status ON program_enrollments(status);`);
  raw.exec('COMMIT');
 }catch(error){raw.exec('ROLLBACK');throw error;}
}

export function getDatabase(){
 if(process.env.VERCEL==='1'||process.env.NETLIFY==='true'||Boolean(process.env.SITE_ID)){
  const error=new Error('Configure Convex before deploying this application on Vercel or Netlify. Local SQLite is disabled on serverless hosts.');
  error.code='YOH_REMOTE_DATABASE_REQUIRED';throw error;
 }
 const databasePath=path.join(dataDirectory,'academy.sqlite');
 const existing=globalThis.__yohAsyncDatabase;
 if(existing&&existing.path===databasePath&&existing.schemaVersion===SCHEMA_VERSION)return existing.facade;
 mkdirSync(uploadDirectory,{recursive:true,mode:0o700});
 const raw=globalThis.__yohDatabase&&globalThis.__yohDatabasePath===databasePath?globalThis.__yohDatabase:new DatabaseSync(databasePath);
 if(globalThis.__yohDatabaseSchema!==SCHEMA_VERSION||globalThis.__yohDatabasePath!==databasePath){raw.exec(schema);migrateEnrollmentRequests(raw);}
 const state={raw,path:databasePath,schemaVersion:SCHEMA_VERSION,tail:Promise.resolve(),facade:null};
 const direct={
  async get(sql,...parameters){return raw.prepare(sql).get(...parameters);},
  async all(sql,...parameters){return raw.prepare(sql).all(...parameters);},
  async run(sql,...parameters){return raw.prepare(sql).run(...parameters);},
 };
 function enqueue(operation){
  const result=state.tail.then(operation);
  state.tail=result.then(()=>undefined,()=>undefined);
  return result;
 }
 state.facade={
  get:(sql,...parameters)=>enqueue(()=>direct.get(sql,...parameters)),
  all:(sql,...parameters)=>enqueue(()=>direct.all(sql,...parameters)),
  run:(sql,...parameters)=>enqueue(()=>direct.run(sql,...parameters)),
  transaction:operation=>enqueue(async()=>{
   raw.exec('BEGIN IMMEDIATE');
   try{const result=await operation(direct);raw.exec('COMMIT');return result;}
   catch(error){raw.exec('ROLLBACK');throw error;}
  }),
 };
 globalThis.__yohDatabase=raw;globalThis.__yohDatabasePath=databasePath;globalThis.__yohDatabaseSchema=SCHEMA_VERSION;
 globalThis.__yohAsyncDatabase=state;
 return state.facade;
}
