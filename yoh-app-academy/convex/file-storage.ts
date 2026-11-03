import { v } from 'convex/values';
import { publicLesson } from './academy';
import { mutation, query, type QueryContext } from './runtime';
import { authArgs, byId, fail, mentor, now, ownedLesson, readableLesson, requireServerSecret, type AuthArgs } from './security';

const kind = v.union(v.literal('video'), v.literal('resource'));
const validId = (id: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const fileRecord = (file: { id: string; originalName: string; size: number; mime: string }) => ({ id: file.id, name: file.originalName, url: `/api/files/${file.id}`, size: file.size, mime: file.mime });

function sha256Hex(value: string): string {
  if (/^[a-f0-9]{64}$/i.test(value)) return value.toLowerCase();
  // The production system table uses hex; accept base64 used by some SDK mocks.
  if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) return '';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let bits = 0, buffer = 0, hex = '';
  for (const character of value.slice(0, -1)) { buffer = (buffer << 6) | alphabet.indexOf(character); bits += 6; if (bits >= 8) { bits -= 8; hex += ((buffer >> bits) & 255).toString(16).padStart(2, '0'); buffer &= (1 << bits) - 1; } }
  return hex;
}

async function pendingUpload(ctx: QueryContext, args: AuthArgs & { lessonId: string; uploadId: string; storageId: string }) {
  const user = await mentor(ctx, args);
  const upload = await byId(ctx, 'uploads', args.uploadId);
  if (!upload || upload.userId !== user.id || upload.lessonId !== args.lessonId) fail(404, 'Upload request not found. Prepare the file again.');
  const { lesson } = await ownedLesson(ctx, args, upload.lessonId);
  if (upload.expiresAt <= Date.now()) fail(400, 'The upload request expired. Choose the file again.');
  const storageId = ctx.db.system.normalizeId('_storage', args.storageId);
  if (!storageId) fail(400, 'The uploaded file reference is invalid.');
  if (await ctx.db.query('files').withIndex('by_storageName', q => q.eq('storageName', storageId)).unique()) fail(409, 'This uploaded file is already attached. Choose the file again.');
  const metadata = await ctx.db.system.get('_storage', storageId);
  if (!metadata || metadata.size !== upload.size || sha256Hex(metadata.sha256) !== upload.sha256 || (metadata.contentType || '').toLowerCase().split(';')[0] !== upload.mime || metadata._creationTime < Date.parse(upload.createdAt)) fail(400, 'The uploaded file does not match the prepared file. Choose it again.');
  return { upload, lesson, storageId, metadata };
}

export const canUpload = query({ args: { ...authArgs, lessonId: v.string() }, handler: async (ctx, args) => { await ownedLesson(ctx, args, args.lessonId); return null; } });

export const prepareUpload = mutation({
  args: { ...authArgs, id: v.string(), lessonId: v.string(), kind, originalName: v.string(), mime: v.string(), size: v.number(), sha256: v.string() },
  handler: async (ctx, args) => {
    const { user } = await ownedLesson(ctx, args, args.lessonId);
    if (!validId(args.id) || !/^[a-f0-9]{64}$/.test(args.sha256)) fail(400, 'Prepare a valid upload request.');
    if (!args.originalName || args.originalName.length > 160 || /[\u0000-\u001f\u007f/\\]/.test(args.originalName)) fail(400, 'Choose a valid filename.');
    const extension = args.originalName.toLowerCase().split('.').pop();
    const expected = args.kind === 'video' ? extension === 'mp4' ? 'video/mp4' : extension === 'webm' ? 'video/webm' : '' : extension === 'pdf' ? 'application/pdf' : extension === 'zip' ? 'application/zip' : '';
    if (!expected || args.mime !== expected) fail(400, 'Choose a supported video or resource type.');
    if (!Number.isSafeInteger(args.size) || args.size <= 0 || args.size > (args.kind === 'video' ? 250 : 25) * 1024 * 1024) fail(413, args.kind === 'video' ? 'Videos must be 250 MB or smaller.' : 'Documents must be 25 MB or smaller.');
    if (await byId(ctx, 'uploads', args.id) || await byId(ctx, 'files', args.id)) fail(409, 'Prepare a new upload request.');
    const active = await ctx.db.query('uploads').withIndex('by_user', q => q.eq('userId', user.id)).filter(q => q.gt(q.field('expiresAt'), Date.now())).take(10);
    if (active.length >= 10) fail(429, 'Finish an existing upload or wait for its request to expire before trying again.');
    const files = await ctx.db.query('files').withIndex('by_lessonId', q => q.eq('lessonId', args.lessonId)).collect();
    if (args.kind === 'resource' && files.filter(file => file.kind === 'resource').length >= 20) fail(400, 'A lesson can have up to 20 resource files.');
    await ctx.db.insert('uploads', { id: args.id, userId: user.id, lessonId: args.lessonId, kind: args.kind, originalName: args.originalName, mime: args.mime, size: args.size, sha256: args.sha256, createdAt: now(), expiresAt: Date.now() + 3600000 });
    return { uploadId: args.id, uploadUrl: await ctx.storage.generateUploadUrl(), mime: args.mime };
  },
});

export const uploadInfo = query({
  args: { ...authArgs, lessonId: v.string(), uploadId: v.string(), storageId: v.string() },
  handler: async (ctx, args) => {
    // A lost success response may be retried without attaching or replacing twice.
    requireServerSecret(args);
    const attached = await byId(ctx, 'files', args.uploadId);
    if (attached) {
      const { lesson } = await ownedLesson(ctx, args, attached.lessonId);
      if (attached.storageName !== args.storageId || attached.lessonId !== args.lessonId) fail(409, 'This upload request has already been used.');
      return { attached: true as const, lesson: await publicLesson(ctx, lesson), file: fileRecord(attached) };
    }
    const { upload, storageId } = await pendingUpload(ctx, args);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) fail(404, 'The uploaded file is no longer available.');
    return { attached: false as const, lessonId: upload.lessonId, mime: upload.mime, url };
  },
});

export const attachUpload = mutation({
  args: { ...authArgs, lessonId: v.string(), uploadId: v.string(), storageId: v.string(), verifiedMime: v.string() },
  handler: async (ctx, args) => {
    requireServerSecret(args);
    const attached = await byId(ctx, 'files', args.uploadId);
    if (attached) {
      const { lesson } = await ownedLesson(ctx, args, attached.lessonId);
      if (attached.storageName !== args.storageId || attached.lessonId !== args.lessonId) fail(409, 'This upload request has already been used.');
      return { lesson: await publicLesson(ctx, lesson), file: fileRecord(attached) };
    }
    const { upload, lesson, storageId } = await pendingUpload(ctx, args);
    if (args.verifiedMime !== upload.mime) fail(400, 'The file contents could not be verified.');
    const files = await ctx.db.query('files').withIndex('by_lessonId', q => q.eq('lessonId', lesson.id)).collect();
    if (upload.kind === 'resource' && files.filter(file => file.kind === 'resource').length >= 20) fail(400, 'A lesson can have up to 20 resource files.');
    if (upload.kind === 'video') for (const old of files.filter(file => file.kind === 'video')) { await ctx.db.delete(old._id); await ctx.storage.delete(old.storageName); }
    const file = { id: upload.id, lessonId: lesson.id, kind: upload.kind, originalName: upload.originalName, storageName: storageId, mime: upload.mime, size: upload.size, createdAt: now() };
    await ctx.db.insert('files', file); await ctx.db.patch(lesson._id, { updatedAt: now() }); await ctx.db.delete(upload._id);
    return { lesson: await publicLesson(ctx, (await byId(ctx, 'lessons', lesson.id))!), file: fileRecord(file) };
  },
});

export const readFile = query({
  args: { ...authArgs, id: v.string() },
  handler: async (ctx, args) => {
    requireServerSecret(args);
    const file = await byId(ctx, 'files', args.id); if (!file) fail(404, 'File not found.');
    await readableLesson(ctx, args, file.lessonId);
    const url = await ctx.storage.getUrl(file.storageName); if (!url) fail(404, 'The file is no longer available.');
    return { url, mime: file.mime, size: file.size, kind: file.kind, originalName: file.originalName };
  },
});
