'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Laptop,
  Layers3,
  Phone,
  Play,
  Quote,
  Smartphone,
  Star,
  UserRound,
} from 'lucide-react';
import { academyContactEmail, academyTeacher } from '../lib/academy-profile';
import { formatFee, mentorshipPackage, mentorshipTotal } from '../lib/academy-offer';

const studentStories = [
  {
    name: 'Hana',
    location: 'Addis Ababa',
    project: 'Daylight planner',
    quote: 'I finally understood props when I used the same card for three different tasks. That was the part I kept copying before.',
  },
  {
    name: 'Abel',
    location: 'Bahir Dar',
    project: 'Fieldnotes journal',
    quote: 'Running my journal on my phone made the whole thing feel real. The next step was adding my own photos.',
  },
  {
    name: 'Sara',
    location: 'Hawassa',
    project: 'Pocket Notes',
    quote: 'The error state was the lesson I needed. My app now tells me what happened instead of showing a blank screen.',
  },
];

export function AcademyTestimonials() {
  return (
    <section className="academy-section academy-testimonials" id="testimonials" aria-labelledby="academy-stories-title">
      <div className="academy-container">
        <div className="academy-section-heading">
          <span className="academy-kicker">THE MOMENT IT CLICKS</span>
          <h2 id="academy-stories-title">SMALL STEPS.<br /><span className="academy-accent">REAL POSSIBILITIES.</span></h2>
          <p>From understanding a component to seeing an idea on a phone.<br />This is the kind of progress we build toward.</p>
        </div>
        <div className="academy-testimonial-grid">
          {studentStories.map((story) => (
            <article className="academy-testimonial-card" key={story.name}>
              <div className="academy-review-top">
                <div className="academy-review-stars" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}
                </div>
                <Quote size={25} aria-hidden="true" />
              </div>
              <blockquote>“{story.quote}”</blockquote>
              <div className="academy-review-person">
                <span className="academy-review-avatar" aria-hidden="true"><UserRound size={20} /></span>
                <div><strong>{story.name} <span>· {story.location}</span></strong><small>Built: {story.project}</small></div>
              </div>
              <span className="academy-sample-label">ILLUSTRATIVE STUDENT STORY</span>
            </article>
          ))}
        </div>
        <p className="academy-note">Example stories and fictional profiles. Your students’ own experiences belong here.</p>
      </div>
    </section>
  );
}

const mentors = [
  {
    name: 'Dawit Tesfaye',
    role: 'React Native mentor',
    bio: 'Makes components, state and navigation click through a planner app you build one screen at a time.',
    specialties: ['React Native', 'App architecture', 'Navigation'],
    project: 'Daylight planner',
  },
  {
    name: 'Meron Alemu',
    role: 'JavaScript & mobile UI mentor',
    bio: 'Connects the logic to the interface, from your first JavaScript function to thoughtful, reusable mobile UI.',
    specialties: ['JavaScript', 'Mobile UI', 'Reusable components'],
    project: 'Habit tracker & mobile UI',
  },
  {
    name: 'Yonas Bekele',
    role: 'Expo & app delivery mentor',
    bio: 'Takes the mystery out of running an app on your phone, working with APIs and preparing a release.',
    specialties: ['Expo', 'APIs', 'Release preparation'],
    project: 'Fieldnotes photo journal',
  },
];

type MentorProfile = { id: string; name: string; role: string; teaches: string[]; yearsExperience: number | null; teachingStyle: string | null; portraitUrl: string | null };

export function AcademyMentors() {
  const [profiles, setProfiles] = useState<MentorProfile[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetch('/api/mentors').then(r => r.ok ? r.json() : { mentors: [] }).then(data => { if (live) setProfiles(data.mentors || []); }).catch(() => {}).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  const registeredTeacher = profiles.find(profile => profile.name.trim().toLocaleLowerCase() === academyTeacher.name.toLocaleLowerCase());
  const publicTeacher: MentorProfile = {
    id: registeredTeacher?.id || academyTeacher.id,
    name: academyTeacher.name,
    role: academyTeacher.role,
    teaches: [...academyTeacher.teaches],
    yearsExperience: academyTeacher.yearsExperience,
    teachingStyle: academyTeacher.teachingStyle,
    portraitUrl: academyTeacher.portraitUrl,
  };
  const publicProfiles = [publicTeacher, ...profiles.filter(profile => profile !== registeredTeacher)];
  const mentor = publicProfiles[active] || publicTeacher;
  const isAcademyTeacher = mentor.id === publicTeacher.id;
  return <section className="academy-section academy-mentor-feature" id="mentors" aria-labelledby="academy-mentors-title"><div className="academy-container">
    <div className="academy-section-heading"><div><span className="academy-kicker">A person, not a playlist</span><h2 id="academy-mentors-title">Learn the why.<br />Then <mark>try it.</mark></h2></div><p>See who teaches the course and what they help you build. Mentor details are confirmed before a course opens.</p></div>
    {loading ? <div className="academy-mentor-skeleton" role="status" aria-label="Loading mentor profiles" /> : <>
      {publicProfiles.length > 1 && <div className="academy-mentor-selector" role="group" aria-label="Choose a mentor">{publicProfiles.map((profile, index) => <button aria-pressed={active === index} key={profile.id} onClick={() => setActive(index)}>{profile.name}</button>)}</div>}
      <article className="academy-mentor-editorial">
        <div className="academy-mentor-portrait">{mentor.portraitUrl ? <img decoding="async" src={mentor.portraitUrl} alt={mentor.name} width={1254} height={1254} loading="lazy" /> : <><img decoding="async" className="academy-placeholder-portrait" src="/media/mentor-triptych.webp" alt="Placeholder mentor portrait; the approved team photo has not been supplied." width={1500} height={500} loading="lazy" /><span>Placeholder portrait</span></>}</div>
        <div className="academy-mentor-editorial-copy">
          <span className="academy-kicker">Your course teacher</span>
          <h3>{mentor.name}</h3>
          <p className="academy-mentor-editorial-role">{mentor.role}</p>
          <p className="academy-mentor-editorial-quote">{mentor.teachingStyle || 'The teacher’s teaching approach and professional biography are being confirmed.'}</p>
          {isAcademyTeacher && <p className="academy-mentor-editorial-bio">{academyTeacher.biography}</p>}
          <div className="academy-mentor-facts">
            <div><span>Teaches</span><p>{mentor.teaches.length ? mentor.teaches.join(' · ') : 'Teaching subjects to be confirmed'}</p></div>
            <div><span>{isAcademyTeacher ? 'Coding experience' : 'Experience'}</span><p>{mentor.yearsExperience != null ? `${mentor.yearsExperience} years${isAcademyTeacher ? ' building software' : ''}` : 'Years of experience to be supplied'}</p></div>
          </div>
          <div className="academy-mentor-actions">
            {isAcademyTeacher && <a className="academy-mentor-contact" href={academyTeacher.phoneHref} aria-label={`Call ${academyTeacher.name} at ${academyTeacher.phone}`}><Phone size={18} strokeWidth={1.5} aria-hidden="true" /><span>Call {academyTeacher.phone}</span></a>}
            <a href="#courses">Explore the courses <ArrowUpRight size={18} /></a>
          </div>
        </div>
      </article>
      {publicProfiles.length > 1 && <p className="academy-note">Additional mentor details awaiting confirmation are marked above. Placeholder portraits remain until approved photos are supplied.</p>}
    </>}
  </div></section>;
}

export function AcademyHowItWorks() {
  const steps = [
    ['Watch one idea', 'A short explanation gives you the next piece. Pause at the line you want to try.'],
    ['Run it on your phone', 'Write the component. Change the props. See what happens on a real screen.'],
    ['Make the project yours', 'Work through the chapters, add your own feature and save your progress.'],
  ];
  return <section className="academy-section academy-process" id="approach" aria-labelledby="academy-process-title"><div className="academy-container academy-process-grid"><div><span className="academy-kicker">How it works</span><h2 id="academy-process-title">One idea.<br />One <mark>useful step.</mark></h2><p>You do not need every answer before you begin. Work through one small build at a time.</p><a className="academy-text-link" href="#sample-lesson">Try the classroom <ArrowRight size={18} /></a></div><ol className="academy-timeline">{steps.map(([title, description], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></div></section>;
}

export function AcademyProjects() {
  const projects = [{title:'Daylight planner',description:'A small place for the three things you want to do today.',image:0},{title:'Fieldnotes journal',description:'Save a photo and the story you want to remember.',image:1},{title:'Pocket Notes',description:'Keep a useful thought and find it when you need it.',image:4}];
  return <section className="academy-section academy-projects" id="student-projects" aria-labelledby="academy-projects-title"><div className="academy-container"><div className="academy-section-heading"><div><span className="academy-kicker">A place for your work</span><h2 id="academy-projects-title">Small apps.<br /><mark>Personal ideas.</mark></h2></div><p>These are example app concepts. Student names, cities and approved project screenshots will go here.</p></div><div className="academy-project-masonry">{projects.map((project, index) => <article className={`academy-project-tile academy-project-tile-${index}`} key={project.title}><div className="academy-project-image"><img decoding="async" src={`/media/course-${project.image}.webp`} alt={`Placeholder concept image for ${project.title}, not a verified student submission.`} width={640} height={360} loading="lazy" /></div><div className="academy-project-copy"><span className="academy-kicker">Placeholder project</span><h3>{project.title}</h3><p>{project.description}</p><span className="academy-project-person">First name pending <span>·</span> City pending</span></div></article>)}</div></div></section>;
}

const questions = [
  { question: 'Do I need to know how to code?', answer: 'Start with JavaScript fundamentals if coding is new to you. Beginner courses explain components, props and state as you build. Intermediate courses list the skills you need first.' },
  { question: 'What do I need to get started?', answer: 'A computer, a code editor and an internet connection. A phone with Expo Go helps you preview compatible projects. Each course covers its setup.' },
  { question: 'Can I try a lesson first?', answer: 'Yes. The free classroom includes a clearly marked interactive sample. Mentor-uploaded recordings appear in the lesson library when published.' },
  { question: 'Will my progress be saved?', answer: 'Yes. Sign in to save your place and completion in your account. You can resume a published lesson after logging out or using another device. The anonymous sample is only a preview.' },
  { question: 'How do mentor uploads work?', answer: 'Invited mentors can save a lesson draft, upload an MP4 or WebM recording, attach a PDF or ZIP, then publish the lesson. Students can watch and download published resources.' },
  { question: 'How is the mentorship package priced?', answer: `The program has ${mentorshipPackage.semesterCount} semesters. Each semester costs ${formatFee(mentorshipPackage.feePerSemester)}, for ${formatFee(mentorshipTotal)} in total. Contact Yohanes about enrollment. This version does not accept online payments.` },
];

export function AcademyFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="academy-section academy-faq" id="faq" aria-labelledby="academy-faq-title">
      <div className="academy-container">
        <div className="academy-section-heading">
          <span className="academy-kicker">Before you begin</span>
          <h2 id="academy-faq-title">Good questions.<br /><span className="academy-accent">Clear answers.</span></h2>
          <p>A few practical answers about the classroom.</p>
        </div>
        <div className="academy-faq-list">
          {questions.map((item, index) => (
            <article className={`academy-faq-item${open === index ? ' academy-faq-open' : ''}`} key={item.question}>
              <h3>
                <button id={`academy-faq-question-${index}`} type="button" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} aria-controls={`academy-faq-answer-${index}`}>
                  <span className="academy-faq-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item.question}</span>
                  <ChevronDown size={19} aria-hidden="true" />
                </button>
              </h3>
              <div id={`academy-faq-answer-${index}`} role="region" aria-labelledby={`academy-faq-question-${index}`} hidden={open !== index}>
                <p>{item.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

type ClosingProps = { onExplore: () => void; onTryLesson: () => void };

export function AcademyClosing({ onExplore, onTryLesson }: ClosingProps) {
  const benefits = [
    { icon: Smartphone, title: '6 projects', label: 'IDEAS YOU CAN MAKE YOUR OWN' },
    { icon: BookOpen, title: '136 lessons', label: 'A CLEAR PATH THROUGH THE CODE' },
    { icon: Layers3, title: '3 technologies', label: 'JAVASCRIPT · REACT NATIVE · EXPO' },
    { icon: Laptop, title: 'Your pace', label: 'ROOM TO PAUSE, PRACTICE & BUILD' },
  ];

  return (
    <section className="academy-section academy-closing" aria-labelledby="academy-closing-title">
      <div className="academy-container">
        <span className="academy-kicker">YOUR NEXT CHAPTER STARTS WITH A FIRST SCREEN</span>
        <h2 id="academy-closing-title">Start with one screen.<br /><span className="academy-accent">Keep going.</span></h2>
        <p>You already have the idea. Let’s give it a place on your phone.<br />Find your starting point and take it one useful step at a time.</p>
        <div className="academy-closing-actions">
          <button className="academy-button academy-button-primary" type="button" onClick={onExplore}>Explore the courses <ArrowUpRight size={18} aria-hidden="true" /></button>
          <button className="academy-button academy-button-outline" type="button" onClick={onTryLesson}><Play size={16} aria-hidden="true" /> Try a free lesson</button>
        </div>
        <span className="academy-note">The interactive sample is free. Recorded lessons appear when a mentor publishes them.</span>
      </div>
    </section>
  );
}

type FooterProps = {
  onWorkspace: () => void;
  onStudio: () => void;
  onExplore: () => void;
  onLesson: () => void;
};

export function AcademyFooter({ onWorkspace, onStudio, onExplore, onLesson }: FooterProps) {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || academyContactEmail;
  return (
    <footer className="academy-footer">
      <div className="academy-container">
        <div className="academy-footer-grid">
          <div className="academy-footer-brand">
            <a className="academy-brand" href="#" aria-label="YO Tech Academy, back to top"><span className="academy-brand-icon"><Code2 size={25} aria-hidden="true" /></span><span>yo<span className="academy-brand-dot">.</span><small>APP ACADEMY</small></span></a>
            <p>A place to turn “I have an idea” into “I built an app.” Learn the tools. Understand the code. Make it yours.</p>
            <span className="academy-footer-location">YO Tech LLC</span>
            <a className="academy-footer-contact" href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <a className="academy-footer-contact academy-footer-phone" href={academyTeacher.phoneHref} aria-label={`Call ${academyTeacher.name} at ${academyTeacher.phone}`}><Phone size={17} strokeWidth={1.5} aria-hidden="true" /><span>{academyTeacher.phone}</span></a>
          </div>
          <div className="academy-footer-column">
            <h3>LEARNING PATHS</h3>
            <button type="button" onClick={onExplore}>React Native <ArrowUpRight size={13} aria-hidden="true" /></button>
            <button type="button" onClick={onExplore}>Expo & app delivery <ArrowUpRight size={13} aria-hidden="true" /></button>
            <button type="button" onClick={onExplore}>JavaScript fundamentals <ArrowUpRight size={13} aria-hidden="true" /></button>
            <button type="button" onClick={onLesson}>The free classroom <ArrowUpRight size={13} aria-hidden="true" /></button>
          </div>
          <div className="academy-footer-column">
            <h3>THE ACADEMY</h3>
            <a href="#mentors">Meet the mentors</a>
            <a href="#mentorship-package">The mentorship package</a>
            <a href="#faq">Frequently asked questions</a>
            <button type="button" onClick={onWorkspace}>Student workspace</button>
            <button type="button" onClick={onStudio}>Mentor studio</button>
          </div>
          <div className="academy-footer-start">
            <span className="academy-kicker">YOU CAN START SMALL</span>
            <h3>One component.<br />Your first step.</h3>
            <p>Try the captioned sample lesson. No account needed.</p>
            <button type="button" onClick={onLesson}>Take the free lesson <ArrowRight size={17} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="academy-footer-bottom"><span>© {new Date().getFullYear()} YO Tech LLC.</span><span>Learn by building. YO Tech Academy.</span><a href="#">BACK TO TOP <ArrowUpRight size={13} aria-hidden="true" /></a></div>
      </div>
    </footer>
  );
}
