# YOH App Academy design and delivery checks

3 November 2026. Current implementation follows the supplied restyling brief.

## Design

Shared tokens define paper, white and ink surfaces, cobalt actions and sparse yellow highlights. Local Bricolage Grotesque, Inter and JetBrains Mono fonts are packaged with the app. The left-aligned two-line hero includes a working lesson preview and changing phone UI. Courses use 16:10 artwork, readable short titles, a featured layout and restrained color accents. Editorial mentors, a vertical timeline, masonry project concepts, FAQ and the YOH Tech LLC footer vary the page rhythm. The supplied contact email is live.

The retained course catalog, course dialog and page/workspace integration remain in place. Accounts, uploaded lessons and account progress now use SQLite and server-side storage. Old browser drafts can be imported without overwriting their original browser copy.

## Visual verification

Playwright with system Chrome checked the packaged production app at 390, 768 and 1440 CSS pixels. Screenshots were captured after local fonts and lazy images were ready. Document width equals viewport width on the homepage, mentor studio, student workspace and verification page. Reviewed captures show readable text and usable layouts without page overflow. Player controls and mobile navigation use 44px targets. Normal-motion typing and reduced-motion rendering were checked with no console warnings or errors.

- Homepage: [1440px](docs/qa/home-1440.png), [768px](docs/qa/home-768.png), [390px](docs/qa/home-390.png), [full mobile page](docs/qa/home-full-390.png).
- Account screens: [mentor studio](docs/qa/studio-390.png), [student workspace](docs/qa/student-390.png), [timestamp notes](docs/qa/notes-390.png), [public verification](docs/qa/verify-390.png).
- [Homepage browser results](docs/qa/homepage.json).

## Functional checks

The production browser flow passed registration with an invited mentor, draft creation, actual MP4 and ZIP upload with progress, publishing, student registration, real uploaded-video playback, keyboard seeking, logout/reload/login resume, database-confirmed completion and logout. No browser console errors or warnings occurred. [Production flow results](docs/qa/production-flow.json).

Additional checks passed ownership and file validation, real mentor viewing/completion analytics, private timestamp notes, timestamp seeking, student questions, mentor replies, answer permissions, certificate eligibility and explicit issuance, private PDF downloads and public UUID verification. Invalid verification IDs return HTTP 404. [Analytics](docs/qa/mentor-analytics.json), [notes and Q&A](docs/qa/notes-and-questions.json), [certificate UI](docs/qa/certificate-browser.json), [certificate API](docs/qa/certificate-api.json).

The packaged production server separately passed browser-draft preservation, PDF generation using its bundled fonts, and the verification route. [Production smoke results](docs/qa/production-smoke.json).

The generated certificate was rendered with Poppler and visually inspected as one A4 landscape page. Mixed Ethiopic and Latin recipient text renders, text fits, and the verification ID and link are legible. [Certificate render](docs/qa/certificate-render.png).

## Build and performance

- Node 24.18.0, pnpm 11.20.0.
- `pnpm typecheck` and production `pnpm build` passed. Build output contained no errors or warnings.
- Production packaging includes server code, public assets, local web fonts and PDF fonts.
- Final Lighthouse 13.6.0 default mobile performance score: **94/100**. FCP 1.1s, LCP 1.1s, TBT 240ms, CLS 0, Speed Index 3.7s. [Summary](docs/qa/lighthouse-summary.json), [full report](docs/qa/lighthouse.json). This local lab result is not a guarantee for another host or network.
- `git diff --check` passed.
- Docker Compose configuration validation passed. A Docker engine was unavailable, so image execution was not tested.

## Content and deployment

QA accounts and media were isolated in a temporary data directory. The owner database begins without fabricated activity; zero public stats are hidden. Sample lesson media, mentor portrait/profile fields, project concepts and proposed catalog values remain clearly identified. See [TODO_CONTENT.md](TODO_CONTENT.md) for required owner material.

The verified local production preview runs at http://127.0.0.1:3014 using the project’s persistent `.data` directory. The existing development server on port 3002 was preserved. `pnpm dev` defaults to 3002.

No public deployment is claimed. A connected Node host with persistent storage is still required; the prepared Node/Docker deployment and environment steps are in [README.md](README.md). The older orange reference and motion images under `docs/design/` are historical captures, not evidence of this current design.
