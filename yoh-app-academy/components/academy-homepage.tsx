'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Atom, BookOpen, Braces, Check, Clock3, Code2, Layers, LogOut, Menu, Play, Search, Smartphone, UserRound, X } from 'lucide-react';
import { useMotionPreference } from '../lib/use-motion-preference';
import type { Course } from '../lib/academy-data';
import type { Lesson, PlatformStats, User } from '../lib/platform-types';
import { Count } from './academy-upgrade';
import { AcademyPackage } from './academy-package';
import { HeroLessonPreview, LessonWorkspace } from './lesson-player';
import { AcademyFAQ, AcademyFooter, AcademyMentors, AcademyHowItWorks, AcademyProjects } from './academy-sections';

type HomepageProps = {
  courses: Course[];
  user?: User | null;
  onAuth?: () => void;
  onLogout?: () => void;
  onWorkspace: () => void;
  onStudio: () => void;
  onOpenCourse: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
};

const artwork = [
  { title: 'React Native', icon: Smartphone, tone: 'cobalt' },
  { title: 'Expo workflow', icon: Layers, tone: 'ink' },
  { title: 'JavaScript', icon: Braces, tone: 'yellow' },
  { title: 'Mobile UI', icon: Layers, tone: 'yellow' },
  { title: 'App data', icon: Code2, tone: 'ink' },
  { title: 'Ship with Expo', icon: ArrowUpRight, tone: 'cobalt' },
];

function CourseCard({ course, index, featured = false, published, onOpen }: { course: Course; index: number; featured?: boolean; published: Lesson[]; onOpen: (event: MouseEvent<HTMLButtonElement>) => void }) {
  const art = artwork[index]; const Icon = art.icon;
  const lessons = published.filter(lesson => lesson.courseId === String(index));
  const seconds = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  return <article className={`academy-course-card${featured ? ' academy-course-featured' : ''}`}>
    <div className={`academy-course-art academy-art-${art.tone}`} aria-hidden="true"><Icon size={68} /><span>{art.title}</span></div>
    <div className="academy-course-body">
      <div className="academy-course-category"><span>{featured ? 'Start here / Featured course' : course.category}</span><span className="academy-level">{course.level}</span></div>
      <h3>{course.title}</h3><p>{course.desc}</p>
      {featured && <ul className="academy-course-topics">{course.topics.slice(0, 3).map(topic => <li key={topic}><Check size={16} />{topic}</li>)}</ul>}
      <div className="academy-course-meta"><span><BookOpen size={16} />{lessons.length ? `${lessons.length} published ${lessons.length === 1 ? 'lesson' : 'lessons'}` : `${course.lessons} planned lessons`}</span><span><Clock3 size={16} />{seconds ? `${Math.ceil(seconds / 60)} min` : `${course.hours}h planned`}</span><span><UserRound size={16} />{lessons[0]?.mentorName || 'Mentor to be confirmed'}</span></div>
      <div className="academy-course-bottom"><a className="academy-course-package-link" href="#mentorship-package">Package details</a><button onClick={onOpen} aria-label={`View course: ${course.title}`}>View course <ArrowUpRight size={19} /></button></div>
    </div>
  </article>;
}

export function AcademyHomepage({ courses, user = null, onAuth, onLogout, onWorkspace, onStudio, onOpenCourse }: HomepageProps) {
  const [menuOpen, setMenuOpen] = useState(false); const [filter, setFilter] = useState('All courses'); const [query, setQuery] = useState('');
  const [published, setPublished] = useState<Lesson[]>([]); const [stats, setStats] = useState<PlatformStats | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null); const reduce = useMotionPreference();
  useEffect(() => {
    if (reduce || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
        const section = entry.target as HTMLElement;
        section.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 60}ms`);
        section.classList.add('academy-section-visible');
        observer.unobserve(section);
      });
    }, { threshold: .08 });
    document.querySelectorAll<HTMLElement>('.academy-section:not(.academy-courses)').forEach(section => {
      if (section.getBoundingClientRect().top < window.innerHeight) return;
      section.classList.add('academy-section-reveal'); observer.observe(section);
    });
    return () => observer.disconnect();
  }, [reduce]);
  useEffect(() => {
    let live = true;
    async function refresh() {
      const results = await Promise.allSettled([fetch('/api/lessons').then(r => r.ok ? r.json() : null), fetch('/api/stats').then(r => r.ok ? r.json() : null)]);
      if (!live) return;
      if (results[0].status === 'fulfilled' && results[0].value) setPublished(results[0].value.lessons || []);
      if (results[1].status === 'fulfilled' && results[1].value) setStats(results[1].value);
    }
    refresh(); window.addEventListener('academy-progress-updated', refresh); window.addEventListener('academy-enrollment-updated', refresh); window.addEventListener('academy-auth-updated', refresh);
    return () => { live = false; window.removeEventListener('academy-progress-updated', refresh); window.removeEventListener('academy-enrollment-updated', refresh); window.removeEventListener('academy-auth-updated', refresh); };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } }
    document.addEventListener('keydown', onKeyDown); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previous; };
  }, [menuOpen]);
  function scrollToSection(id: string) { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' }); }
  const filtered = courses.map((course, index) => ({ course, index })).filter(({ course }) => (filter === 'All courses' || course.category === filter) && `${course.title} ${course.desc}`.toLowerCase().includes(query.trim().toLowerCase()));
  const liveStats = stats ? [[stats.publishedLessons, 'published lessons'], [stats.enrolledStudents, 'enrolled students'], [stats.completedLessons, 'lessons completed']].filter(([value]) => Number(value) > 0) : [];
  const nav = (mobile = false) => <><a href="#courses" onClick={() => setMenuOpen(false)}>Courses</a><a href="#mentorship-package" onClick={() => setMenuOpen(false)}>Package</a><a href="#sample-lesson" onClick={() => setMenuOpen(false)}>Free lesson</a><a href="#mentors" onClick={() => setMenuOpen(false)}>Mentors</a>{mobile && <><button onClick={() => { setMenuOpen(false); onWorkspace(); }}>My learning <ArrowUpRight size={18} /></button><button onClick={() => { setMenuOpen(false); onStudio(); }}>Mentor studio <ArrowUpRight size={18} /></button></>}</>;
  return <div className="academy-site">
    <a className="academy-skip-link" href="#academy-main">Skip to content</a>
    <header className="academy-header"><div className="academy-container academy-header-inner">
      <a className="academy-brand" href="#home" aria-label="YO Tech Academy home"><span className="academy-brand-mark"><Code2 size={26} /></span><span><b>yo<span>.</span></b><small>App Academy</small></span></a>
      <nav className="academy-nav" aria-label="Main navigation">{nav()}</nav>
      <div className="academy-header-actions">{user ? <><button className="academy-login-link" onClick={onWorkspace}>My learning <ArrowUpRight size={16} /></button><button className="academy-logout" onClick={onLogout} aria-label="Log out"><LogOut size={19} /></button></> : <button className="academy-login-link" onClick={onAuth}>Log in <ArrowUpRight size={17} /></button>}<button ref={menuButton} className="academy-menu-toggle" aria-expanded={menuOpen} aria-controls="academy-mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </div></header>
    <AnimatePresence>{menuOpen && <><motion.button className="academy-menu-backdrop" aria-label="Close navigation overlay" onClick={() => setMenuOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.nav id="academy-mobile-menu" className="academy-mobile-nav" aria-label="Mobile navigation" initial={reduce ? false : { x: '100%' }} animate={{ x: 0 }} exit={reduce ? { opacity: 0 } : { x: '100%' }} transition={{ duration: .22 }}><span className="academy-kicker">Your next step</span>{nav(true)}<p>Watch a lesson. Write the code. Run it on your phone.</p></motion.nav></>}</AnimatePresence>
    <main id="academy-main">
      <section className="academy-hero" id="home" aria-labelledby="academy-hero-title"><div className="academy-container academy-hero-grid">
        <div className="academy-hero-copy"><span className="academy-kicker"><span className="academy-kicker-line" /> Learn by building</span>
          <h1 id="academy-hero-title"><span className="academy-line-mask"><motion.span initial={reduce ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: reduce ? 0 : .5 }}>Build your</motion.span></span><span className="academy-line-mask"><motion.span initial={reduce ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: reduce ? 0 : .5, delay: reduce ? 0 : .08 }}><span className="academy-mark">first app.<motion.i aria-hidden="true" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : .35, delay: reduce ? 0 : .55 }} /></span></motion.span></span></h1>
          <p>Learn React Native, Expo and JavaScript. Build a task app you can run on your own phone.</p>
          <div className="academy-hero-actions"><button className="academy-button academy-button-primary" onClick={() => scrollToSection('sample-lesson')}><Play size={18} /> Watch a free lesson</button><button className="academy-text-link" onClick={() => scrollToSection('courses')}>See all courses <ArrowRight size={19} /></button></div>
          <div className="academy-hero-tools"><span><Atom size={18} /> React Native</span><span><Layers size={18} /> Expo</span><span><Braces size={18} /> JavaScript</span></div>
        </div>
        <div className="academy-hero-product"><HeroLessonPreview sampleOnly onAuthRequired={onAuth} /><span className="academy-product-caption"><span /> Interactive sample · Build a task app, one component at a time.</span></div>
      </div></section>
      {liveStats.length > 0 && <div className="academy-live-stats"><div className="academy-container">{liveStats.map(([value, label]) => <span key={String(label)}><b><Count value={Number(value)} /></b> {String(label)}</span>)}</div></div>}
      <motion.section className="academy-section academy-courses" id="courses" aria-labelledby="academy-courses-title" initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .05 }} transition={{ duration: reduce ? 0 : .25 }}><div className="academy-container">
        <div className="academy-section-heading"><div><span className="academy-kicker">Practical paths</span><h2 id="academy-courses-title">A little theory.<br />A <mark>working app.</mark></h2></div><p>Choose one project. Learn the pieces as you build it. Keep the code and make it yours.</p></div>
        <AcademyPackage />
        <div className="academy-course-toolbar"><div className="academy-filters" role="group" aria-label="Filter courses by technology">{['All courses', 'React Native', 'Expo', 'JavaScript'].map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div><label className="academy-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a course" aria-label="Search courses" />{query && <button onClick={() => setQuery('')} aria-label="Clear course search"><X size={18} /></button>}</label></div>
        <p className="academy-course-count" role="status">{filtered.length} {filtered.length === 1 ? 'course' : 'courses'} · Curriculum previews</p>
        {filtered[0] && <CourseCard course={filtered[0].course} index={filtered[0].index} featured published={published} onOpen={event => onOpenCourse(filtered[0].index, event)} />}
        <div className="academy-course-grid">{filtered.slice(1).map(({ course, index }) => <CourseCard key={course.title} course={course} index={index} published={published} onOpen={event => onOpenCourse(index, event)} />)}</div>
        {filtered.length === 0 && <div className="academy-empty"><Search size={28} /><h3>No courses found</h3><p>Try another topic, or clear your filters.</p><button className="academy-button" onClick={() => { setFilter('All courses'); setQuery(''); }}>Reset filters <ArrowRight size={18} /></button></div>}
        <p className="academy-note">Curriculum and mentor assignments marked “planned” are previews. Semester dates and topic allocation will be confirmed before enrollment.</p>
      </div></motion.section>
      <section className="academy-section academy-lesson-section" id="sample-lesson" aria-labelledby="academy-lesson-title"><div className="academy-container"><div className="academy-section-heading"><div><span className="academy-kicker">Inside the classroom</span><h2 id="academy-lesson-title">Watch it.<br />Then <mark>build it.</mark></h2></div><p>Pause at the useful bit. Try the code. Pick up where you left off when you come back.</p></div><LessonWorkspace sampleOnly onAuthRequired={onAuth} /></div></section>
      <AcademyMentors />
      <AcademyHowItWorks />
      <AcademyProjects />
      <AcademyFAQ />
    </main>
    <AcademyFooter onWorkspace={onWorkspace} onStudio={onStudio} onExplore={() => scrollToSection('courses')} onLesson={() => scrollToSection('sample-lesson')} />
  </div>;
}
