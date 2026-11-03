import { DatabaseSync } from 'node:sqlite';
import { scryptSync,randomBytes,randomUUID } from 'node:crypto';
import { existsSync,mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Exported variables win; local configuration takes precedence over the shared .env.
const appDirectory=fileURLToPath(new URL('../',import.meta.url));
for(const filename of ['.env.local','.env']){
 const filenamePath=path.join(appDirectory,filename);
 if(existsSync(filenamePath))process.loadEnvFile(filenamePath);
}
// Credentials are read from environment, never CLI arguments.
const email=(process.env.YOH_ADMIN_EMAIL||'').trim().toLowerCase();
const name=(process.env.YOH_ADMIN_NAME||'Academy administrator').trim();
const password=process.env.YOH_ADMIN_PASSWORD||'';
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<2||name.length>80){console.error('Set a valid YOH_ADMIN_EMAIL and YOH_ADMIN_NAME.');process.exit(1);}
const dir=path.resolve(process.env.YOH_DATA_DIR||path.join(appDirectory,'.data'));mkdirSync(dir,{recursive:true,mode:0o700});
const db=new DatabaseSync(path.join(dir,'academy.sqlite'));
db.exec("PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','mentor','admin')),created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));");
const user=db.prepare('SELECT id FROM users WHERE email=?').get(email);
if(user){db.prepare("UPDATE users SET role='admin' WHERE id=?").run(user.id);console.log('Existing account granted the admin role.');}
else{
 if(password.length<10||password.length>256){console.error('Set YOH_ADMIN_PASSWORD to 10–256 characters to create the account.');process.exit(1);}
 const salt=randomBytes(16).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');
 db.prepare("INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,'admin')").run(randomUUID(),name,email,`${salt}:${hash}`);console.log('Admin account created.');
}
db.close();
