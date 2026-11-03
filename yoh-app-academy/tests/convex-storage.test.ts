import { createHash, randomUUID } from 'node:crypto';
import { defineTestApp } from 'convex-test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import schema from '../convex/schema';
import * as academy from '../convex/academy';
import * as storage from '../convex/file-storage';
import { uploadDeclaration, uploadSignatureFromUrl, validateUploadSignature } from '../lib/server/upload-validation';

const app = defineTestApp({ schema }).defineModules({ academy, 'file-storage': storage });
const bridge = { serverSecret: 'test-only-storage-bridge-secret-1234567890' };
const mp4 = Buffer.from('000000186674797069736f6d0000000069736f6d', 'hex');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

async function fixture() {
  const t = app.createTest(); const lessonId = randomUUID(); const userIds = [randomUUID(), randomUUID(), randomUUID()];
  const auth = userIds.map((_, index) => ({ ...bridge, sessionHash: String(index + 1).repeat(64) }));
  await t.run(async ctx => {
    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];
      await ctx.db.insert('users', { id: userId, name: `Storage test ${index}`, email: `storage${index}@example.test`, role: index < 2 ? 'mentor' : 'student', passwordHash: `${'a'.repeat(32)}:${'b'.repeat(128)}`, createdAt: new Date().toISOString() });
      await ctx.db.insert('sessions', { userId, tokenHash: auth[index].sessionHash, expiresAt: Date.now() + 3600000, createdAt: Date.now() });
    }
    await ctx.db.insert('lessons', { id: lessonId, title: 'Upload a task card recording', description: 'A private lesson used for upload authorization checks.', courseId: '0', mentorId: userIds[0], duration: 48, published: false, chapters: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });
  return { t, lessonId, owner: auth[0], otherMentor: auth[1], student: auth[2] };
}

async function prepare(f: Awaited<ReturnType<typeof fixture>>, bytes: Uint8Array = mp4, options: Partial<{ kind: 'video' | 'resource'; originalName: string; mime: string; size: number; sha256: string }> = {}) {
  const result = await f.t.mutation(app.api['file-storage'].prepareUpload, { ...f.owner, id: randomUUID(), lessonId: f.lessonId, kind: 'video', originalName: 'lesson.mp4', mime: 'video/mp4', size: bytes.length, sha256: hash(bytes), ...options });
  return result.uploadId;
}

beforeEach(() => vi.stubEnv('YOH_CONVEX_SERVER_SECRET', bridge.serverSecret));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Convex direct lesson uploads', () => {
  it('requires a valid private bridge, mentor role and lesson ownership before issuing an upload URL', async () => {
    const f = await fixture(); const args = { id: randomUUID(), lessonId: f.lessonId, kind: 'video' as const, originalName: 'lesson.mp4', mime: 'video/mp4', size: mp4.length, sha256: hash(mp4) };
    await expect(f.t.mutation(app.api['file-storage'].prepareUpload, { ...f.owner, ...args, serverSecret: 'wrong' })).rejects.toMatchObject({ data: { status: 403 } });
    await expect(f.t.mutation(app.api['file-storage'].prepareUpload, { ...f.student, ...args })).rejects.toMatchObject({ data: { status: 403 } });
    await expect(f.t.mutation(app.api['file-storage'].prepareUpload, { ...f.otherMentor, ...args })).rejects.toMatchObject({ data: { status: 403 } });
    await expect(f.t.mutation(app.api['file-storage'].prepareUpload, { ...f.owner, ...args, size: 250 * 1024 * 1024 + 1 })).rejects.toMatchObject({ data: { status: 413 } });
    await expect(f.t.mutation(app.api['file-storage'].prepareUpload, { ...f.owner, ...args, mime: 'text/html' })).rejects.toMatchObject({ data: { status: 400 } });
  });

  it('attaches only a matching fresh file, consumes the intent and keeps retries idempotent', async () => {
    const f = await fixture(); const uploadId = await prepare(f);
    const storageId = await f.t.run(ctx => ctx.storage.store(new Blob([mp4], { type: 'video/mp4' })));
    const args = { ...f.owner, lessonId: f.lessonId, uploadId, storageId };
    const info = await f.t.query(app.api['file-storage'].uploadInfo, args); expect(info).toMatchObject({ attached: false, mime: 'video/mp4' });
    const attached = await f.t.mutation(app.api['file-storage'].attachUpload, { ...args, verifiedMime: 'video/mp4' }); expect(attached.lesson.videoUrl).toBe(`/api/files/${uploadId}`);
    const again = await f.t.mutation(app.api['file-storage'].attachUpload, { ...args, verifiedMime: 'video/mp4' }); expect(again).toEqual(attached);
    expect(await f.t.query(app.api['file-storage'].uploadInfo, args)).toMatchObject({ attached: true, file: { id: uploadId } });
    expect(await f.t.run(ctx => ctx.db.query('uploads').collect())).toHaveLength(0); expect(await f.t.run(ctx => ctx.db.query('files').collect())).toHaveLength(1);
    await expect(f.t.query(app.api['file-storage'].readFile, { ...bridge, id: uploadId })).rejects.toMatchObject({ data: { status: 404 } });
    await expect(f.t.query(app.api['file-storage'].readFile, { ...f.student, id: uploadId })).rejects.toMatchObject({ data: { status: 404 } });
    await expect(f.t.query(app.api['file-storage'].readFile, { ...f.otherMentor, id: uploadId })).rejects.toMatchObject({ data: { status: 404 } });
    expect(await f.t.query(app.api['file-storage'].readFile, { ...f.owner, id: uploadId })).toMatchObject({ size: mp4.length, mime: 'video/mp4' });
    await f.t.mutation(app.api.academy.updateLesson, { ...f.owner, id: f.lessonId, published: true });
    expect(await f.t.query(app.api['file-storage'].readFile, { ...bridge, id: uploadId })).toHaveProperty('url');
  });

  it('rejects hash, size, MIME, age and cross-mentor mismatches without deleting the reported file', async () => {
    const f = await fixture(); const uploadId = await prepare(f);
    const wrongBytes = Buffer.from(mp4); wrongBytes[wrongBytes.length - 1] ^= 1;
    const mismatchFiles = await f.t.run(async ctx => Promise.all([
      ctx.storage.store(new Blob([wrongBytes], { type: 'video/mp4' })),
      ctx.storage.store(new Blob([mp4, 'extra'], { type: 'video/mp4' })),
      ctx.storage.store(new Blob([mp4], { type: 'application/pdf' })),
    ]));
    for (const storageId of mismatchFiles) await expect(f.t.query(app.api['file-storage'].uploadInfo, { ...f.owner, lessonId: f.lessonId, uploadId, storageId })).rejects.toMatchObject({ data: { status: 400 } });
    for (const storageId of mismatchFiles) expect(await f.t.run(ctx => ctx.storage.getUrl(storageId))).toBeTruthy();
    const correct = await f.t.run(ctx => ctx.storage.store(new Blob([mp4], { type: 'video/mp4' })));
    await expect(f.t.query(app.api['file-storage'].uploadInfo, { ...f.otherMentor, lessonId: f.lessonId, uploadId, storageId: correct })).rejects.toMatchObject({ data: { status: 404 } });
    await f.t.run(async ctx => { const ticket = await ctx.db.query('uploads').withIndex('by_legacyId', q => q.eq('id', uploadId)).unique(); await ctx.db.patch(ticket!._id, { createdAt: new Date(Date.now() + 5000).toISOString() }); });
    await expect(f.t.query(app.api['file-storage'].uploadInfo, { ...f.owner, lessonId: f.lessonId, uploadId, storageId: correct })).rejects.toMatchObject({ data: { status: 400 } });
    expect(await f.t.run(ctx => ctx.storage.getUrl(correct))).toBeTruthy();
  });

  it('replaces only the owning lesson video and rejects reusing a claimed storage ID', async () => {
    const f = await fixture(); const first = await prepare(f); const oldStorageId = await f.t.run(ctx => ctx.storage.store(new Blob([mp4], { type: 'video/mp4' })));
    await f.t.mutation(app.api['file-storage'].attachUpload, { ...f.owner, lessonId: f.lessonId, uploadId: first, storageId: oldStorageId, verifiedMime: 'video/mp4' });
    const second = await prepare(f);
    await expect(f.t.query(app.api['file-storage'].uploadInfo, { ...f.owner, lessonId: f.lessonId, uploadId: second, storageId: oldStorageId })).rejects.toMatchObject({ data: { status: 409 } });
    const newStorageId = await f.t.run(ctx => ctx.storage.store(new Blob([mp4], { type: 'video/mp4' })));
    await f.t.mutation(app.api['file-storage'].attachUpload, { ...f.owner, lessonId: f.lessonId, uploadId: second, storageId: newStorageId, verifiedMime: 'video/mp4' });
    expect(await f.t.run(ctx => ctx.storage.getUrl(oldStorageId))).toBeNull(); expect(await f.t.run(ctx => ctx.storage.getUrl(newStorageId))).toBeTruthy();
    const files = await f.t.run(ctx => ctx.db.query('files').collect()); expect(files).toHaveLength(1); expect(files[0].id).toBe(second);
  });

  it('expires upload intents and bounds the number of active requests', async () => {
    const f = await fixture(); const uploadId = await prepare(f); const storageId = await f.t.run(ctx => ctx.storage.store(new Blob([mp4], { type: 'video/mp4' })));
    await f.t.run(async ctx => { const ticket = await ctx.db.query('uploads').withIndex('by_legacyId', q => q.eq('id', uploadId)).unique(); await ctx.db.patch(ticket!._id, { expiresAt: Date.now() - 1 }); });
    await expect(f.t.query(app.api['file-storage'].uploadInfo, { ...f.owner, lessonId: f.lessonId, uploadId, storageId })).rejects.toMatchObject({ data: { status: 400 } });
    for (let index = 0; index < 10; index++) await prepare(f);
    await expect(prepare(f)).rejects.toMatchObject({ data: { status: 429 } });
  });

  it('rechecks the resource cap when finalizing an upload prepared before the limit was reached', async () => {
    const f = await fixture(); const pdf = Buffer.from('%PDF-1.7 resource');
    const options = { kind: 'resource' as const, originalName: 'resource.pdf', mime: 'application/pdf' };
    const uploadId = await prepare(f, pdf, options); const storageId = await f.t.run(ctx => ctx.storage.store(new Blob([pdf], { type: 'application/pdf' })));
    await f.t.run(async ctx => {
      for (let index = 0; index < 20; index++) {
        const resourceStorage = await ctx.storage.store(new Blob([pdf, String(index)], { type: 'application/pdf' }));
        await ctx.db.insert('files', { id: randomUUID(), lessonId: f.lessonId, kind: 'resource', originalName: `resource-${index}.pdf`, storageName: resourceStorage, mime: 'application/pdf', size: pdf.length + String(index).length, createdAt: new Date().toISOString() });
      }
    });
    await expect(prepare(f, pdf, options)).rejects.toMatchObject({ data: { status: 400 } });
    await expect(f.t.mutation(app.api['file-storage'].attachUpload, { ...f.owner, lessonId: f.lessonId, uploadId, storageId, verifiedMime: 'application/pdf' })).rejects.toMatchObject({ data: { status: 400 } });
    expect(await f.t.run(ctx => ctx.db.query('files').collect())).toHaveLength(20); expect(await f.t.run(ctx => ctx.storage.getUrl(storageId))).toBeTruthy();
  });
});

describe('Hosted file signature validation', () => {
  it('rejects disguised files and accepts supported binary signatures', () => {
    expect(() => validateUploadSignature(mp4, 'video/mp4')).not.toThrow();
    expect(() => validateUploadSignature(Buffer.from('%PDF-1.7'), 'application/pdf')).not.toThrow();
    expect(() => validateUploadSignature(Buffer.from('<html>fake.pdf</html>'), 'application/pdf')).toThrow('Use a valid PDF');
    expect(() => uploadDeclaration({ kind: 'video', name: 'recording.mp4', size: 1, mime: 'text/html' })).toThrow('file type');
  });

  it('cancels an upstream stream after a small prefix when Range is ignored', async () => {
    const cancel = vi.fn(); const pull = vi.fn();
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(Buffer.concat([mp4, Buffer.alloc(1024 * 1024)])); }, pull, cancel });
    const mockedFetch = vi.fn().mockResolvedValue(new Response(body)); vi.stubGlobal('fetch', mockedFetch);
    const prefix = await uploadSignatureFromUrl('https://example.test/large-recording'); expect(prefix.length).toBeLessThanOrEqual(512); validateUploadSignature(prefix, 'video/mp4'); expect(cancel).toHaveBeenCalledOnce();
    expect(mockedFetch.mock.calls[0][1].headers).toEqual({ Range: 'bytes=0-511' });
  });
});
