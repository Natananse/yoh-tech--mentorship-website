'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Laptop,
  Layers3,
  Play,
  Quote,
  Smartphone,
  Star,
  UserRound,
} from 'lucide-react';

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

export function AcademyMentors() {
  return (
    <section className="academy-section academy-mentors" id="mentors" aria-labelledby="academy-mentors-title">
      <div className="academy-container">
        <div className="academy-section-heading">
          <span className="academy-kicker">GUIDANCE THAT GOES BEYOND THE TUTORIAL</span>
          <h2 id="academy-mentors-title">MEET YOUR<br /><span className="academy-accent">APP-BUILDING GUIDES.</span></h2>
          <p>Clear explanations. Practical projects.<br />People who help you understand the why behind the code.</p>
        </div>
        <div className="academy-mentor-grid">
          {mentors.map((mentor, index) => (
            <article className="academy-mentor-card" key={mentor.name}>
              <div className={`academy-mentor-photo academy-mentor-photo-${index}`} role="img" aria-label={`AI-generated placeholder portrait for sample mentor ${mentor.name}`}>
                <span className="academy-photo-label">ILLUSTRATIVE PORTRAIT</span>
              </div>
              <div className="academy-mentor-body">
                <span className="academy-sample-label">SAMPLE MENTOR PROFILE</span>
                <h3>{mentor.name}</h3>
                <span className="academy-mentor-role">{mentor.role}</span>
                <p>{mentor.bio}</p>
                <h4>TEACHES</h4>
                <ul className="academy-mentor-tags">{mentor.specialties.map((specialty) => <li key={specialty}>{specialty}</li>)}</ul>
                <div className="academy-mentor-project"><BookOpen size={17} aria-hidden="true" /><span>PROJECT FOCUS<strong>{mentor.project}</strong></span></div>
              </div>
            </article>
          ))}
        </div>
        <p className="academy-note">Meet the teaching approach through these sample profiles. Team details will be confirmed before enrollment opens.</p>
      </div>
    </section>
  );
}

const questions = [
  {
    question: 'Do I need to know how to code?',
    answer: 'You can begin with JavaScript fundamentals, then move into React Native and Expo. Beginner courses explain the basics as you build. Intermediate courses assume you are comfortable with components, props and state.',
  },
  {
    question: 'What do I need to get started?',
    answer: 'A laptop or desktop computer, a code editor and an internet connection. A phone with Expo Go is useful for previewing compatible projects. Each course explains its setup before you start building.',
  },
  {
    question: 'What will I actually build?',
    answer: 'Each course has a practical project: a daily planner, photo journal, habit tracker, polished mobile interface, connected notes app or app release checklist. The goal is working code you can understand and make your own.',
  },
  {
    question: 'How long are the courses?',
    answer: 'The proposed courses span two to four weeks, with 10–24 hours of lessons each. Plan extra time for exercises, debugging and adding your own ideas. The course details show the planned duration and syllabus.',
  },
  {
    question: 'Can I try a lesson before joining?',
    answer: 'Yes. The free classroom on this page includes a 48-second captioned lesson about a reusable task card. You can explore its chapters, practice task and transcript without creating an account.',
  },
  {
    question: 'How much does it cost, and is enrollment open?',
    answer: 'The catalog shows proposed one-time prices in ETB. This is a frontend preview: enrollment and payments are not connected. Final course availability, mentor details and refund terms will be confirmed before payment opens.',
  },
];

export function AcademyFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="academy-section academy-faq" id="faq" aria-labelledby="academy-faq-title">
      <div className="academy-container">
        <div className="academy-section-heading">
          <span className="academy-kicker">A LITTLE CLARITY BEFORE YOU START</span>
          <h2 id="academy-faq-title">GOOD QUESTIONS.<br /><span className="academy-accent">CLEAR ANSWERS.</span></h2>
          <p>Everything you need to take your next step with confidence.</p>
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
        <h2 id="academy-closing-title">STOP JUST SCROLLING.<br /><span className="academy-accent">START BUILDING.</span></h2>
        <p>You already have the idea. Let’s give it a place on your phone.<br />Find your starting point and take it one useful step at a time.</p>
        <div className="academy-closing-actions">
          <button className="academy-button academy-button-primary" type="button" onClick={onExplore}>Explore the courses <ArrowUpRight size={18} aria-hidden="true" /></button>
          <button className="academy-button academy-button-outline" type="button" onClick={onTryLesson}><Play size={16} aria-hidden="true" /> Try a free lesson</button>
        </div>
        <div className="academy-closing-benefits">
          {benefits.map(({ icon: Icon, title, label }) => (
            <div key={title}><Icon size={22} aria-hidden="true" /><strong>{title}</strong><span>{label}</span></div>
          ))}
        </div>
        <span className="academy-note">Planned curriculum. Start with the working free sample.</span>
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
  return (
    <footer className="academy-footer">
      <div className="academy-container">
        <div className="academy-footer-grid">
          <div className="academy-footer-brand">
            <a className="academy-brand" href="#" aria-label="YOH App Academy, back to top"><span className="academy-brand-icon"><Code2 size={25} aria-hidden="true" /></span><span>yoh<span className="academy-brand-dot">.</span><small>APP ACADEMY</small></span></a>
            <p>A place to turn “I have an idea” into “I built an app.” Learn the tools. Understand the code. Make it yours.</p>
            <span className="academy-footer-location"><Check size={14} aria-hidden="true" /> BUILT AROUND LEARNING BY DOING</span>
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
        <div className="academy-footer-bottom"><span>© {new Date().getFullYear()} YOH App Academy.</span><span>Frontend preview · Enrollment is not open.</span><a href="#">BACK TO TOP <ArrowUpRight size={13} aria-hidden="true" /></a></div>
      </div>
    </footer>
  );
}
