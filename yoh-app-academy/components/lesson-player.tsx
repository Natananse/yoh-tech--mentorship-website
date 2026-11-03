'use client';

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMotionPreference } from '../lib/use-motion-preference';
import { ResourceDownload } from './resource-download';
import { LessonAccessGate } from './student-enrollment';
import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Code2, FileText, Maximize2, MessageCircle, Pause, Play, Send, Smartphone, Volume2, X } from 'lucide-react';
import type { Lesson, LessonChapter, LessonNote, LessonQuestion, Progress, User } from '../lib/platform-types';

const sampleChapters: LessonChapter[] = [
  { title: 'Start with a component', time: 0, screen: 'start', code: "import { View, Text } from 'react-native';\n\nexport function TaskCard() {\n  return <View />;\n}" },
  { title: 'Give it a title prop', time: 8, screen: 'title', code: "export function TaskCard({ title }) {\n  return (\n    <View>\n      <Text>{title}</Text>\n    </View>\n  );\n}" },
  { title: 'Group and style the content', time: 16, screen: 'style', code: "const styles = StyleSheet.create({\n  card: {\n    padding: 20,\n    borderRadius: 16,\n    backgroundColor: '#FFE45C',\n  },\n});" },
  { title: 'Render the title', time: 24, screen: 'render', code: "<View style={styles.card}>\n  <Text style={styles.title}>\n    {title}\n  </Text>\n</View>" },
  { title: 'Reuse your task card', time: 32, screen: 'reuse', code: "<TaskCard title=\"Sketch a screen\" />\n\n<TaskCard title=\"Build a card\" />\n\n// One component. Different props." },
  { title: 'Add a third task', time: 40, screen: 'third', code: "<TaskCard title=\"Sketch a screen\" />\n<TaskCard title=\"Build a card\" />\n<TaskCard title=\"Test on my phone\" />" },
];
const sampleCaptions = [
  'Import View and Text from React Native. A component is a function that returns UI.',
  'TaskCard receives a title prop. Reuse the same component with different text.',
  'View groups the content. Add padding and a background to make a readable card.',
  'Text renders the title. Braces insert a JavaScript value into the JSX.',
  'Render TaskCard twice with different titles. One component, two tasks.',
  'Add a third TaskCard. Change its title, then adjust the padding and background.',
];
const sampleLesson: Lesson = {
  id: 'sample-task-card', title: 'Build a reusable task card',
  description: 'Write one component, pass a title prop, and reuse it in a small task app. This interactive sample is a placeholder for your recorded lessons.',
  courseId: '0', mentorId: 'sample', mentorName: 'Sample teaching preview',
  videoUrl: '/media/task-card-lesson.mp4', duration: 48, published: false,
  resources: [], chapters: sampleChapters, createdAt: '', updatedAt: '',
};

export type LessonWorkspaceProps = {
  compact?: boolean; capture?: boolean; hero?: boolean; lesson?: Lesson; sampleOnly?: boolean;
  onAuthRequired?: () => void; onProgress?: (progress: Progress) => void;
};

function timestamp(seconds: number) {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

const LivePhone = memo(function LivePhone({ chapter, index }: { chapter: LessonChapter; index: number }) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  useEffect(() => setChecked(new Set()), [index]);
  const count = index < 1 ? 0 : index < 4 ? 1 : index === 4 ? 2 : 3;
  const checkedCount = Array.from(checked).filter(taskIndex => taskIndex < count).length;
  function toggleTask(taskIndex: number) {
    setChecked(previous => { const next = new Set(previous); if (next.has(taskIndex)) next.delete(taskIndex); else next.add(taskIndex); return next; });
  }
  return <div className="lp-phone" aria-label={`Live app preview: ${chapter.title}`}>
    <div className="lp-phone-status"><span>9:41</span><Smartphone size={13} aria-hidden="true" /></div>
    <div className="lp-phone-app">
      <div className="lp-phone-app-top"><span className="lp-phone-logo"><Check size={17} /></span><span>Daylight</span><span className="lp-phone-person">You</span></div>
      <p className="lp-phone-date">Your first app</p><h4>A little focus.<br />A good day.</h4>
      <div className="lp-phone-summary"><strong>{count ? `${checkedCount} / ${count}` : 'Let’s start'}</strong><span>{count ? 'tasks completed' : 'Your next idea goes here'}</span></div>
      {count === 0 ? <div className="lp-phone-start"><Code2 size={24} /><b>A component is a start.</b><p>Next, give it something to say.</p></div> : index === 3 ? <div className="lp-phone-detail"><span>Today’s priority</span><strong>Sketch a screen</strong><p>Draw the home screen before you code.</p><button onClick={() => toggleTask(0)} aria-pressed={checked.has(0)}>{checked.has(0) ? <Check size={13} /> : <Play size={13} />}{checked.has(0) ? 'Task complete' : 'Finish this task'}</button></div> : <div className="lp-phone-tasks">{[index === 1 ? 'My first task' : 'Sketch a screen', 'Build a card', 'Test on my phone'].slice(0, count).map((task, taskIndex) => <button className={`lp-phone-task ${index > 1 ? 'lp-phone-task-styled' : ''} ${checked.has(taskIndex) ? 'is-checked' : ''}`} key={task} onClick={() => toggleTask(taskIndex)} aria-pressed={checked.has(taskIndex)}><span>{checked.has(taskIndex) ? <Check size={12} /> : taskIndex + 1}</span><span>{task}</span></button>)}</div>}
      <div className="lp-phone-chapter"><span>Live chapter preview</span><b>{chapter.title}</b></div>
    </div>
    <div className="lp-phone-home" />
  </div>;
});

function TypedCode({ chapter, characters }: { chapter: LessonChapter; characters?: number }) {
  const code = chapter.code || `// ${chapter.title}\n\n// Follow the lesson, then try it in your app.`;
  const visible = characters === undefined ? code : code.slice(0, characters);
  return <div className="lp-code-window"><div className="lp-code-top"><span><Code2 size={14} /> TaskCard.tsx</span><span>React Native</span></div><div className="lp-code-lines" aria-label="Live component code">{visible.split('\n').map((line, index) => <div key={index}><span>{String(index + 1).padStart(2, '0')}</span><code>{line || ' '}</code></div>)}</div><div className="lp-code-bottom"><span className="lp-code-dot" /> Changes appear on your phone <ArrowRight size={13} /></div></div>;
}

async function lessonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {cache: 'no-store', ...options, headers: options?.body ? {'Content-Type': 'application/json', ...options.headers} : options?.headers});
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'The request could not be completed. Try again.');
  return data as T;
}

type DiscussionProps = { lesson: Lesson; user: User | null; isSample: boolean; position: number; onSeek: (position: number) => void; onAuthRequired?: () => void };

function DiscussionGate({ isSample, title, onAuthRequired }: { isSample: boolean; title: string; onAuthRequired?: () => void }) {
  return <div className="lp-discussion-gate"><FileText size={25} /><div><h4>{isSample ? (title === 'Notes' ? 'Notes belong to recorded lessons.' : 'Q&A is for recorded lessons.') : (title === 'Notes' ? 'Sign in to keep notes.' : 'Sign in to join the Q&A.')}</h4><p>{isSample ? 'This is an interactive sample. Open a published recording to save notes or ask its mentor a question.' : title === 'Notes' ? 'Save private notes at a useful timestamp. They stay with your account.' : 'Ask a question about this lesson and read replies from the teaching team.'}</p>{!isSample && onAuthRequired && <button className="lp-discussion-primary" onClick={onAuthRequired}>Sign in <ArrowRight size={16} /></button>}</div></div>;
}

function LessonNotes({ lesson, user, isSample, position, onSeek, onAuthRequired }: DiscussionProps) {
  const fieldId = useId();
  const active = useRef(true);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(Boolean(user && !isSample));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    active.current = true;
    let current = true;
    if (user && !isSample) lessonRequest<{notes: LessonNote[]}>(`/api/lessons/${lesson.id}/notes`).then(data => { if (current) setNotes(data.notes || []); }).catch(error => { if (current) setError(error.message); }).finally(() => { if (current) setLoading(false); });
    else setLoading(false);
    return () => { current = false; active.current = false; };
  }, [lesson.id, user?.id, isSample]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || isSample || !body.trim() || loading || saving) return;
    const savedPosition = position;
    setSaving(true); setError(''); setStatus('');
    try {
      const data = await lessonRequest<{note: LessonNote}>(`/api/lessons/${lesson.id}/notes`, {method: 'POST', body: JSON.stringify({position: savedPosition, body: body.trim()})});
      if (!active.current) return;
      setNotes(previous => [data.note, ...previous]); setBody(''); setStatus(`Note saved at ${timestamp(data.note.position)}.`);
    } catch (error) { if (active.current) setError((error as Error).message); }
    finally { if (active.current) setSaving(false); }
  }
  if (!user || isSample) return <DiscussionGate isSample={isSample} title="Notes" onAuthRequired={onAuthRequired} />;
  return <div className="lp-notebook"><div className="lp-discussion-heading"><div><h4>Your notes</h4><p>Private to your account. Each note keeps its place in the lesson.</p></div><span className="lp-label">At {timestamp(position)}</span></div>
    <form className="lp-discussion-form" onSubmit={submit} aria-busy={loading || saving}>
      <label htmlFor={fieldId}>What do you want to remember?</label>
      <textarea id={fieldId} value={body} onChange={event => setBody(event.target.value)} rows={3} maxLength={4000} placeholder="Write the useful bit in your own words." required />
      <div className="lp-discussion-form-bottom"><span className="lp-label">{body.length} / 4000</span><button className="lp-discussion-primary" type="submit" disabled={loading || saving || !body.trim()}><FileText size={17} />{loading ? 'Loading notes…' : saving ? 'Saving…' : 'Save note'}</button></div>
    </form>
    {error && <p className="lp-discussion-error" role="alert">{error}</p>}{status && <p className="lp-discussion-status" role="status">{status}</p>}
    {loading ? <div className="lp-discussion-loading" role="status">Loading your notes…</div> : notes.length ? <ol className="lp-note-list">{notes.map(note => <li key={note.id}><button className="lp-time-link" onClick={() => onSeek(note.position)} aria-label={`Seek to note at ${timestamp(note.position)}`}>{timestamp(note.position)}<Play size={12} /></button><p>{note.body}</p><span className="lp-label">{new Date(note.createdAt).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}</span></li>)}</ol> : <div className="lp-discussion-empty"><FileText size={22} /><p>No notes yet. Pause at a useful point and save your first one.</p></div>}
  </div>;
}

function LessonQuestions({ lesson, user, isSample, position, onSeek, onAuthRequired }: DiscussionProps) {
  const fieldId = useId();
  const active = useRef(true);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [body, setBody] = useState('');
  const [attachTime, setAttachTime] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(user && !isSample));
  const [posting, setPosting] = useState(false);
  const [answerSaving, setAnswerSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const canAnswer = user?.role === 'admin' || (user?.role === 'mentor' && user.id === lesson.mentorId);
  useEffect(() => {
    active.current = true;
    let current = true;
    if (user && !isSample) lessonRequest<{questions: LessonQuestion[]}>(`/api/lessons/${lesson.id}/questions`).then(data => { if (current) setQuestions(data.questions || []); }).catch(error => { if (current) setError(error.message); }).finally(() => { if (current) setLoading(false); });
    else setLoading(false);
    return () => { current = false; active.current = false; };
  }, [lesson.id, user?.id, isSample]);
  async function postQuestion(event: FormEvent) {
    event.preventDefault();
    if (!user || isSample || !body.trim() || loading || posting) return;
    setPosting(true); setError(''); setStatus('');
    try {
      const data = await lessonRequest<{question: LessonQuestion}>(`/api/lessons/${lesson.id}/questions`, {method: 'POST', body: JSON.stringify({position: attachTime ? position : null, body: body.trim()})});
      if (!active.current) return;
      setQuestions(previous => [data.question, ...previous]); setBody(''); setStatus('Your question has been posted.');
    } catch (error) { if (active.current) setError((error as Error).message); }
    finally { if (active.current) setPosting(false); }
  }
  async function postAnswer(event: FormEvent, question: LessonQuestion) {
    event.preventDefault();
    const answer = (answers[question.id] ?? question.answer ?? '').trim();
    if (!canAnswer || !answer || answerSaving) return;
    setAnswerSaving(question.id); setError(''); setStatus('');
    try {
      const data = await lessonRequest<{question: LessonQuestion}>(`/api/questions/${question.id}`, {method: 'PATCH', body: JSON.stringify({answer})});
      if (!active.current) return;
      setQuestions(previous => previous.map(item => item.id === data.question.id ? data.question : item));
      setAnswers(previous => { const next = {...previous}; delete next[question.id]; return next; });
      setStatus('Your answer has been saved.');
    } catch (error) { if (active.current) setError((error as Error).message); }
    finally { if (active.current) setAnswerSaving(null); }
  }
  if (!user || isSample) return <DiscussionGate isSample={isSample} title="Q&A" onAuthRequired={onAuthRequired} />;
  return <div className="lp-questions"><div className="lp-discussion-heading"><div><h4>Ask about the code</h4><p>Questions and teaching-team replies for this lesson.</p></div><MessageCircle size={22} /></div>
    <form className="lp-discussion-form" onSubmit={postQuestion} aria-busy={loading || posting}>
      <label htmlFor={fieldId}>Your question</label>
      <textarea id={fieldId} value={body} onChange={event => setBody(event.target.value)} rows={3} maxLength={4000} placeholder="What line or next step do you want help with?" required />
      <label className="lp-time-attach"><input type="checkbox" checked={attachTime} onChange={event => setAttachTime(event.target.checked)} />Include timestamp {timestamp(position)}</label>
      <div className="lp-discussion-form-bottom"><span className="lp-label">{body.length} / 4000</span><button className="lp-discussion-primary" type="submit" disabled={loading || posting || !body.trim()}><Send size={17} />{loading ? 'Loading questions…' : posting ? 'Posting…' : 'Post question'}</button></div>
    </form>
    {error && <p className="lp-discussion-error" role="alert">{error}</p>}{status && <p className="lp-discussion-status" role="status">{status}</p>}
    {loading ? <div className="lp-discussion-loading" role="status">Loading questions…</div> : questions.length ? <ol className="lp-question-list">{questions.map(question => <li key={question.id}>
      <div className="lp-question-meta"><strong>{question.authorName}</strong>{question.position !== null && <button className="lp-time-link" onClick={() => onSeek(question.position!)} aria-label={`Seek to question at ${timestamp(question.position)}`}>{timestamp(question.position)}<Play size={12} /></button>}<span className="lp-label">{new Date(question.createdAt).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}</span></div>
      <p className="lp-question-body">{question.body}</p>
      {question.answer ? <div className="lp-question-answer"><span className="lp-label">Reply from {question.answeredByName || 'the teaching team'}</span><p>{question.answer}</p></div> : <p className="lp-question-waiting">No reply yet.</p>}
      {canAnswer && <form className="lp-answer-form" onSubmit={event => postAnswer(event, question)}><label htmlFor={`${fieldId}-${question.id}`}>{question.answer ? 'Update your answer' : 'Answer this question'}</label><textarea id={`${fieldId}-${question.id}`} rows={3} maxLength={8000} value={answers[question.id] ?? question.answer ?? ''} onChange={event => setAnswers(previous => ({...previous, [question.id]: event.target.value}))} required /><button className="lp-discussion-primary" type="submit" disabled={Boolean(answerSaving) || !(answers[question.id] ?? question.answer ?? '').trim()}>{answerSaving === question.id ? 'Saving…' : question.answer ? 'Update answer' : 'Post answer'}<ArrowRight size={16} /></button></form>}
    </li>)}</ol> : <div className="lp-discussion-empty"><MessageCircle size={22} /><p>No questions yet. Ask about a line of code or your next step.</p></div>}
  </div>;
}

export function HeroLessonPreview(props: { lesson?: Lesson; onAuthRequired?: () => void; sampleOnly?: boolean }) {
  return <LessonWorkspace {...props} hero />;
}

function LockedLesson({ lesson, onAuthRequired, refresh, failure }: { lesson: Lesson; onAuthRequired?: () => void; refresh: () => void; failure?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' }).then(response => response.json()).then(data => { if (active) setUser(data.user || null); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <section className="lp-workspace lp-locked" aria-label="Locked lesson"><div className="lp-heading"><div><span className="lp-label">Uploaded lesson · approval required</span><h3>{lesson.title}</h3></div></div>{failure && <p className="lp-access-notice" role="status">This recording could not be loaded. Your access may have changed. Refresh access to check.</p>}{loading ? <p className="lp-access-notice" role="status">Checking your account…</p> : <LessonAccessGate user={user} onAuthRequired={onAuthRequired} />}<button className="lp-access-refresh" onClick={refresh}>Refresh lesson access</button></section>;
}

export function LessonWorkspace(props: LessonWorkspaceProps) {
  const [resolved, setResolved] = useState<{ input: Lesson | undefined; value: Lesson | undefined }>({ input: props.lesson, value: props.lesson });
  const [failure, setFailure] = useState(false);
  const handleAccessError = useCallback(() => { setFailure(true); window.dispatchEvent(new CustomEvent('academy-enrollment-updated')); }, []);
  const lesson = props.sampleOnly ? undefined : resolved.input === props.lesson ? resolved.value : props.lesson;
  const accessAllowed = useRef(true);
  accessAllowed.current = !(lesson && (lesson.canWatch === false || failure));
  const refresh = useCallback(async (retry = false) => {
    if (!lesson || props.sampleOnly) return;
    try {
      const response = await fetch('/api/lessons', { cache: 'no-store' });
      if (!response.ok) return;
      const result = await response.json();
      const updated = (result.lessons || []).find((item: Lesson) => item.id === lesson.id);
      setResolved({ input: props.lesson, value: updated || { ...lesson, canWatch: false, videoUrl: null, resources: [], chapters: [] } });
      if (retry || !updated || updated.canWatch === false) setFailure(false);
    } catch { /* Keep the current gate while access cannot be checked. */ }
  }, [lesson?.id, props.lesson, props.sampleOnly]);
  useEffect(() => {
    const changed = () => { refresh(); };
    window.addEventListener('academy-enrollment-updated', changed);
    window.addEventListener('academy-auth-updated', changed);
    return () => { window.removeEventListener('academy-enrollment-updated', changed); window.removeEventListener('academy-auth-updated', changed); };
  }, [refresh]);
  if (lesson && (lesson.canWatch === false || failure)) return <LockedLesson lesson={lesson} onAuthRequired={props.onAuthRequired} refresh={() => { refresh(true); }} failure={failure} />;
  return <PlayableLessonWorkspace {...props} lesson={lesson} key={`${lesson?.id || 'sample'}:${props.sampleOnly ? 'demo' : 'lesson'}`} onAccessError={handleAccessError} accessAllowed={accessAllowed} />;
}

function PlayableLessonWorkspace({ compact = false, capture = false, hero = false, lesson, sampleOnly = false, onAuthRequired, onProgress, onAccessError, accessAllowed }: LessonWorkspaceProps & { onAccessError?: () => void; accessAllowed: { current: boolean } }) {
  const instance = useId();
  const video = useRef<HTMLVideoElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const completeRef = useRef(false);
  const savedAt = useRef(0);
  const pendingSeek = useRef<number | null>(null);
  const writeQueue = useRef<Promise<boolean>>(Promise.resolve(true));
  const previewElapsed = useRef(0);
  const progressReady = useRef(false);
  const restoringRef = useRef(false);
  const dirty = useRef(false);
  const changeVersion = useRef(0);
  const progressScope = useRef('');
  const reduced = useMotionPreference();
  const [source, setSource] = useState<Lesson>(lesson || sampleLesson);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!capture && !lesson);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(lesson?.duration || 48);
  const [rate, setRate] = useState('1');
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Overview');
  const [autoPreview, setAutoPreview] = useState(0);
  const [captions, setCaptions] = useState<{start: number; end: number; text: string}[]>([]);
  const [nativeCaption, setNativeCaption] = useState('');
  const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([]);
  const [muted, setMuted] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [mediaNearView, setMediaNearView] = useState(hero);
  const isSample = source.id === sampleLesson.id;
  const nextScope = `${user?.id || 'guest'}:${source.id}`;
  if (progressScope.current !== nextScope) {
    progressScope.current = nextScope; progressReady.current = false;
    dirty.current = false; pendingSeek.current = null;
  }
  const chapters = useMemo(() => source.chapters?.length ? [...source.chapters].sort((a, b) => a.time - b.time) : [{title: source.title, time: 0}], [source]);
  const actualChapter = Math.max(0, chapters.findLastIndex(chapter => chapter.time <= position));
  const hasProvidedCode = chapters.some(chapter => Boolean(chapter.code?.trim()));
  const showHeroPreview = hero && !hasStarted && position < 0.1;
  const previewChapters = showHeroPreview && !hasProvidedCode ? sampleChapters : chapters;
  const previewIndex = showHeroPreview && !playing && !reduced ? Math.floor(autoPreview / 3500) % previewChapters.length : actualChapter;
  const activeChapter = previewChapters[Math.min(previewIndex, previewChapters.length - 1)];
  const firstCodeLineLength = (activeChapter.code || '').split('\n')[0].length + 1;
  const codeCharacters = showHeroPreview && !playing && !reduced ? Math.max(firstCodeLineLength, Math.ceil(((autoPreview % 3500) / 2300) * (activeChapter.code?.length || 100))) : undefined;
  const caption = nativeCaption || captions.find(cue => position >= cue.start && position < cue.end)?.text || (isSample ? sampleCaptions[actualChapter] : '');

  useEffect(() => {
    if (sampleOnly) { setSource(sampleLesson); setRelatedLessons([]); setLoading(false); return; }
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/lessons', {cache: 'no-store'});
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        const lessons = (data.lessons || []).filter((item: Lesson) => item.published && item.videoUrl && item.canWatch !== false);
        setRelatedLessons(lessons);
        if (!sampleOnly && !lesson && !hero && lessons.length) setSource(lessons[0]);
      } catch {} finally { if (active) setLoading(false); }
    }
    if (lesson) { setSource(lesson); setLoading(false); }
    if (capture) setLoading(false);
    load();
    return () => { active = false; };
  }, [lesson, hero, capture, sampleOnly]);

  useEffect(() => {
    let active = true;
    async function refreshUser() {
      try { const response = await fetch('/api/auth/me', {cache: 'no-store'}); const data = await response.json(); if (active) setUser(data.user || null); } catch { if (active) setUser(null); }
    }
    refreshUser();
    window.addEventListener('academy-auth-updated', refreshUser);
    return () => { active = false; window.removeEventListener('academy-auth-updated', refreshUser); };
  }, []);

  useEffect(() => {
    progressReady.current = false; dirty.current = false; changeVersion.current = 0; pendingSeek.current = null;
    restoringRef.current = Boolean(!isSample && user); setRestoring(restoringRef.current);
    video.current?.pause();
    positionRef.current = 0; completeRef.current = false; savedAt.current = 0;
    previewElapsed.current = 0;
    setPosition(0); setComplete(false); setSaving(false); setDuration(source.duration || (isSample ? 48 : 0)); setPlaying(false); setHasStarted(false); setAutoPreview(0); setNotice(''); setNativeCaption('');
    let active = true;
    function restore(progress: {position?: number; completed?: boolean}) {
      if (!active) return;
      const value = Math.max(0, Number(progress.position) || 0);
      pendingSeek.current = value;
      if (video.current?.readyState && Number.isFinite(video.current.duration)) { video.current.currentTime = Math.min(value, Math.max(0, video.current.duration - 0.25)); pendingSeek.current = null; }
      positionRef.current = value; completeRef.current = Boolean(progress.completed); setPosition(value); setComplete(Boolean(progress.completed));
    }
    if (isSample) {
      try { const raw = localStorage.getItem('yoh-preview-progress-v3'); if (raw) restore(JSON.parse(raw)); } catch {}
      progressReady.current = true;
    } else if (user && source.canWatch !== false) {
      fetch(`/api/progress/${source.id}`, {cache: 'no-store'}).then(response => { if (response.status === 403) onAccessError?.(); return response.ok ? response.json() : null; }).then(data => {
        if (!active) return;
        if (data?.progress) { restore(data.progress); progressReady.current = true; }
        else setNotice('Your saved position could not be loaded. Reload before saving new progress.');
      }).catch(() => { if (active) setNotice('Your saved position could not be loaded. Check your connection and reload.'); }).finally(() => {
        if (active) { restoringRef.current = false; setRestoring(false); }
      });
    } else {
      progressReady.current = source.canWatch !== false;
    }
    return () => { active = false; };
  }, [source.id, source.canWatch, user?.id, isSample, onAccessError]);

  useEffect(() => setTab('Overview'), [source.id]);

  useEffect(() => {
    if (!showHeroPreview || playing || reduced) return;
    const element = viewport.current;
    if (!element) return;
    let visible = false;
    let timer: number | undefined;
    function synchronize() {
      const animate = visible && document.visibilityState !== 'hidden';
      element.dataset.previewAnimating = String(animate);
      if (!animate && timer !== undefined) { window.clearInterval(timer); timer = undefined; }
      if (animate && timer === undefined) {
        const start = performance.now() - previewElapsed.current;
        timer = window.setInterval(() => { previewElapsed.current = performance.now() - start; setAutoPreview(previewElapsed.current); }, 65);
      }
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; synchronize(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', synchronize);
    return () => { if (timer !== undefined) window.clearInterval(timer); observer.disconnect(); document.removeEventListener('visibilitychange', synchronize); element.dataset.previewAnimating = 'false'; };
  }, [showHeroPreview, playing, reduced, source.id, user?.id]);

  useEffect(() => {
    if (hero || loading || mediaNearView) return;
    const element = viewport.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setMediaNearView(true); observer.disconnect(); } }, {rootMargin: '400px 0px'});
    observer.observe(element);
    return () => observer.disconnect();
  }, [hero, loading, mediaNearView, source.id]);

  useEffect(() => {
    if (!isSample) { setCaptions([]); return; }
    let active = true;
    fetch('/media/lesson-captions.vtt').then(response => response.text()).then(text => {
      if (!active) return;
      const cues = text.split(/\r?\n\r?\n/).map(block => {
        const lines = block.split(/\r?\n/); const index = lines.findIndex(line => line.includes('-->')); if (index < 0) return null;
        const [start, end] = lines[index].split(' --> ').map(value => value.trim().split(':').reduce((sum, part) => sum * 60 + Number(part), 0));
        return {start, end, text: lines.slice(index + 1).join(' ')};
      }).filter(Boolean);
      setCaptions(cues);
    }).catch(() => {});
    return () => { active = false; };
  }, [isSample]);

  const persist = useCallback((nextPosition: number, nextComplete?: boolean) => {
    if (!accessAllowed.current || source.canWatch === false) return Promise.resolve(false);
    if (!progressReady.current) return Promise.resolve(false);
    if (!dirty.current) return Promise.resolve(true);
    savedAt.current = Date.now();
    if (isSample) {
      try { localStorage.setItem('yoh-preview-progress-v3', JSON.stringify({position: nextPosition, completed: nextComplete ?? completeRef.current})); }
      catch { setNotice('Sample progress could not be saved in this browser.'); return Promise.resolve(false); }
      dirty.current = false;
      return Promise.resolve(true);
    }
    if (!user) return Promise.resolve(false);
    const lessonId = source.id;
    const scope = `${user.id}:${lessonId}`;
    const version = changeVersion.current;
    const payload = {position: Math.max(0, nextPosition), duration: Math.max(duration, nextPosition), ...(nextComplete === undefined ? {} : {completed: nextComplete})};
    writeQueue.current = writeQueue.current.catch(() => false).then(async () => {
      if (progressScope.current !== scope || !accessAllowed.current) return false;
      try {
        const response = await fetch(`/api/progress/${lessonId}`, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload), keepalive: true});
        if (!response.ok) { if (response.status === 403) { progressReady.current = false; dirty.current = false; video.current?.pause(); onAccessError?.(); } setNotice(response.status === 401 ? 'Sign in again to save your progress.' : 'Progress could not be saved. Refresh your lesson access.'); return false; }
        const data = await response.json();
        if (progressScope.current !== scope) return false;
        if (changeVersion.current === version) {
          dirty.current = false;
          if (data.progress) { completeRef.current = Boolean(data.progress.completed); setComplete(completeRef.current); }
        }
        if (data.progress) onProgress?.(data.progress);
        window.dispatchEvent(new CustomEvent('academy-progress-updated', {detail: {source: instance, userId: user.id, lessonId, progress: data.progress}}));
        return true;
      } catch { setNotice('Progress could not be saved. Check your connection.'); return false; }
    });
    return writeQueue.current;
  }, [duration, instance, isSample, onProgress, onAccessError, source.id, source.canWatch, user, accessAllowed]);

  useEffect(() => {
    function synchronizeProgress(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (!detail?.progress || detail.source === instance || detail.userId !== user?.id || detail.lessonId !== source.id || dirty.current || !video.current?.paused || restoringRef.current) return;
      const next = detail.progress as Progress;
      positionRef.current = next.position; completeRef.current = next.completed;
      setPosition(next.position); setComplete(next.completed);
      if (video.current.readyState && Number.isFinite(video.current.duration)) video.current.currentTime = Math.min(next.position, Math.max(0, video.current.duration - 0.25));
      else pendingSeek.current = next.position;
    }
    window.addEventListener('academy-progress-updated', synchronizeProgress);
    return () => window.removeEventListener('academy-progress-updated', synchronizeProgress);
  }, [instance, source.id, user?.id]);

  useEffect(() => {
    function leave() { persist(positionRef.current); }
    function otherPlayer(event: Event) { if ((event as CustomEvent).detail !== instance) video.current?.pause(); }
    window.addEventListener('pagehide', leave); window.addEventListener('academy-player-play', otherPlayer);
    return () => { window.removeEventListener('pagehide', leave); window.removeEventListener('academy-player-play', otherPlayer); };
  }, [persist, instance]);

  async function togglePlayback() {
    const element = video.current; if (!element) return;
    if (!element.paused) { element.pause(); return; }
    if (restoringRef.current) return;
    dirty.current = true; changeVersion.current++;
    try { await element.play(); } catch { setNotice('The video could not play. Check its upload and try again.'); }
  }
  function seek(value: number) {
    if (restoringRef.current) return;
    const next = Math.max(0, Math.min(duration || 0, value));
    if (video.current?.readyState) video.current.currentTime = next;
    else { pendingSeek.current = next; setMediaNearView(true); }
    dirty.current = true; changeVersion.current++;
    positionRef.current = next; setPosition(next); persist(next);
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await viewport.current?.requestFullscreen(); } catch { setNotice('Fullscreen is not available in this browser.'); }
  }
  function shortcuts(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('input,textarea,select,[contenteditable=true]')) return;
    const key = event.key.toLowerCase();
    if (event.code === 'Space' && !target.closest('button,a')) { event.preventDefault(); togglePlayback(); }
    else if (key === 'j') { event.preventDefault(); seek(positionRef.current - 10); }
    else if (key === 'l') { event.preventDefault(); seek(positionRef.current + 10); }
    else if (key === 'f') { event.preventDefault(); fullscreen(); }
  }
  async function markComplete() {
    if (restoringRef.current) return;
    if (!isSample && !user) { setNotice('Sign in to save your progress to your account.'); onAuthRequired?.(); return; }
    const previous = completeRef.current;
    const scope = progressScope.current;
    const next = !previous;
    dirty.current = true; changeVersion.current++;
    completeRef.current = next; setComplete(next); setSaving(true);
    const saved = await persist(positionRef.current, next);
    if (progressScope.current !== scope) return;
    if (!saved) { completeRef.current = previous; setComplete(previous); }
    setSaving(false);
  }
  const progress = complete ? 100 : duration ? Math.min(100, position / duration * 100) : 0;

  const media = <div className={`lp-media ${isSample ? 'lp-media-sample' : ''}`}>
    <video ref={video} key={source.id} src={source.videoUrl || undefined} playsInline preload={hero ? (isSample ? 'none' : 'metadata') : mediaNearView ? 'metadata' : 'none'} muted={muted} aria-label={`${isSample ? 'Interactive sample' : 'Lesson'}: ${source.title}`} onLoadedMetadata={event => {
      const element = event.currentTarget; const realDuration = Number.isFinite(element.duration) ? element.duration : source.duration;
      setDuration(realDuration || 0); element.playbackRate = Number(rate);
      if (pendingSeek.current !== null) { element.currentTime = Math.min(pendingSeek.current, Math.max(0, realDuration - 0.25)); pendingSeek.current = null; }
      for (let index = 0; index < element.textTracks.length; index++) {
        const track = element.textTracks[index];
        track.mode = 'hidden';
        track.oncuechange = () => setNativeCaption(Array.from(track.activeCues || []).map(cue => 'text' in cue ? String(cue.text) : '').join(' '));
      }
    }} onDurationChange={event => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration); }} onPlay={() => { dirty.current = true; changeVersion.current++; setHasStarted(true); setPlaying(true); setNotice(''); window.dispatchEvent(new CustomEvent('academy-player-play', {detail: instance})); }} onPause={() => { setPlaying(false); persist(positionRef.current); }} onTimeUpdate={event => { const value = event.currentTarget.currentTime; positionRef.current = value; setPosition(value); if (!event.currentTarget.paused) { dirty.current = true; changeVersion.current++; if (Date.now() - savedAt.current > 4000) persist(value); } }} onEnded={() => { setPlaying(false); persist(positionRef.current); }} onError={() => { setNotice('This recording is unavailable. Refresh your lesson access.'); if (!isSample) onAccessError?.(); }} />
    {(isSample || showHeroPreview) && <div className="lp-interactive-screen"><TypedCode chapter={activeChapter} characters={codeCharacters} /></div>}
    {!isSample && !source.videoUrl && <div className="lp-media-missing"><Play size={30} /><p>The mentor has not uploaded a recording yet.</p></div>}
  </div>;

  const controls = <div className="lp-controls">
    <div className="lp-scrubber"><span className="lp-scrub-track" /><span className="lp-scrub-fill" style={{transform: `scaleX(${duration ? position / duration : 0})`}} />{chapters.slice(1).map(chapter => <span className="lp-chapter-marker" style={{left: `${duration ? chapter.time / duration * 100 : 0}%`}} key={`${chapter.time}-${chapter.title}`} />)}<input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(position, duration || 1)} onChange={event => seek(Number(event.target.value))} aria-label="Seek lesson" aria-valuetext={`${timestamp(position)} of ${timestamp(duration)}`} /></div>
    <div className="lp-control-row"><button onClick={togglePlayback} disabled={restoring} className="lp-play-button" aria-label={hero && !isSample ? (playing ? 'Pause recorded lesson' : 'Play recorded lesson') : (playing ? 'Pause lesson' : 'Play lesson')}>{playing ? <Pause size={18} /> : <Play size={18} />}<span>{playing ? 'Pause' : 'Play'}</span></button><span className="lp-timestamp">{timestamp(position)} <span>/ {timestamp(duration)}</span></span><div className="lp-control-right"><button className="lp-icon-button" onClick={() => setMuted(value => !value)} aria-label={muted ? 'Unmute lesson' : 'Mute lesson'} aria-pressed={muted}><Volume2 size={17} />{muted && <span className="lp-muted-line" />}</button><label className="lp-speed"><span className="lp-sr-only">Playback speed</span><select aria-label="Playback speed" value={rate} onChange={event => { setRate(event.target.value); if (video.current) video.current.playbackRate = Number(event.target.value); }}>{['0.75','1','1.25','1.5','2'].map(value => <option key={value} value={value}>{value}×</option>)}</select></label><button className="lp-icon-button" aria-label="Fullscreen lesson" onClick={fullscreen}><Maximize2 size={18} /></button></div></div>
  </div>;

  if (hero) return <div className="lp-hero" onKeyDown={shortcuts} tabIndex={0} role="region" aria-label="Try the lesson player">
    <div className="lp-hero-grid"><div className="lp-hero-video" ref={viewport}><div className="lp-mini-heading"><span><Play size={13} /> {showHeroPreview && !isSample ? 'App preview' : isSample ? 'Interactive sample' : 'Recorded lesson'}</span><span>{timestamp(duration)}</span></div>{media}{controls}</div><div className="lp-hero-phone"><LivePhone chapter={activeChapter} index={previewIndex} /></div></div>
    <div className="lp-hero-caption"><CheckCircle2 size={15} /><span>{isSample ? 'One component. A working screen.' : showHeroPreview && !hasProvidedCode ? 'Example app code · Play the recorded lesson' : source.title}</span><span className="lp-placeholder-tag">{isSample ? 'Sample lesson' : showHeroPreview && !hasProvidedCode ? 'Example component' : 'Recorded lesson'}</span></div>
    {notice && <p className="lp-notice" role="status">{notice}</p>}
  </div>;

  return <section className={`lp-workspace ${compact ? 'lp-compact' : ''}`} aria-label="Lesson classroom" onKeyDown={shortcuts} tabIndex={0}>
    <div className="lp-heading"><div><span className="lp-label">{isSample ? 'Interactive sample · recorded lessons coming' : `Lesson by ${source.mentorName}`}</span><h3>{source.title}</h3></div><button className={`lp-complete-button ${complete ? 'is-complete' : ''}`} onClick={markComplete} disabled={saving || restoring} aria-pressed={complete}>{complete ? <CheckCircle2 size={18} /> : <Check size={18} />} {saving ? 'Saving…' : complete ? 'Completed' : 'Mark complete'}</button></div>
    {loading ? <div className="lp-skeleton" role="status" aria-label="Loading lesson"><span /><div><i /><i /><i /></div></div> : <div className="lp-grid">
      <div className="lp-video-column"><div className="lp-video-viewport" ref={viewport}>{media}{controls}<div className="lp-caption-bar" aria-label="Lesson captions"><span className="lp-label">{isSample ? 'Sample caption' : 'Lesson'}</span><p>{caption || activeChapter.title}</p></div></div>
        <div className="lp-tabs" role="tablist" aria-label="Lesson details">{['Overview', 'Resources', 'Notes', 'Q&A'].map(value => <button key={value} id={`${instance}-tab-${value}`} role="tab" tabIndex={tab === value ? 0 : -1} aria-selected={tab === value} aria-controls={`${instance}-panel`} onClick={() => setTab(value)} onKeyDown={event => {
          const values = ['Overview', 'Resources', 'Notes', 'Q&A'];
          if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const index = values.indexOf(value);
          const next = values[event.key === 'Home' ? 0 : event.key === 'End' ? values.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : values.length - 1)) % values.length];
          setTab(next); document.getElementById(`${instance}-tab-${next}`)?.focus();
        }}>{value}{value === 'Resources' && <span>{source.resources.length}</span>}</button>)}<span className="lp-tabs-status">{isSample ? 'Sample preview' : restoring ? 'Restoring your place…' : user ? 'Saved to your account' : 'Sign in to save progress'}</span></div>
        <div className="lp-tab-panel" role="tabpanel" id={`${instance}-panel`} aria-labelledby={`${instance}-tab-${tab}`}>
          {tab === 'Overview' && <><p>{source.description}</p><div className="lp-practice"><Code2 size={20} /><div><strong>{isSample ? 'Your next five minutes' : 'Put it into practice'}</strong><p>{isSample ? 'Add a third task card. Change its title, then tap a task in the live phone preview.' : 'Pause at each chapter. Try the code in your own project, then return to the next step.'}</p></div></div><p className="lp-shortcuts">Keyboard: <kbd>Space</kbd> play/pause <kbd>J</kbd>/<kbd>L</kbd> back/forward 10s <kbd>F</kbd> fullscreen</p></>}
          {tab === 'Resources' && (source.resources.length ? <ul className="lp-resource-list">{source.resources.map(resource => <li key={resource.id}><FileText size={20} /><span><strong>{resource.name}</strong><small>{resource.mime.includes('pdf') ? 'PDF' : 'ZIP'} · {resource.size < 1048576 ? `${Math.max(1, Math.ceil(resource.size / 1024))} KB` : `${(resource.size / 1048576).toFixed(1)} MB`}</small></span><ResourceDownload url={resource.url} name={resource.name} /></li>)}</ul> : <div className="lp-no-resources"><FileText size={24} /><div><strong>{isSample ? 'Sample resources are not uploaded yet.' : 'No resources for this lesson yet.'}</strong><p>{isSample ? 'Your mentor’s PDF or starter ZIP will appear here when it is supplied.' : 'The mentor can attach a PDF or ZIP in the lesson studio.'}</p></div></div>)}
          {tab === 'Notes' && <LessonNotes key={`${source.id}:${user?.id || 'guest'}`} lesson={source} user={user} isSample={isSample} position={position} onSeek={seek} onAuthRequired={onAuthRequired} />}
          {tab === 'Q&A' && <LessonQuestions key={`${source.id}:${user?.id || 'guest'}`} lesson={source} user={user} isSample={isSample} position={position} onSeek={seek} onAuthRequired={onAuthRequired} />}
        </div>
        {notice && <div className="lp-notice" role="status"><span>{notice}</span><button aria-label="Dismiss lesson message" onClick={() => setNotice('')}><X size={17} /></button></div>}
      </div>
      <aside className="lp-sidebar" aria-label="Lesson chapters"><div className="lp-sidebar-heading"><BookOpen size={17} /><strong>In this lesson</strong><span>{chapters.length}</span></div><ol className="lp-chapters">{chapters.map((chapter, index) => <li key={`${chapter.time}-${chapter.title}`}><button className={actualChapter === index ? 'is-current' : ''} aria-current={actualChapter === index ? 'step' : undefined} onClick={() => seek(chapter.time)}><span className="lp-chapter-number">{complete || position > (chapters[index + 1]?.time ?? duration) ? <CheckCircle2 size={17} /> : String(index + 1).padStart(2, '0')}</span><span><strong>{chapter.title}</strong><small>{timestamp(chapter.time)} · {timestamp((chapters[index + 1]?.time ?? duration) - chapter.time)}</small></span>{actualChapter === index ? <Play size={13} /> : <ChevronRight size={15} />}</button></li>)}</ol>
        <div className="lp-progress"><div><strong>{Math.round(progress)}%</strong><span>{complete ? 'Lesson complete' : 'Your progress'}</span></div><div className="lp-progress-track"><span style={{transform: `scaleX(${progress / 100})`}} /></div><p>{isSample ? 'This is a sample. Its position stays in this browser.' : user ? 'Progress is saved to your account.' : 'Sign in to resume on any device.'}</p>{!isSample && !user && onAuthRequired && <button className="lp-sign-in" onClick={onAuthRequired}>Sign in <ArrowRight size={15} /></button>}</div>
        {!compact && <div className="lp-sidebar-phone"><span className="lp-label">{isSample ? 'Your code becomes this' : 'Example app preview'}</span><LivePhone chapter={activeChapter} index={actualChapter} /></div>}
        {relatedLessons.length > 1 && <div className="lp-more-lessons"><span className="lp-label">More lessons</span>{relatedLessons.filter(item => item.id !== source.id).slice(0, 3).map(item => <button key={item.id} onClick={() => setSource(item)}><Play size={14} /><span>{item.title}</span><ChevronRight size={15} /></button>)}</div>}
      </aside>
    </div>}
  </section>;
}
