import { ApiError } from './http';
import { RESOURCE_LIMIT, VIDEO_LIMIT } from './uploads';

export type UploadDeclaration = { kind: 'video' | 'resource'; name: string; size: number; mime: string };

export function uploadDeclaration(body: Record<string, unknown>): UploadDeclaration {
  const kind = body.kind;
  if (kind !== 'video' && kind !== 'resource') throw new ApiError(400, 'Choose a video or resource upload.');
  if (typeof body.name !== 'string' || !body.name.trim()) throw new ApiError(400, 'Choose a file to upload.');
  const name = body.name.replace(/[\u0000-\u001f\u007f/\\]/g, '_').slice(0, 160);
  const extension = name.toLowerCase().split('.').pop();
  const mime = kind === 'video' ? extension === 'mp4' ? 'video/mp4' : extension === 'webm' ? 'video/webm' : '' : extension === 'pdf' ? 'application/pdf' : extension === 'zip' ? 'application/zip' : '';
  if (!mime) throw new ApiError(400, kind === 'video' ? 'Choose an MP4 or WebM video.' : 'Choose a PDF or ZIP resource.');
  if (typeof body.size !== 'number' || !Number.isSafeInteger(body.size) || body.size <= 0) throw new ApiError(400, 'The selected file is empty or has an invalid size.');
  if (body.size > (kind === 'video' ? VIDEO_LIMIT : RESOURCE_LIMIT)) throw new ApiError(413, kind === 'video' ? 'Videos must be 250 MB or smaller.' : 'Documents must be 25 MB or smaller.');
  const declaredMime = typeof body.mime === 'string' ? body.mime.toLowerCase().split(';')[0] : '';
  if (![mime, 'application/octet-stream', 'application/x-zip-compressed', ''].includes(declaredMime)) throw new ApiError(400, 'The file type does not match its extension.');
  return { kind, name, size: body.size, mime };
}

export function validateUploadSignature(bytes: Uint8Array, mime: string): void {
  const data = Buffer.from(bytes);
  const valid = mime === 'video/mp4' ? data.length >= 12 && data.subarray(4, 8).toString('ascii') === 'ftyp'
    : mime === 'video/webm' ? data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
      : mime === 'application/pdf' ? data.subarray(0, 5).toString('ascii') === '%PDF-'
        : mime === 'application/zip' ? data.length >= 4 && ['504b0304', '504b0506', '504b0708'].includes(data.subarray(0, 4).toString('hex')) : false;
  if (!valid) throw new ApiError(400, mime.startsWith('video/') ? 'Use a valid MP4 or WebM video.' : 'Use a valid PDF or ZIP resource.');
}

// Read only the signature, including if an upstream server ignores the Range header.
export async function uploadSignatureFromUrl(url: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetch(url, { headers: { Range: 'bytes=0-511' }, cache: 'no-store', signal: controller.signal, redirect: 'error' });
    if (!response.ok || !response.body) throw new ApiError(400, 'The uploaded file could not be verified. Try uploading it again.');
    reader = response.body.getReader();
    const prefix = new Uint8Array(512); let length = 0;
    while (length < 12) {
      const { value, done } = await reader.read(); if (done) break;
      const take = Math.min(value.byteLength, prefix.byteLength - length); prefix.set(value.subarray(0, take), length); length += take;
    }
    return prefix.subarray(0, length);
  } finally {
    await reader?.cancel().catch(() => {}); reader?.releaseLock(); clearTimeout(timeout); controller.abort();
  }
}
