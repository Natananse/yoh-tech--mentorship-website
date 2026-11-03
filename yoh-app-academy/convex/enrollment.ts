import { v } from 'convex/values';
import { mutation,query,type DataModel } from './runtime';
import type { DocumentByName } from 'convex/server';
import { administrator,authArgs,authenticated,byId,canViewProgram,enrollmentForStudent,fail,now,optionalUser } from './security';

function snapshot(row:DocumentByName<DataModel,'programEnrollments'>|null){return{status:row?.status||'none' as const,requestedAt:row?.requestedAt??null,approvedAt:row?.approvedAt??null};}
function studentRecord(user:DocumentByName<DataModel,'users'>,row:DocumentByName<DataModel,'programEnrollments'>){return{studentId:user.id,name:user.name,email:user.email,...snapshot(row)};}

export const getEnrollment=query({args:authArgs,handler:async(ctx,args)=>{
 const user=await optionalUser(ctx,args);const row=user?.role==='student'?await enrollmentForStudent(ctx,user.id):null;return{enrollment:snapshot(row),canViewLessons:await canViewProgram(ctx,user)};
}});
export const requestEnrollment=mutation({args:authArgs,handler:async(ctx,args)=>{
 const user=await authenticated(ctx,args);if(user.role!=='student')fail(403,'Only student accounts can request enrollment.');const existing=await enrollmentForStudent(ctx,user.id);
 if(existing&&(existing.status==='pending'||existing.status==='approved'))return{enrollment:snapshot(existing),canViewLessons:existing.status==='approved'};
 const record={studentId:user.id,status:'pending' as const,requestedAt:now(),approvedAt:null};if(existing)await ctx.db.patch(existing._id,record);else await ctx.db.insert('programEnrollments',record);
 return{enrollment:snapshot((await enrollmentForStudent(ctx,user.id))!),canViewLessons:false};
}});
export const listEnrollments=query({args:authArgs,handler:async(ctx,args)=>{
 await administrator(ctx,args);const rows=await ctx.db.query('programEnrollments').collect();const enrollments=[];
 for(const row of rows){const user=await byId(ctx,'users',row.studentId);if(user?.role==='student')enrollments.push(studentRecord(user,row));}
 enrollments.sort((a,b)=>(b.requestedAt||b.approvedAt||'').localeCompare(a.requestedAt||a.approvedAt||''));return{enrollments};
}});
export const setEnrollment=mutation({args:{...authArgs,studentId:v.string(),status:v.union(v.literal('approved'),v.literal('revoked'))},handler:async(ctx,args)=>{
 await administrator(ctx,args);const student=await byId(ctx,'users',args.studentId);if(!student||student.role!=='student')fail(404,'Student not found.');const existing=await enrollmentForStudent(ctx,student.id);
 const record={studentId:student.id,status:args.status,requestedAt:existing?.requestedAt??null,approvedAt:args.status==='approved'?(existing?.status==='approved'?existing.approvedAt||now():now()):null};
 if(existing)await ctx.db.patch(existing._id,record);else await ctx.db.insert('programEnrollments',record);return{enrollment:studentRecord(student,(await enrollmentForStudent(ctx,student.id))!)};
}});
