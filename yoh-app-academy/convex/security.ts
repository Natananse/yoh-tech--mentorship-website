import { ConvexError,v } from 'convex/values';
import type { DocumentByName } from 'convex/server';
import type { DataModel,QueryContext } from './runtime';

export const authArgs={serverSecret:v.string(),requestTime:v.number(),sessionHash:v.optional(v.string())};
export type AuthArgs={serverSecret:string;requestTime:number;sessionHash?:string};
export const now=()=>new Date().toISOString();
export function fail(status:number,message:string):never{throw new ConvexError({status,message});}
export function requireServerSecret(args:AuthArgs){
 const expected=process.env.YOH_CONVEX_SERVER_SECRET;
 if(!expected||expected.length<32)fail(503,'The Convex server bridge has not been configured.');
 if(args.serverSecret!==expected)fail(403,'Access denied.');
 if(!Number.isFinite(args.requestTime)||!Number.isSafeInteger(args.requestTime)||args.requestTime<0)fail(400,'Use a valid server request time.');
}
export function publicUser(user:DocumentByName<DataModel,'users'>){return{id:user.id,name:user.name,email:user.email,role:user.role};}
export function byId<T extends 'users'|'lessons'|'files'|'uploads'|'notes'|'questions'|'certificates'>(ctx:QueryContext,table:T,id:string):Promise<DocumentByName<DataModel,T>|null>{
 // Every application entity retains its pre-migration UUID, independently of Convex's _id.
 const lookups={
  users:()=>ctx.db.query('users').withIndex('by_legacyId',q=>q.eq('id',id)).unique(),
  lessons:()=>ctx.db.query('lessons').withIndex('by_legacyId',q=>q.eq('id',id)).unique(),
  files:()=>ctx.db.query('files').withIndex('by_legacyId',q=>q.eq('id',id)).unique(),
  uploads:()=>ctx.db.query('uploads').withIndex('by_legacyId',q=>q.eq('id',id)).unique(),
  notes:()=>ctx.db.query('notes').withIndex('by_legacyId',q=>q.eq('id',id)).unique(),
  questions:()=>ctx.db.query('questions').withIndex('by_legacyId',q=>q.eq('id',id)).unique(),
  certificates:()=>ctx.db.query('certificates').withIndex('by_legacyId',q=>q.eq('id',id)).unique(),
 };
 return lookups[table]() as unknown as Promise<DocumentByName<DataModel,T>|null>;
}
export async function optionalUser(ctx:QueryContext,args:AuthArgs){
 requireServerSecret(args);
 if(!args.sessionHash||!/^[a-f0-9]{64}$/.test(args.sessionHash))return null;
 const session=await ctx.db.query('sessions').withIndex('by_tokenHash',q=>q.eq('tokenHash',args.sessionHash!)).unique();
 if(!session||session.expiresAt<=args.requestTime)return null;
 return byId(ctx,'users',session.userId);
}
export async function authenticated(ctx:QueryContext,args:AuthArgs){const user=await optionalUser(ctx,args);if(!user)fail(401,'Sign in to continue.');return user;}
export async function administrator(ctx:QueryContext,args:AuthArgs){const user=await authenticated(ctx,args);if(user.role!=='admin')fail(403,'An admin account is required.');return user;}
export function enrollmentForStudent(ctx:QueryContext,studentId:string){return ctx.db.query('programEnrollments').withIndex('by_studentId',q=>q.eq('studentId',studentId)).unique();}
export async function canViewProgram(ctx:QueryContext,user:DocumentByName<DataModel,'users'>|null){
 if(!user)return false;if(user.role==='mentor'||user.role==='admin')return true;return(await enrollmentForStudent(ctx,user.id))?.status==='approved';
}
export async function requireProgramAccess(ctx:QueryContext,args:AuthArgs){const user=await authenticated(ctx,args);if(!await canViewProgram(ctx,user))fail(403,'Your enrollment must be approved before you can access lessons.');return user;}
export async function canWatchLesson(ctx:QueryContext,user:DocumentByName<DataModel,'users'>|null,lesson:DocumentByName<DataModel,'lessons'>){
 if(!lesson.published)return Boolean(user&&(user.role==='admin'||lesson.mentorId===user.id));return canViewProgram(ctx,user);
}
export async function mentor(ctx:QueryContext,args:AuthArgs){const user=await authenticated(ctx,args);if(user.role!=='mentor'&&user.role!=='admin')fail(403,'A mentor or admin account is required.');return user;}
export async function ownedLesson(ctx:QueryContext,args:AuthArgs,lessonId:string){
 const user=await mentor(ctx,args);const lesson=await byId(ctx,'lessons',lessonId);if(!lesson)fail(404,'Lesson not found.');if(user.role!=='admin'&&lesson.mentorId!==user.id)fail(403,'You can edit only your own lessons.');return{user,lesson};
}
export async function readableLesson(ctx:QueryContext,args:AuthArgs,lessonId:string){
 const user=await optionalUser(ctx,args);const lesson=await byId(ctx,'lessons',lessonId);
 if(!lesson||!lesson.published&&user?.role!=='admin'&&lesson.mentorId!==user?.id)fail(404,'Lesson not found.');return lesson;
}
export async function requireLessonContent(ctx:QueryContext,args:AuthArgs,lessonId:string){
 const lesson=await readableLesson(ctx,args,lessonId);const user=await authenticated(ctx,args);if(!await canWatchLesson(ctx,user,lesson))fail(403,'Your enrollment must be approved before you can access lessons.');return lesson;
}
export function limitedText(value:string,label:string,min:number,max:number){const result=value.trim();if(result.length<min||result.length>max)fail(400,`${label} must be ${min}–${max} characters.`);return result;}
export function nonnegative(value:number,max=864000){if(!Number.isFinite(value)||value<0||value>max)fail(400,'A valid nonnegative duration or position is required.');return value;}
