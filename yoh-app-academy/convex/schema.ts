import { defineSchema,defineTable } from 'convex/server';
import { v } from 'convex/values';

export const chapter=v.object({title:v.string(),time:v.number(),code:v.optional(v.string()),screen:v.optional(v.string())});
export const role=v.union(v.literal('student'),v.literal('mentor'),v.literal('admin'));
export const fileKind=v.union(v.literal('video'),v.literal('resource'));
export default defineSchema({
 users:defineTable({id:v.string(),name:v.string(),email:v.string(),passwordHash:v.string(),role,createdAt:v.string()}).index('by_legacyId',['id']).index('by_email',['email']),
 sessions:defineTable({tokenHash:v.string(),userId:v.string(),expiresAt:v.number(),createdAt:v.number()}).index('by_tokenHash',['tokenHash']).index('by_userId',['userId']).index('by_expiresAt',['expiresAt']),
 lessons:defineTable({id:v.string(),title:v.string(),description:v.string(),courseId:v.string(),mentorId:v.string(),duration:v.number(),published:v.boolean(),chapters:v.array(chapter),createdAt:v.string(),updatedAt:v.string()}).index('by_legacyId',['id']).index('by_mentorId',['mentorId']).index('by_courseId',['courseId']).index('by_published',['published']),
 files:defineTable({id:v.string(),lessonId:v.string(),kind:fileKind,originalName:v.string(),storageName:v.id('_storage'),mime:v.string(),size:v.number(),createdAt:v.string()}).index('by_legacyId',['id']).index('by_lessonId',['lessonId']).index('by_storageName',['storageName']),
 uploads:defineTable({id:v.string(),userId:v.string(),lessonId:v.string(),kind:fileKind,originalName:v.string(),mime:v.string(),size:v.number(),sha256:v.string(),createdAt:v.string(),expiresAt:v.number()}).index('by_legacyId',['id']).index('by_user',['userId']),
 progress:defineTable({userId:v.string(),lessonId:v.string(),position:v.number(),duration:v.number(),completed:v.boolean(),updatedAt:v.string()}).index('by_user_lesson',['userId','lessonId']).index('by_userId',['userId']).index('by_lessonId',['lessonId']),
 enrollments:defineTable({userId:v.string(),courseId:v.string(),createdAt:v.string()}).index('by_user_course',['userId','courseId']).index('by_courseId',['courseId']),
 loginAttempts:defineTable({key:v.string(),count:v.number(),resetAt:v.number()}).index('by_key',['key']),
 lessonViews:defineTable({userId:v.string(),lessonId:v.string(),firstViewedAt:v.string()}).index('by_user_lesson',['userId','lessonId']).index('by_lessonId',['lessonId']),
 notes:defineTable({id:v.string(),userId:v.string(),lessonId:v.string(),position:v.number(),body:v.string(),createdAt:v.string()}).index('by_legacyId',['id']).index('by_user_lesson',['userId','lessonId']),
 questions:defineTable({id:v.string(),userId:v.string(),lessonId:v.string(),position:v.union(v.number(),v.null()),body:v.string(),answer:v.union(v.string(),v.null()),answeredBy:v.union(v.string(),v.null()),answeredAt:v.union(v.string(),v.null()),createdAt:v.string()}).index('by_legacyId',['id']).index('by_lessonId',['lessonId']).index('by_user_lesson',['userId','lessonId']),
 certificates:defineTable({id:v.string(),userId:v.string(),courseId:v.string(),courseTitle:v.string(),recipientName:v.string(),completedLessonCount:v.number(),issuedAt:v.string()}).index('by_legacyId',['id']).index('by_user_course',['userId','courseId']).index('by_userId',['userId']),
});
