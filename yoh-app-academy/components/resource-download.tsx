'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Download } from 'lucide-react';

// Blob URLs keep the original filename even when the authorized file route
// redirects to another origin. Resource bytes go directly to this browser.
export function ResourceDownload({ url, name, className, children, ariaLabel }: { url: string; name: string; className?: string; children?: ReactNode; ariaLabel?: string }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  async function download(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); if (pending.current) return;
    const controller = new AbortController(); pending.current = controller; setDownloading(true); setError('');
    try {
      const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal });
      if (!response.ok) throw new Error('The file could not be downloaded.');
      if (Number(response.headers.get('content-length') || 0) > 25 * 1024 * 1024) throw new Error('This resource is larger than the supported download size.');
      const blob = await response.blob();
      if (blob.size > 25 * 1024 * 1024) throw new Error('This resource is larger than the supported download size.');
      const objectUrl = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = objectUrl; link.download = name; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (problem) {
      if (!controller.signal.aborted) setError('The automatic download did not start. Open the file and choose Save.');
    } finally { if (pending.current === controller) pending.current = null; setDownloading(false); }
  }

  return <><a href={url} download={name} className={className} aria-label={downloading ? `Downloading ${name}` : ariaLabel || `Download ${name}`} aria-busy={downloading} aria-disabled={downloading || undefined} onClick={download}>{downloading ? <span>Downloading…</span> : children || <><Download size={18} /><span>Download</span></>}</a>{error && <p role="alert" style={{ flexBasis: '100%', fontSize: 16, color: 'var(--danger)', margin: '8px 0' }}>{error} <a href={url} target="_blank" rel="noopener noreferrer">Open file to save</a></p>}</>;
}
