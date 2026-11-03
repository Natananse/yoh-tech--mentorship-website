import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export const dataDirectory = path.resolve(process.env.YOH_DATA_DIR || path.join(process.cwd(), '.data'));
export const uploadDirectory = path.join(dataDirectory, 'uploads');
const DATABASE_SCHEMA_VERSION = 3;
const globalDatabase = globalThis as typeof globalThis & { __yohDatabase?: DatabaseSync; __yohDatabasePath?: string; __yohDatabaseSchema?: number };

export function getDb(): DatabaseSync {
  const databasePath = path.join(dataDirectory, 'academy.sqlite');
  if (globalDatabase.__yohDatabase && globalDatabase.__yohDatabasePath === databasePath && globalDatabase.__yohDatabaseSchema === DATABASE_SCHEMA_VERSION) return globalDatabase.__yohDatabase;
  mkdirSync(uploadDirectory, { recursive: true, mode: 0o700 });
  const db = globalDatabase.__yohDatabase && globalDatabase.__yohDatabasePath === databasePath ? globalDatabase.__yohDatabase : new DatabaseSync(databasePath);
  db.exec(`
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
  `);
  globalDatabase.__yohDatabase = db;
  globalDatabase.__yohDatabasePath = databasePath;
  globalDatabase.__yohDatabaseSchema = DATABASE_SCHEMA_VERSION;
  return db;
}
