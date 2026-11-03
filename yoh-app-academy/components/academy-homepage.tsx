'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowRight, ArrowUpRight, Atom, BookOpen, Braces, Check, CheckCircle2, Clock3, Code2, Layers, Menu, Play, Search, Smartphone, X } from 'lucide-react';
import type { Course } from '../lib/academy-data';
import { details, LessonWorkspace, ProjectPreview } from './academy-upgrade';
import { AcademyClosing, AcademyFAQ, AcademyFooter, AcademyMentors, AcademyTestimonials } from './academy-sections';

type HomepageProps = {
  courses: Course[];
  onWorkspace: () => void;
  onStudio: () => void;
  onOpenCourse: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
};

function Brand() {
  return <span className="academy-brand-copy"><span className="academy-brand-name">yoh<span>.</span></span><span className="academy-brand-label">APP ACADEMY</span></span>;
}

function CourseCard({ course, index, onOpen }: { course: Course; index: number; onOpen: (event: MouseEvent<HTMLButtonElement>) => void }) {
  const [hovered, setHovered] = useState(false);
  return <article className="academy-course-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={() => setHovered(false)}>
    <div className="academy-course-image"><ProjectPreview index={index} hovered={hovered} /></div>
    <div className="academy-course-body">
      <div className="academy-course-category"><span><Code2 size={15} /> {course.category}</span><span className="academy-level">{course.level}</span></div>
      <h3 className="academy-course-title">{course.title}</h3>
      <p className="academy-course-desc">{course.desc}</p>
      <ul className="academy-course-topics">{course.topics.slice(0, 3).map(topic => <li key={topic}><Check size={15} />{topic}</li>)}</ul>
      <div className="academy-course-meta"><span><Clock3 size={15} />{details[index].weeks} weeks</span><span><BookOpen size={15} />{course.lessons} lessons</span><span>{course.hours}h of video</span></div>
      <div className="academy-course-bottom"><div className="academy-course-price"><b>{details[index].price.toLocaleString()} <span>ETB</span></b><small>Proposed course price</small></div><button className="academy-course-action" onClick={onOpen} aria-label={`View course: ${course.title}`}>View course <ArrowUpRight size={17} /></button></div>
    </div>
  </article>;
}

export function AcademyHomepage({ courses, onWorkspace, onStudio, onOpenCourse }: HomepageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('All courses');
  const [query, setQuery] = useState('');
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);
  function scrollToSection(id: string) {
    setMenuOpen(false);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
  }
  const filtered = courses.map((course, index) => ({ course, index })).filter(({ course }) =>
    (filter === 'All courses' || course.category === filter) && `${course.title} ${course.desc} ${course.topics.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const explore = () => scrollToSection('courses');
  const tryLesson = () => scrollToSection('sample-lesson');

  return <div className="academy-site">
    <a className="academy-skip-link" href="#academy-main">Skip to content</a>
    <header className="academy-header">
      <div className="academy-container academy-header-inner">
        <a className="academy-brand" href="#home" aria-label="YOH App Academy home"><span className="academy-brand-mark"><Code2 size={25} /></span><Brand /></a>
        <nav className="academy-nav" aria-label="Main navigation"><a href="#home">Home</a><a href="#courses">Courses</a><a href="#mentors">Mentors</a><a href="#faq">FAQ</a></nav>
        <div className="academy-header-actions"><button className="academy-button academy-button-primary academy-button-small" onClick={onWorkspace}>My workspace <ArrowUpRight size={16} /></button><button ref={menuButton} className="academy-menu-toggle" aria-expanded={menuOpen} aria-controls="academy-mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button></div>
      </div>
      {menuOpen && <nav id="academy-mobile-menu" className="academy-mobile-nav" aria-label="Mobile navigation"><a href="#home" onClick={() => setMenuOpen(false)}>Home</a><a href="#courses" onClick={() => setMenuOpen(false)}>Explore courses</a><a href="#mentors" onClick={() => setMenuOpen(false)}>Meet the mentors</a><a href="#faq" onClick={() => setMenuOpen(false)}>Frequently asked questions</a><button onClick={() => { setMenuOpen(false); onWorkspace(); }}>My workspace <ArrowUpRight size={16} /></button><button onClick={() => { setMenuOpen(false); onStudio(); }}>Mentor studio <ArrowUpRight size={16} /></button></nav>}
    </header>

    <main id="academy-main">
      <section className="academy-hero" id="home" aria-labelledby="academy-hero-title">
        <div className="academy-container">
          <span className="academy-eyebrow"><span className="academy-live-dot" /> APP DEVELOPMENT, MADE PRACTICAL</span>
          <h1 id="academy-hero-title" className="academy-hero-title">YOUR IDEAS.<br /><span className="academy-accent">REAL APPS.</span><br />BUILT BY YOU.</h1>
          <p className="academy-hero-copy">Learn React Native, Expo and JavaScript by building projects you can actually use. From your first component to an app on your phone.</p>
          <div className="academy-hero-actions"><button className="academy-button academy-button-primary" onClick={explore}>Explore courses <ArrowUpRight size={19} /></button><button className="academy-button academy-button-outline" onClick={tryLesson}><Play size={16} /> Try a free lesson</button></div>
          <div className="academy-hero-trust"><span><CheckCircle2 size={15} /> Beginner friendly</span><span><CheckCircle2 size={15} /> Learn by building</span><span><CheckCircle2 size={15} /> Your pace, your progress</span></div>
          <div className="academy-metrics" aria-label="Planned curriculum at a glance">{[[String(courses.length).padStart(2, '0'), 'PROJECT-BASED COURSES'], [String(courses.reduce((n, course) => n + course.lessons, 0)), 'FOCUSED LESSONS'], [String(courses.reduce((n, course) => n + course.hours, 0)), 'HOURS OF PLANNED VIDEO'], ['03', 'CORE TECHNOLOGIES']].map(([value, label]) => <div className="academy-metric" key={label}><strong>{value}<span> /</span></strong><small>{label}</small></div>)}</div>
        </div>
      </section>

      <div className="academy-tech-strip"><div className="academy-container academy-tech-inner"><span className="academy-tech-label">ONE IDEA. THE TOOLS TO BUILD IT.</span><div className="academy-tech-item"><Atom size={25} /><b>React Native</b></div><div className="academy-tech-item"><Layers size={24} /><b>Expo</b></div><div className="academy-tech-item"><Braces size={25} /><b>JavaScript</b></div><span className="academy-tech-end"><Smartphone size={20} /> From editor to your phone <ArrowRight size={16} /></span></div></div>

      <section className="academy-section academy-courses" id="courses" aria-labelledby="academy-courses-title">
        <div className="academy-container">
          <div className="academy-section-heading"><span className="academy-kicker">A SKILL. A PROJECT. YOUR NEXT STEP.</span><h2 id="academy-courses-title">FIND YOUR <span className="academy-accent">STARTING POINT.</span></h2><p>Pick a path. Get your hands on the code.<br />Every course moves you closer to an app that’s yours.</p></div>
          <div className="academy-course-toolbar"><div className="academy-filters" role="group" aria-label="Filter courses by technology">{['All courses', 'React Native', 'Expo', 'JavaScript'].map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}{value === 'All courses' && <span>{courses.length}</span>}</button>)}</div><label className="academy-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find your next skill..." aria-label="Search courses" />{query && <button onClick={() => setQuery('')} aria-label="Clear course search"><X size={16} /></button>}</label></div>
          <p className="academy-course-count" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'course' : 'courses'} to explore</p>
          <div className="academy-course-grid">{filtered.map(({ course, index }) => <CourseCard key={course.title} course={course} index={index} onOpen={event => onOpenCourse(index, event)} />)}</div>
          {filtered.length === 0 && <div className="academy-empty"><Search size={32} /><h3>No courses found</h3><p>Try another skill or clear your filters to see every course.</p><button className="academy-button academy-button-outline" onClick={() => { setFilter('All courses'); setQuery(''); }}>Reset filters <ArrowRight size={17} /></button></div>}
          <p className="academy-note">Sample curriculum and proposed prices. Enrollment is not open yet.</p>
        </div>
      </section>

      <section className="academy-section academy-lesson-section" id="sample-lesson" aria-labelledby="academy-lesson-title"><div className="academy-container"><div className="academy-section-heading academy-lesson-heading"><span className="academy-kicker"><Play size={14} /> THE BEST WAY TO KNOW? TRY IT.</span><h2 id="academy-lesson-title">LESS WATCHING.<br /><span className="academy-accent">MORE “I BUILT THAT.”</span></h2><p>One component. Two task cards. Your first 48 seconds of React Native.<br />A free, captioned lesson. No account needed.</p></div><div className="academy-lesson-shell"><LessonWorkspace /></div><p className="academy-note">Try the lesson, follow the chapters, then make it your own.</p></div></section>
      <AcademyTestimonials />
      <AcademyMentors />
      <AcademyFAQ />
      <AcademyClosing onExplore={explore} onTryLesson={tryLesson} />
    </main>
    <AcademyFooter onWorkspace={onWorkspace} onStudio={onStudio} onExplore={explore} onLesson={tryLesson} />
  </div>;
}
