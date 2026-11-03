# YOH App Academy — Full Website Source

This is the full frontend source for the current YOH App Academy website, exported on 3 November 2026. It includes the academy landing page, student workspace, mentor studio, responsive styling, animations and all images/videos used by the website.

## Run it on your computer

1. Install Node.js 22.13 or newer and pnpm 11.20.0. If Corepack is installed, run `corepack enable` to enable pnpm; the project's `packageManager` field selects the version.
2. Extract this ZIP.
3. Open `YOH-App-Academy-Source` or its `yoh-app-academy` folder in VS Code or another IDE. Both folders now contain a `package.json` and support the same commands.
4. Open the IDE terminal and run:

```bash
pnpm install
pnpm dev
```

5. Open http://localhost:3000 in your browser. If that port is occupied, use the address printed by Next.js in the terminal.
6. Edit a file and save it. The development server updates the browser automatically.
7. Press Ctrl+C in the terminal to stop the server.

You do not need any API keys or a `.env` file to run this frontend. An internet connection is needed for the first dependency installation. The fonts load from Google Fonts; system fonts are used if unavailable.

## Where to edit

| File or folder | What it contains |
| --- | --- |
| `app/page.tsx` | Page switching, course dialogs, student workspace and mentor studio |
| `components/academy-homepage.tsx` | Main academy page, navigation, hero, course catalog and free classroom |
| `components/academy-sections.tsx` | Student stories, mentors, FAQ, closing call to action and footer |
| `lib/academy-data.ts` | Shared course titles, descriptions, topics and curriculum data |
| `components/academy-upgrade.tsx` | Mentors, project gallery, sample lesson/player, syllabus, testimonials, support info and animations |
| `app/globals.css` | Cream/orange colors, typography, spacing and responsive styles |
| `app/academy-homepage.css` | New homepage layout and responsive white/orange design tokens |
| `app/layout.tsx` | Website title, description and global layout |
| `components/ui/` | Buttons, badges, progress and section-label components |
| `public/media/` | All course thumbnails, portrait placeholders, screenshots, captions and video files |
| `public/artwork.html` | Source compositions used to create course thumbnails |
| `scripts/make-media.py` | Optional asset-generation script; not required to run the website |

The homepage follows the broad structure of the Geez Security academy reference: a centered hero and curriculum metrics, course catalog, student stories, mentors, FAQ and closing call to action. Content and imagery focus on app development. The palette uses roughly 60% white, 30% warm peach surfaces and 10% strong orange accents. The working sample classroom remains available between the catalog and student stories.

## Production build

```bash
pnpm build
```

Next.js exports a static website to `yoh-app-academy/out/` (or `out/` relative to this app folder). Deploy that output to a static web host. Do not open the TSX source files directly in a browser. For local editing, use `pnpm dev`. Run `pnpm typecheck` to check TypeScript without building.

## Included behavior

- Responsive academy page and navigation.
- Six courses with filters, search, detail dialogs and muted preview loops.
- Centered typography, curriculum metrics, a technology strip and reduced-motion safeguards.
- Fictional mentor profiles, original project previews and clearly labelled illustrative student stories.
- Playable 48-second sample lesson, captions, transcript, chapters and playback speed.
- Lesson completion saved in this browser.
- Student workspace and mentor lesson editor.
- Mentor draft text saved in this browser.

## Current limits

This is a frontend prototype. Real accounts, enrollment, payments, mentor messaging, video uploads and a backend database are not connected. People, prices, course plans, feedback and reviews are samples. The portrait images are generated placeholders. The sample lesson is a silent visual tutorial with captions. Refund/support terms need the academy's actual details.

## Technical notes

Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion and Lucide. This is a pnpm workspace; dependency versions are recorded in the outer folder's `pnpm-lock.yaml`. Use `pnpm install --frozen-lockfile` for a reproducible install. Review and update dependencies before a public production launch.

The media files are already included. Regenerating them with `scripts/make-media.py` is optional and requires Python, Pillow, FFmpeg and the Linux DejaVu fonts referenced in the script. It also uses a temporary path from the original build environment; adapt that path before running the script elsewhere.

The ZIP omits `node_modules`, generated build output, Git history, private hosting configuration and an obsolete one-time migration script. These are unnecessary for local development. Existing validation notes are in `docs/verification.md`; `docs/project-history.md` records the earlier implementation notes.
