# Verification — 3 November 2026

The final production build follows the supplied paper/cobalt/yellow restyling brief. See [the design and delivery report](../design-qa.md) for screenshots and machine-readable evidence.

- `pnpm typecheck`, `pnpm build` and `git diff --check` passed. Production build output and final browser checks contained no warnings or errors.
- Full production browser flow passed: mentor registration, actual MP4 and ZIP uploads with progress, publishing, student registration, playback, seek, logout/reload/login resume, persisted completion and logout.
- Homepage, mentor studio, student workspace and certificate verification fit 390, 768 and 1440px without horizontal overflow.
- Notes persist privately per account, timestamps seek playback, Q&A supports real student questions and owning-mentor/admin answers, and role restrictions were checked.
- Certificates require all currently published lessons in a course to be complete and an explicit issue action. Owner/admin PDF access, public verification without email/account IDs, invalid-ID 404s and Unicode PDF rendering passed.
- Saved earlier browser drafts can be imported without a server write or changing the original localStorage copy.
- Supplied footer contact is present. A fresh database hides zero statistics. Hero typing, the mobile drawer and reduced-motion behavior passed.
- Final default mobile Lighthouse performance score: **94/100**, LCP 1.1s, TBT 240ms, CLS 0. [Report](qa/lighthouse-summary.json).
- Standalone production packaging includes public files and both web/PDF fonts. `pnpm dev` defaults to port 3002. Root workspace commands use pnpm.
- Docker Compose configuration validation passed; Docker image execution and public deployment were not verified because no Docker engine or connected persistent Node host was available.

The current local production preview is http://127.0.0.1:3014. QA accounts and media were kept in temporary storage, separate from the owner’s persistent project data. See [required content](../TODO_CONTENT.md) and [deployment instructions](../README.md).
