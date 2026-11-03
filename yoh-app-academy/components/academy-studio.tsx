'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, Check, CheckCircle2, Download, Eye, FileText, Film, LoaderCircle, Plus, RefreshCw, Save, UploadCloud, Video } from 'lucide-react';
import type { Lesson, MentorAnalytics, User } from '../lib/platform-types';
import { courses } from '../lib/academy-data';
import { LessonWorkspace } from './academy-upgrade';
import { AccountGate, AccountHeader, platformRequest } from './academy-account';

const VIDEO_LIMIT = 250 * 1024 * 1024;
const RESOURCE_LIMIT = 25 * 1024 * 1024;

export function AcademyStudio({ user, onHome, onWorkspace, onSignIn, onLogout }: { user: User | null; onHome: () => void; onWorkspace: () => void; onSignIn: () => void; onLogout: () => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [current, setCurrent] = useState<Lesson | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('0');
  const [duration, setDuration] = useState(0);
  const [chapters, setChapters] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<MentorAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'video' | 'resource' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);
  const [browserDraft, setBrowserDraft] = useState<{ title: string; course?: string; description?: string } | null>(null);
  const activeRequest = useRef<XMLHttpRequest | null>(null);
  const allowed = user?.role === 'mentor' || user?.role === 'admin';
  const refresh = useCallback(async () => {
    if (!allowed) { setLoading(false); return; }
    setRefreshing(true);
    const results = await Promise.allSettled([platformRequest<{ lessons: Lesson[] }>('/api/lessons'), platformRequest<MentorAnalytics>('/api/analytics')]);
    if (results[0].status === 'fulfilled') setLessons(results[0].value.lessons.filter(lesson => user.role === 'admin' || lesson.mentorId === user.id));
    else setError(results[0].reason instanceof Error ? results[0].reason.message : 'Lessons could not be loaded.');
    if (results[1].status === 'fulfilled') { setAnalytics(results[1].value); setAnalyticsError(''); }
    else setAnalyticsError('Lesson activity is unavailable. Your lesson editor still works.');
    setLoading(false); setRefreshing(false);
  }, [allowed, user?.id, user?.role]);
  useEffect(() => { refresh(); return () => activeRequest.current?.abort(); }, [refresh]);
  useEffect(() => {
    if (!allowed) return;
    try {
      const raw = localStorage.getItem('yoh-lesson-draft-v2');
      if (raw) { const draft = JSON.parse(raw); if (typeof draft.title === 'string' && draft.title.trim()) setBrowserDraft(draft); }
    } catch { /* Preserve unreadable older browser data. */ }
  }, [allowed]);
  function importBrowserDraft() {
    if (!browserDraft || current) return;
    setTitle(browserDraft.title.slice(0, 160));
    setDescription(typeof browserDraft.description === 'string' ? browserDraft.description.slice(0, 5000) : '');
    const index = courses.findIndex(course => course.title === browserDraft.course);
    setCourseId(String(Math.max(0, index)));
    setMessage('Imported the browser draft. Save it to add it to your account. The original browser copy is preserved.');
  }


  function select(lesson: Lesson | null) {
    if (uploading || saving) return;
    setCurrent(lesson); setTitle(lesson?.title || ''); setDescription(lesson?.description || ''); setCourseId(lesson?.courseId || '0'); setDuration(lesson?.duration || 0);
    setChapters(lesson?.chapters.map(chapter => `${formatTime(chapter.time)} ${chapter.title}`).join('\n') || '');
    setError(''); setMessage(''); setPreview(false);
  }

  function parsedChapters() {
    return chapters.split('\n').filter(line => line.trim()).map(line => {
      const match = line.trim().match(/^(\d{1,3}):(\d{2})\s+(.+)$/);
      if (!match || Number(match[2]) > 59) throw new Error('Write each chapter as mm:ss followed by its title.');
      return { time: Number(match[1]) * 60 + Number(match[2]), title: match[3] };
    });
  }

  async function save(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); if (uploading) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const body = { title: title.trim(), description: description.trim(), courseId, duration, chapters: parsedChapters(), ...(current ? {} : { published: false }) };
      const result = await platformRequest<{ lesson: Lesson }>(current ? `/api/lessons/${current.id}` : '/api/lessons', { method: current ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      setCurrent(result.lesson); setMessage('Draft saved to the academy database.'); await refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'The draft could not be saved.'); }
    finally { setSaving(false); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, kind: 'video' | 'resource') {
    const input = event.currentTarget; const file = input.files?.[0]; input.value = '';
    if (!file || !current) return;
    setError(''); setMessage('');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (kind === 'video' && !['mp4', 'webm'].includes(extension || '')) { setError('Choose an MP4 or WebM video.'); return; }
    if (kind === 'resource' && !['pdf', 'zip'].includes(extension || '')) { setError('Choose a PDF or ZIP resource.'); return; }
    const limit = kind === 'video' ? VIDEO_LIMIT : RESOURCE_LIMIT;
    if (file.size > limit) { setError(`${kind === 'video' ? 'Videos' : 'Resources'} must be ${kind === 'video' ? '250' : '25'} MB or smaller.`); return; }
    if (!file.size) { setError('This file is empty. Choose another file.'); return; }
    setUploading(kind); setUploadProgress(0);
    try {
      const measuredDuration = kind === 'video' ? await videoDuration(file) : 0;
      const result = await new Promise<{ lesson: Lesson }>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); activeRequest.current = xhr;
        xhr.open('POST', `/api/lessons/${current.id}/files`); xhr.withCredentials = true;
        xhr.upload.onprogress = progress => { if (progress.lengthComputable) setUploadProgress(Math.round(progress.loaded / progress.total * 100)); };
        xhr.onerror = () => reject(new Error('The connection was interrupted. Try the upload again.'));
        xhr.onabort = () => reject(new Error('Upload cancelled. Your lesson draft is safe.'));
        xhr.onload = () => {
          let result: { lesson: Lesson; error?: string };
          try { result = JSON.parse(xhr.responseText); } catch { reject(new Error('The server could not accept this file.')); return; }
          if (xhr.status < 200 || xhr.status >= 300) { reject(new Error(result.error || 'Upload failed. Please try again.')); return; }
          resolve(result);
        };
        const form = new FormData(); form.append('kind', kind); form.append('file', file); xhr.send(form);
      });
      let next = result.lesson;
      if (kind === 'video' && measuredDuration > 0) {
        setDuration(measuredDuration);
        const updated = await platformRequest<{ lesson: Lesson }>(`/api/lessons/${current.id}`, { method: 'PATCH', body: JSON.stringify({ duration: measuredDuration }) });
        next = updated.lesson;
      }
      setCurrent(next); setUploadProgress(100); setMessage(`${file.name} uploaded. ${next.published ? 'Your lesson is available to students.' : 'Review the lesson, then publish it for students.'}`); await refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'The upload failed.'); }
    finally { setUploading(null); activeRequest.current = null; }
  }

  async function togglePublished() {
    if (!current || uploading || saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const result = await platformRequest<{ lesson: Lesson }>(`/api/lessons/${current.id}`, { method: 'PATCH', body: JSON.stringify({ title: title.trim(), description: description.trim(), courseId, duration, chapters: parsedChapters(), published: !current.published }) });
      setCurrent(result.lesson); setMessage(result.lesson.published ? 'Published. Students can now open this lesson.' : 'Unpublished. The lesson is now a draft.'); await refresh();
      window.dispatchEvent(new CustomEvent('academy-lessons-updated'));
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'The lesson could not be published.'); }
    finally { setSaving(false); }
  }

  const activity = analytics?.lessons.filter(lesson => lesson.uniqueViewers > 0 || lesson.completions > 0) || [];
  if (!user) return <div className="ac-site"><AccountHeader user={null} onHome={onHome} /><AccountGate title="A home for your next lesson." description="Sign in with an invited mentor account to upload videos, add resources and publish your lessons." onSignIn={onSignIn} onHome={onHome} /></div>;
  if (!allowed) return <div className="ac-site"><AccountHeader user={user} onHome={onHome} onWorkspace={onWorkspace} onLogout={onLogout} /><AccountGate title="The studio is for invited mentors." description="Your student account can watch published lessons and save progress. Ask the academy administrator if you need a mentor invitation." onHome={onHome} /><div className="ac-gate-link"><button className="ac-button ac-button-primary" onClick={onWorkspace}>Go to my learning <ArrowRight size={17} /></button></div></div>;

  return <div className="ac-site"><AccountHeader user={user} active="studio" onHome={onHome} onWorkspace={onWorkspace} onStudio={() => { setPreview(false); }} onLogout={onLogout} /><main className="ac-workspace">
    <div className="ac-page-heading"><div><span className="ac-label">{user.role === 'admin' ? 'Academy administration' : 'Mentor workspace'}</span><h1>Make the next idea clear.</h1><p>Save a draft, upload a recording and add the files students need.</p></div><button className="ac-button ac-button-primary" onClick={() => select(null)} disabled={!!uploading || saving}><Plus size={18} />New lesson</button></div>
    <section className="ac-analytics" aria-labelledby="studio-activity-title">
      <div className="ac-analytics-heading"><div><span className="ac-label">From student activity</span><h2 id="studio-activity-title">Lesson activity</h2></div><button className="ac-text-button" type="button" disabled={refreshing} onClick={refresh}><RefreshCw size={17} className={refreshing ? 'ac-spin' : undefined} />{refreshing ? 'Refreshing…' : 'Refresh activity'}</button></div>
      {analyticsError && <p className="ac-analytics-error" role="status">{analyticsError}</p>}
      {!analytics && loading ? <div className="ac-analytics-skeleton" role="status" aria-label="Loading lesson activity"><span /><span /></div> : activity.length > 0 ? <>
        <div className="ac-analytics-totals">{analytics.metrics.uniqueViewers > 0 && <div><Eye size={21} /><strong>{analytics.metrics.uniqueViewers}</strong><span>Unique student {analytics.metrics.uniqueViewers === 1 ? 'viewer' : 'viewers'}</span></div>}{analytics.metrics.completions > 0 && <div><CheckCircle2 size={21} /><strong>{analytics.metrics.completions}</strong><span>Lesson {analytics.metrics.completions === 1 ? 'completion' : 'completions'}</span></div>}</div>
        <table className="ac-analytics-table"><thead><tr><th scope="col">Lesson</th><th scope="col">Student viewers</th><th scope="col">Completed</th></tr></thead><tbody>{activity.map(lesson => <tr key={lesson.id}><th scope="row"><span>{lesson.title}</span><small>{lesson.published ? 'Published' : 'Draft'}</small></th><td>{lesson.uniqueViewers > 0 ? lesson.uniqueViewers : <span aria-label="No viewers yet">—</span>}</td><td>{lesson.completions > 0 ? lesson.completions : <span aria-label="No completions yet">—</span>}</td></tr>)}</tbody></table>
        <p className="ac-analytics-note">Viewers are signed-in students who watched this lesson. Each student is counted once per lesson.</p>
      </> : !analyticsError && <div className="ac-analytics-empty"><Eye size={25} /><div><h3>No viewing activity yet.</h3><p>Student viewers and completed lessons appear here after students start learning.</p></div></div>}
    </section>
    {browserDraft && !current && <div className="ac-legacy-draft"><p>A draft from the earlier preview is still saved in this browser.</p><button className="ac-button ac-button-outline" onClick={importBrowserDraft}>Import saved browser draft</button></div>}
    <div className="ac-studio-layout"><aside className="ac-studio-sidebar"><div className="ac-section-heading"><h2>Your lessons</h2></div>{loading ? <div className="ac-skeleton-list" role="status" aria-label="Loading mentor lessons"><div /><div /></div> : lessons.length ? <div className="ac-studio-lesson-list">{lessons.map(lesson => <button key={lesson.id} className={current?.id === lesson.id ? 'is-active' : ''} onClick={() => select(lesson)} disabled={!!uploading || saving}><span className="ac-label">{lesson.published ? 'Published' : 'Draft'}</span><strong>{lesson.title}</strong><span>{lesson.videoUrl ? 'Video attached' : 'Needs a recording'}{lesson.resources.length ? ` · ${lesson.resources.length} ${lesson.resources.length === 1 ? 'file' : 'files'}` : ''}</span></button>)}</div> : <p className="ac-sidebar-empty">Your saved lessons will appear here.</p>}</aside>
      <div className="ac-studio-main">
        {error && <div className="ac-error" role="alert">{error}</div>}
        {message && <div className="ac-success" role="status"><Check size={18} />{message}</div>}
        <form onSubmit={save} className="ac-studio-panel"><div className="ac-panel-title"><span className="ac-label">01 / Lesson details</span>{current && <span className={`ac-status${current.published ? ' ac-status-published' : ''}`}>{current.published ? 'Published' : 'Draft'}</span>}</div><label className="ac-field">Lesson title<input id="lesson-title" name="lessonTitle" required minLength={3} maxLength={160} placeholder="For example: Build a reusable task card" value={title} onChange={event => setTitle(event.target.value)} /></label><div className="ac-fields-grid"><label className="ac-field">Course<select value={courseId} onChange={event => setCourseId(event.target.value)}>{courses.map((course, index) => <option key={course.title} value={String(index)}>{course.title}</option>)}</select></label><label className="ac-field">Duration in seconds<input type="number" min={0} max={86400} value={duration} onChange={event => setDuration(Math.max(0, Number(event.target.value)))} /><small>Filled from your video when available.</small></label></div><label className="ac-field">What will students build?<textarea name="description" rows={4} required minLength={10} maxLength={5000} placeholder="Explain the skill and the small project in this lesson." value={description} onChange={event => setDescription(event.target.value)} /></label><label className="ac-field">Chapters <span className="ac-optional">Optional</span><textarea name="chapters" rows={3} placeholder={'00:00 Start with a component\n00:30 Add a title prop'} value={chapters} onChange={event => setChapters(event.target.value)} /><small>One chapter per line: mm:ss followed by a short title.</small></label><div className="ac-studio-actions"><button className="ac-button ac-button-primary" type="submit" disabled={saving || !!uploading}>{saving ? <LoaderCircle className="ac-spin" size={18} /> : <Save size={18} />}{saving ? 'Saving…' : 'Save lesson draft'}</button>{current && <span className="ac-label">Saved to the academy database</span>}</div></form>

        <section className="ac-studio-panel" aria-labelledby="studio-files-heading"><div className="ac-panel-title"><span className="ac-label">02 / Recording and resources</span><h2 id="studio-files-heading">Give the lesson its working files.</h2></div>{!current && <p className="ac-upload-help">Save a draft above to attach your recording and resources.</p>}<div className="ac-upload-grid"><label className={`ac-upload-field${!current || uploading ? ' ac-upload-disabled' : ''}`}><span className="ac-upload-icon"><Film size={27} /></span><strong>{current?.videoUrl ? 'Replace lesson video' : 'Upload lesson video'}</strong><span>MP4 or WebM · Up to 250 MB</span><input type="file" accept="video/mp4,video/webm,.mp4,.webm" aria-label="Upload lesson video" disabled={!current || !!uploading || saving} onChange={event => upload(event, 'video')} /><span className="ac-upload-action"><UploadCloud size={17} />Choose a video</span></label><label className={`ac-upload-field${!current || uploading ? ' ac-upload-disabled' : ''}`}><span className="ac-upload-icon"><FileText size={27} /></span><strong>Add a lesson resource</strong><span>PDF or ZIP · Up to 25 MB</span><input type="file" accept="application/pdf,application/zip,.pdf,.zip" aria-label="Upload lesson document" disabled={!current || !!uploading || saving} onChange={event => upload(event, 'resource')} /><span className="ac-upload-action"><UploadCloud size={17} />Choose a document</span></label></div>
          {uploading && <div className="ac-upload-progress" role="status"><div><span>Uploading {uploading === 'video' ? 'video' : 'resource'}…</span><strong>{uploadProgress}%</strong></div><span role="progressbar" aria-label="File upload progress" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}><i style={{ transform: `scaleX(${uploadProgress / 100})` }} /></span><button className="ac-text-button" type="button" onClick={() => activeRequest.current?.abort()}>Cancel upload</button></div>}
          {current?.videoUrl && <div className="ac-attached-file"><span><Video size={20} /><strong>Lesson video attached</strong></span><span>{duration > 0 ? formatTime(duration) : 'Add a duration above'}</span></div>}{current?.resources.map(resource => <a className="ac-attached-file" key={resource.id} href={resource.url} download><span><FileText size={20} /><strong>{resource.name}</strong></span><span>{formatSize(resource.size)}<Download size={17} /></span></a>)}
        </section>

        <section className="ac-studio-panel ac-publish-panel" aria-labelledby="studio-publish-title"><div><span className="ac-label">03 / Review and publish</span><h2 id="studio-publish-title">Ready for a student?</h2><p>Publishing makes the lesson available in the learning library.</p></div><div className="ac-studio-actions"><button className="ac-button ac-button-outline" disabled={!current?.videoUrl || !!uploading || saving} onClick={() => setPreview(value => !value)}>{preview ? 'Close student preview' : 'Preview lesson'}</button><button className="ac-button ac-button-primary" disabled={!current?.videoUrl || !!uploading || saving} onClick={togglePublished}>{current?.published ? 'Unpublish lesson' : 'Publish lesson'}<ArrowRight size={17} /></button></div></section>
        {preview && current?.videoUrl && <section className="ac-studio-preview" aria-label="Student lesson preview"><LessonWorkspace key={`${current.id}-${current.updatedAt}`} lesson={current} /></section>}
      </div>
    </div>
  </main></div>;
}

function formatTime(value: number) { const seconds = Math.floor(value); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function formatSize(value: number) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function videoDuration(file: File): Promise<number> {
  return new Promise(resolve => {
    const video = document.createElement('video'); const url = URL.createObjectURL(file); let settled = false;
    const finish = (value: number) => { if (settled) return; settled = true; clearTimeout(timer); URL.revokeObjectURL(url); video.removeAttribute('src'); video.load(); resolve(value); };
    const timer = setTimeout(() => finish(0), 6000);
    video.preload = 'metadata'; video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? Math.round(video.duration) : 0); video.onerror = () => finish(0); video.src = url;
  });
}
