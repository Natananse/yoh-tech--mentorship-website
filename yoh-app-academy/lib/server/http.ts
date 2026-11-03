import { NextResponse } from 'next/server';
import { acceptedRequestOrigins } from './origin';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function handleError(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  if (error instanceof Error && (error as Error & {code?:string}).code === 'YOH_REMOTE_DATABASE_REQUIRED') return json({error:error.message},503);
  console.error('Academy API request failed:', error instanceof Error ? error.message : 'Unknown error');
  return json({ error: 'The request could not be completed. Please try again.' }, 500);
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && !acceptedRequestOrigins(request).includes(origin)) throw new ApiError(403, 'This request came from a different site.');
  if (!origin && request.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403, 'Cross-site requests are not allowed.');
}
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 64 * 1024) throw new ApiError(413, 'The request is too large.');
  const text = await request.text();
  if (Buffer.byteLength(text) > 64 * 1024) throw new ApiError(413, 'The request is too large.');
  try {
    const value = JSON.parse(text);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch { throw new ApiError(400, 'Send a valid JSON object.'); }
}
export function text(value: unknown, name: string, minimum: number, maximum: number): string {
  if (typeof value !== 'string' || value.trim().length < minimum || value.trim().length > maximum) throw new ApiError(400, `${name} must be ${minimum}–${maximum} characters.`);
  return value.trim();
}
export function number(value: unknown, fallback = 0, maximum = 864000): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) throw new ApiError(400, 'A valid nonnegative duration or position is required.');
  return value;
}
