'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, UserRound } from 'lucide-react';
import { platformRequest } from '../lib/platform-client';
import type { Enrollment, EnrollmentRequest, User } from '../lib/platform-types';

function announceEnrollmentChange() {
  window.dispatchEvent(new CustomEvent('academy-enrollment-updated'));
}

export function AdminEnrollmentPanel({ user }: { user: User }) {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const allowed = user.role === 'admin';
  const refresh = useCallback(async () => {
    if (!allowed) return;
    setLoading(true); setError('');
    try { const result = await platformRequest<{ enrollments: EnrollmentRequest[] }>('/api/enrollments', { cache: 'no-store' }); setRequests(result.enrollments); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Enrollment requests could not be loaded.'); }
    finally { setLoading(false); }
  }, [allowed, user.id]);
  useEffect(() => { refresh(); }, [refresh]);
  async function update(studentId: string, status: 'approved' | 'revoked') {
    if (!allowed || updating) return;
    setUpdating(studentId); setError(''); setMessage('');
    try {
      const result = await platformRequest<{ enrollment: Enrollment }>(`/api/enrollments/${encodeURIComponent(studentId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setRequests(previous => previous.map(request => request.studentId === studentId ? { ...request, ...result.enrollment } : request));
      setMessage(status === 'approved' ? 'Student approved for uploaded lessons.' : 'Student access revoked.'); announceEnrollmentChange();
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Enrollment could not be updated.'); }
    finally { setUpdating(null); }
  }
  if (!allowed) return null;
  const sorted = [...requests].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || (b.requestedAt || '').localeCompare(a.requestedAt || ''));
  return <section className="ac-enrollment-admin" aria-labelledby="enrollment-requests-title" aria-busy={loading || !!updating}>
    <div className="ac-section-heading"><div><span className="ac-label">Administrator approval</span><h2 id="enrollment-requests-title">Student enrollment</h2></div><button className="ac-text-button" disabled={loading || !!updating} onClick={refresh}><RefreshCw size={17} className={loading ? 'ac-spin' : undefined} />{loading ? 'Refreshing…' : 'Refresh requests'}</button></div>
    <p>Approve students for uploaded lessons across the mentorship program. Approval is managed here; no payment is processed by this action.</p>
    {error && <div className="ac-error" role="alert">{error}</div>}
    {message && <div className="ac-success" role="status"><CheckCircle2 size={18} />{message}</div>}
    {loading && !requests.length ? <div className="ac-skeleton-list" role="status" aria-label="Loading enrollment requests"><div /><div /></div> : sorted.length ? <ul className="ac-enrollment-list">{sorted.map(request => <li key={request.studentId}><UserRound size={23} className="ac-enrollment-avatar" /><div className="ac-enrollment-student"><strong>{request.name}</strong><span>{request.email}</span><small className="ac-label">{request.status === 'none' ? 'No request' : request.status}{request.requestedAt ? ` · Requested ${new Date(request.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Addis_Ababa' })}` : ''}</small></div><button className={`ac-button ${request.status === 'approved' ? 'ac-button-outline' : 'ac-button-primary'}`} disabled={!!updating} onClick={() => update(request.studentId, request.status === 'approved' ? 'revoked' : 'approved')}>{updating === request.studentId ? 'Updating…' : request.status === 'approved' ? 'Revoke access' : 'Approve student'}</button></li>)}</ul> : !error && <div className="ac-enrollment-empty"><UserRound size={28} /><h3>No enrollment requests yet.</h3><p>Students can request access from their learning workspace.</p></div>}
  </section>;
}
