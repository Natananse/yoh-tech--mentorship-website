import { scryptSync,randomBytes,randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory=fileURLToPath(new URL('../',import.meta.url));
for(const filename of ['.env.local','.env']){
 const filenamePath=path.join(appDirectory,filename);
 if(existsSync(filenamePath))process.loadEnvFile(filenamePath);
}
const email=(process.env.YOH_ADMIN_EMAIL||'').trim().toLowerCase();
const name=(process.env.YOH_ADMIN_NAME||'Academy administrator').trim();
const password=process.env.YOH_ADMIN_PASSWORD||'';
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<2||name.length>80){console.error('Set a valid YOH_ADMIN_EMAIL and YOH_ADMIN_NAME.');process.exit(1);}
process.env.YOH_DATA_DIR=path.resolve(appDirectory,process.env.YOH_DATA_DIR||'.data');
try{
 let passwordHash=null;
 if(password.length>=10&&password.length<=256){const salt=randomBytes(16).toString('hex');passwordHash=`${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
 const convexUrl=process.env.CONVEX_URL||process.env.NEXT_PUBLIC_CONVEX_URL;const secret=process.env.YOH_CONVEX_SERVER_SECRET;
 if(convexUrl||process.env.VERCEL==='1'){
  if(!convexUrl||!secret||secret.length<32)throw new Error('Configure a Convex deployment URL and a matching private YOH_CONVEX_SERVER_SECRET.');
  const{ConvexHttpClient}=await import('convex/browser');const{makeFunctionReference}=await import('convex/server');const client=new ConvexHttpClient(convexUrl,{logger:false});
  const result=await client.mutation(makeFunctionReference('academy:adminUpsert'),{serverSecret:secret,requestTime:Date.now(),id:randomUUID(),name,email,...(passwordHash?{passwordHash}:{})});
  console.log(result.created?'Admin account created.':'Existing account granted the admin role.');
 }else{
 const{getDatabase}=await import('../lib/server/database.mjs');const db=getDatabase();
 const created=await db.transaction(async transaction=>{
  const user=await transaction.get('SELECT id FROM users WHERE email=?',email);
  if(user){await transaction.run("UPDATE users SET role='admin' WHERE id=?",user.id);return false;}
  if(!passwordHash)throw new Error('Set YOH_ADMIN_PASSWORD to 10–256 characters to create the account.');
  await transaction.run("INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,'admin')",randomUUID(),name,email,passwordHash);return true;
 });
 console.log(created?'Admin account created.':'Existing account granted the admin role.');
 }
}catch(error){console.error(error instanceof Error?error.message:'Admin setup failed.');process.exitCode=1;}
