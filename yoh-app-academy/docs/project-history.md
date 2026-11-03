# YOH App Academy — Stage 1, revised

A bright, project-based mobile development academy for React Native, Expo / Expo Go and JavaScript. The updated direction replaces the earlier cybersecurity branding throughout.

## Stack and commands
Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide and a restyled shadcn-style Button built with Radix Slot and CVA. Use Node 22.13+, `pnpm install`, then `pnpm dev`. `pnpm build` exports the preview to the app's `out` folder. Remove static export before implementing server routes and authentication.

## Preview views
- Academy: six sample app-development courses, technology filters, text search, accessible course dialogs, learning approach, mentorship example and FAQ.
- Student workspace: illustrative progress, course continuation, sample sessions and resources.
- Mentor studio: live lesson metadata preview, selectable sample chapters, and a browser-local draft save. Only text is saved in localStorage under `yoh-lesson-draft-v2`; no upload, account or publication occurs.
- Design system: white/cream canvas, accessible deep-orange primary buttons, pastel course art, typography, form controls and feedback states.

## Source
- `app/page.tsx`: preview views and interactions.
- `app/globals.css`: responsive visual system and design tokens.
- `components/ui`: reusable Button, Badge, Progress and SectionLabel.
- `lib/utils.ts`: class composition.

## Scope and limitations
This is still the design foundation, not a production LMS. Auth, hosted playback, enrollment, mentor messages, real downloads, live sessions, payments and student progress storage are not connected. Future-action controls explicitly explain their status. Course curricula, counts, schedules, student names and progress are sample data. Mentor profiles are intentionally omitted pending app-development team details. The new code wordmark is temporary; an official logo can replace it. Fonts use Google Fonts with system fallbacks and should be self-hosted for production.

## Next stages
Complete public course and mentor pages; Supabase authentication, schema and RLS; connected student/mentor/admin dashboards; private video and document uploads, processing and playback; integration tests and production deployment hardening.

## Realism and motion revision
The presentation bar has been removed; the standard header provides course, mentor and workspace navigation. Course cards use six original rendered UI compositions, with 3-second muted preview loops loaded only on hover/focus. Sample offers now include exact lesson counts, weekly outcomes, durations and explicitly proposed ETB prices. New sections cover an actual classroom screenshot, four-week syllabus, illustrative mentor roster, uneven student-project gallery, free sample video, clearly labelled sample testimonials, and unconfirmed refund/support terms.

The 48-second free micro lesson is original captioned visual instruction, with no voice track. It plays through the HTML video element, includes English WebVTT captions and a clickable transcript, and supports speed changes, chapters, fullscreen via native controls, and local completion state. `scripts/make-media.py` reproduces the video/loops from source screenshots; `public/artwork.html` preserves the original project UI compositions. Mentor portraits are generated placeholders, not depictions of real instructors. People, reviews and gallery attributions remain explicitly fictional samples until supplied/verified.

Motion uses Framer Motion plus transform/opacity CSS: masked headline, staged typing and phone updates, restrained float/parallax, first-view counts, grid layout transitions, hover tilt, in-view progress and completion checks. MotionConfig and local reduced-motion checks stop spatial/continuous animation and hover playback for reduced-motion users. Video sources are deferred until hover or user playback; still images are compressed WebP and lazy loaded. A formal Lighthouse score has not been measured.
