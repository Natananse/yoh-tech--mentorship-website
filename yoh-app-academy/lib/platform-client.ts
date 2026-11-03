export async function platformRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The request could not be completed. Try again.');
  return body as T;
}
