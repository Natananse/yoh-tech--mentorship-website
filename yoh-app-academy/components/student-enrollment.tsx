'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { platformRequest } from '../lib/platform-client';
import type { Enrollment, User } from '../lib/platform-types';

type EnrollmentResponse = { enrollment: Enrollment; canViewLessons: boolean };

function announceEnrollmentChange() {
  window.dispatchEvent(new CustomEvent('academy-enrollment-updated'));
}

export function useStudentEnrollment(user: User | null) {
  const enabled = user?.role === 'student';
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [canViewLessons, setCanViewLessons] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const load = useCallback(async (announce = false) => {
    if (!enabled) return;
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    try {
      const result = await platformRequest<EnrollmentResponse>('/api/enrollment', { cache: 'no-store' });
      if (requestVersion.current !== version) return;
      setEnrollment(result.enrollment); setCanViewLessons(result.canViewLessons);
      if (announce) announceEnrollmentChange();
    } catch (problem) {
      if (requestVersion.current === version) setError(problem instanceof Error ? problem.message : 'Enrollment status could not be loaded.');
    } finally { if (requestVersion.current === version) setLoading(false); }
  }, [enabled, user?.id]);
  useEffect(() => {
    setEnrollment(null); setCanViewLessons(false); setLoading(enabled);
    if (enabled) load();
    const changed = () => { if (enabled) load(); };
    window.addEventListener('academy-enrollment-updated', changed);
    return () => { requestVersion.current++; window.removeEventListener('academy-enrollment-updated', changed); };
  }, [enabled, load]);
  async function request() {
    if (!enabled || loading || requesting) return;
    const version = ++requestVersion.current;
    setRequesting(true); setError('');
    try {
      const result = await platformRequest<EnrollmentResponse>('/api/enrollment', { method: 'POST', body: '{}' });
      if (requestVersion.current !== version) return;
      setEnrollment(result.enrollment); setCanViewLessons(result.canViewLessons); announceEnrollmentChange();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Your enrollment request could not be sent.');
    } finally { setRequesting(false); }
  }
  return { enrollment, canViewLessons, loading, requesting, error, refresh: () => load(true), request };
}

export function StudentEnrollmentPanel({ state, compact = false }: { state: ReturnType<typeof useStudentEnrollment>; compact?: boolean }) {
  const { enrollment, loading, requesting, error, refresh, request } = state;
  const status = enrollment?.status;
  const approved = status === 'approved';
  return <section className={`ac-enrollment${compact ? ' ac-enrollment-compact' : ''}`} aria-label="Program enrollment" aria-busy={loading || requesting}>
    <div className="ac-enrollment-heading">
      {approved ? <ShieldCheck size={26} /> : status === 'pending' ? <Clock3 size={26} /> : <LockKeyhole size={26} />}
      <div><span className="ac-label">Mentorship program access</span><h2>{loading && !enrollment ? 'Checking your enrollment…' : approved ? 'Your enrollment is approved.' : status === 'pending' ? 'Your enrollment request is pending.' : status === 'revoked' ? 'Your lesson access has been revoked.' : 'Request access to uploaded lessons.'}</h2></div>
    </div>
    <p>{approved ? 'You can watch the program’s uploaded lessons and open their resources.' : status === 'pending' ? 'An administrator will review your request. Uploaded lessons open after approval.' : status === 'revoked' ? 'Request enrollment again to ask an administrator to restore your access.' : 'Uploaded recordings and resources need administrator approval. The interactive sample stays free.'}</p>
    {error && <p className="ac-enrollment-error" role="alert">{error}</p>}
    <div className="ac-enrollment-actions">
      {enrollment && (status === 'none' || status === 'revoked') && <button className="ac-button ac-button-primary" disabled={loading || requesting} onClick={request}>{requesting ? 'Sending request…' : 'Request enrollment'}</button>}
      <button className="ac-text-button" disabled={loading || requesting} onClick={refresh}><RefreshCw size={17} className={loading ? 'ac-spin' : undefined} />{loading ? 'Checking status…' : 'Refresh enrollment status'}</button>
    </div>
  </section>;
}

export function LessonAccessGate({ user, onAuthRequired }: { user: User | null; onAuthRequired?: () => void }) {
  const state = useStudentEnrollment(user);
  if (user?.role === 'student') return <StudentEnrollmentPanel state={state} compact />;
  return <section className="ac-enrollment ac-enrollment-compact" aria-label="Lesson access required"><div className="ac-enrollment-heading"><LockKeyhole size={28} /><div><span className="ac-label">Uploaded lesson</span><h2>{user ? 'This recording is not available to your account.' : 'Sign in to request lesson access.'}</h2></div></div><p>Uploaded recordings and resources are available to approved students. You can try the free interactive sample without enrollment.</p>{!user && onAuthRequired && <button className="ac-button ac-button-primary" onClick={onAuthRequired}>Sign in to request enrollment</button>}</section>;
}

