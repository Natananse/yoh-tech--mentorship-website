'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { MotionConfig } from 'framer-motion';
import { ArrowRight, CheckCircle2, Smartphone, X } from 'lucide-react';
import { AcademyHomepage } from '../components/academy-homepage';
import { AcademyAuthDialog, AccountWorkspace, platformRequest } from '../components/academy-account';
import { AcademyStudio } from '../components/academy-studio';
import { courses, type Course } from '../lib/academy-data';
import type { User } from '../lib/platform-types';

type View = 'website' | 'dashboard' | 'studio';

function ProgramDialog({ course, onClose, onWatch }: { course: Course; onClose: () => void; onWatch: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="ac-course-dialog" aria-labelledby="course-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <button className="ac-icon-button ac-dialog-close" type="button" autoFocus onClick={onClose} aria-label="Close course details"><X size={21} /></button>
    <span className="ac-label">{course.category} / {course.level}</span>
    <h2 id="course-dialog-title">{course.title}</h2><p>{course.desc}</p>
    <div className="ac-course-project"><Smartphone size={25} /><div><span className="ac-label">What you’ll build</span><b>{course.project}</b></div></div>
    <span className="ac-label">Course outline</span><ul>{course.topics.map(topic => <li key={topic}><CheckCircle2 size={18} />{topic}</li>)}</ul>
    <p className="ac-placeholder-note">Planning preview. Final course availability, mentor details and prices are still being confirmed. The sample classroom is free to try.</p>
    <button className="ac-button ac-button-primary" onClick={onWatch}>Watch a free lesson <ArrowRight size={18} /></button>
  </dialog>;
}

export default function Page() {
  const [view, setView] = useState<View>('website');
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'student' | 'mentor'>('student');
  const [message, setMessage] = useState('');
  const courseTrigger = useRef<HTMLButtonElement | null>(null);
  const authTrigger = useRef<HTMLElement | null>(null);
  const authTarget = useRef<View | null>(null);

  useEffect(() => {
    let mounted = true;
    platformRequest<{ user: User | null }>('/api/auth/me', { cache: 'no-store' }).then(result => { if (mounted) setUser(result.user); }).catch(() => { if (mounted) setUser(null); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 5000); return () => clearTimeout(timer); }, [message]);

  function go(next: View) { setView(next); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function requestAuth(target: View | null = null) {
    authTarget.current = target; authTrigger.current = document.activeElement as HTMLElement | null;
    setAuthRole(target === 'studio' ? 'mentor' : 'student'); setAuthOpen(true);
  }
  function openWorkspace() { if (user) go('dashboard'); else requestAuth('dashboard'); }
  function openStudio() { if (user) go('studio'); else requestAuth('studio'); }
  function closeAuth() { setAuthOpen(false); requestAnimationFrame(() => authTrigger.current?.isConnected && authTrigger.current.focus()); }
  function authenticated(nextUser: User) {
    setUser(nextUser); setAuthOpen(false); window.dispatchEvent(new CustomEvent('academy-auth-updated'));
    if (authTarget.current) go(authTarget.current); authTarget.current = null;
  }
  async function logout() {
    try { await platformRequest('/api/auth/logout', { method: 'POST', body: '{}' }); setUser(null); go('website'); window.dispatchEvent(new CustomEvent('academy-auth-updated')); }
    catch (problem) { setMessage(problem instanceof Error ? problem.message : 'Sign out failed. Please try again.'); }
  }
  function openCourse(index: number, event: MouseEvent<HTMLButtonElement>) { courseTrigger.current = event.currentTarget; setSelected(courses[index]); }
  function closeCourse() { setSelected(null); requestAnimationFrame(() => courseTrigger.current?.isConnected && courseTrigger.current.focus()); }
  function watchSample() {
    setSelected(null); setView('website'); requestAnimationFrame(() => document.getElementById('sample-lesson')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  }

  return <MotionConfig reducedMotion="never">
    {view === 'website' && <AcademyHomepage courses={courses} user={user} onAuth={() => requestAuth()} onLogout={logout} onWorkspace={openWorkspace} onStudio={openStudio} onOpenCourse={openCourse} />}
    {view === 'dashboard' && <AccountWorkspace user={user} onHome={() => go('website')} onStudio={openStudio} onSignIn={() => requestAuth('dashboard')} onLogout={logout} />}
    {view === 'studio' && <AcademyStudio user={user} onHome={() => go('website')} onWorkspace={openWorkspace} onSignIn={() => requestAuth('studio')} onLogout={logout} />}
    {selected && <ProgramDialog course={selected} onClose={closeCourse} onWatch={watchSample} />}
    {authOpen && <AcademyAuthDialog onClose={closeAuth} onSuccess={authenticated} initialRole={authRole} />}
    {message && <div className="ac-toast" role="alert"><span>{message}</span><button className="ac-icon-button" aria-label="Dismiss message" onClick={() => setMessage('')}><X size={18} /></button></div>}
  </MotionConfig>;
}
