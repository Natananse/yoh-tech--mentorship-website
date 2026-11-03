import type { User } from '../platform-types';
import { getDb,type DataExecutor } from './db';
import { ApiError } from './http';

export type EnrollmentStatus='none'|'pending'|'approved'|'revoked';
export type Enrollment={status:EnrollmentStatus;requestedAt:string|null;approvedAt:string|null};
export type EnrollmentRecord=Enrollment&{studentId:string;name:string;email:string};
type Row={user_id:string;status:Exclude<EnrollmentStatus,'none'>;requested_at:string|null;approved_at:string|null};
const empty=():Enrollment=>({status:'none',requestedAt:null,approvedAt:null});
const publicEnrollment=(row:Row):Enrollment=>({status:row.status,requestedAt:row.requested_at,approvedAt:row.approved_at});

export async function getEnrollment(user:User|null,executor:DataExecutor=getDb()):Promise<{enrollment:Enrollment;canViewLessons:boolean}>{
 if(!user)return{enrollment:empty(),canViewLessons:false};
 const row=await executor.get<Row>('SELECT * FROM program_enrollments WHERE user_id=?',user.id);
 return{enrollment:row?publicEnrollment(row):empty(),canViewLessons:user.role==='mentor'||user.role==='admin'||row?.status==='approved'};
}
export async function canViewLessons(user:User|null,executor:DataExecutor=getDb()):Promise<boolean>{return(await getEnrollment(user,executor)).canViewLessons;}
export async function requireApprovedEnrollment(user:User|null,executor:DataExecutor=getDb()):Promise<void>{
 if(!await canViewLessons(user,executor))throw new ApiError(user?403:401,user?'Request enrollment and wait for administrator approval to access lessons.':'Sign in and request enrollment to access lessons.');
}
export async function requestEnrollment(user:User){
 if(user.role!=='student')throw new ApiError(403,'Only student accounts can request enrollment.');
 return getDb().transaction(async transaction=>{
  const existing=await transaction.get<Row>('SELECT * FROM program_enrollments WHERE user_id=?',user.id);
  if(!existing||existing.status==='revoked')await transaction.run("INSERT INTO program_enrollments(user_id,status,requested_at,approved_at) VALUES(?,'pending',?,NULL) ON CONFLICT(user_id) DO UPDATE SET status='pending',requested_at=excluded.requested_at,approved_at=NULL",user.id,new Date().toISOString());
  return getEnrollment(user,transaction);
 });
}
export function requireAdmin(user:User){if(user.role!=='admin')throw new ApiError(403,'An administrator account is required.');}
export async function listEnrollments(user:User):Promise<EnrollmentRecord[]>{
 requireAdmin(user);
 const rows=await getDb().all<Row&{name:string;email:string}>("SELECT e.*,u.name,u.email FROM program_enrollments e JOIN users u ON u.id=e.user_id WHERE u.role='student' ORDER BY e.requested_at DESC,e.user_id");
 return rows.map(row=>({...publicEnrollment(row),studentId:row.user_id,name:row.name,email:row.email}));
}
export async function setEnrollment(user:User,studentId:string,status:'approved'|'revoked'):Promise<EnrollmentRecord>{
 requireAdmin(user);
 return getDb().transaction(async transaction=>{
  const student=await transaction.get<User>('SELECT id,name,email,role FROM users WHERE id=?',studentId);
  if(!student||student.role!=='student')throw new ApiError(404,'Student not found.');
  const old=await transaction.get<Row>('SELECT * FROM program_enrollments WHERE user_id=?',studentId);const now=new Date().toISOString();
  await transaction.run('INSERT INTO program_enrollments(user_id,status,requested_at,approved_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,approved_at=excluded.approved_at',studentId,status,old?.requested_at??null,status==='approved'?(old?.status==='approved'?old.approved_at||now:now):null);
  return{...(await getEnrollment(student,transaction)).enrollment,studentId:student.id,name:student.name,email:student.email};
 });
}
