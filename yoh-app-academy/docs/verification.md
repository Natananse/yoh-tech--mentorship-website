# Verification — 3 November 2026

Current result: the local preview at http://localhost:3014 is connected to the deployed Convex production backend. The owner selected **Netlify Free + Convex Free** within a strict **$0 budget**, with administrator-approved program enrollment. The public Netlify website is not yet deployed.

## Confirmed teacher profile

Yohanes Damtae’s supplied portrait, name, JavaScript/React Native subjects, four years of coding experience, approved project biography and call links are displayed. The phone is 0911701858 (`tel:+251911701858`); the public email is yohansforex@gmail.com. WhatsApp and spoken-language claims were not added. [Desktop](qa/teacher-1440.png), [mobile](qa/teacher-390.png), [browser checks](qa/teacher-photo-results.json).

## Framework and local flow

- Next.js 15.5.28, React 19.3.1 and pnpm 11.20.0. Node is constrained to 24.13+ within major 24.
- Production `pnpm build` passed with no errors or warnings. `pnpm typecheck` generates route types before checking TypeScript, so it does not depend on a previous build directory.
- Full browser flow on the final production build passed invited mentor registration, actual MP4/ZIP uploads with progress, publishing, student registration, playback, seek, logout/reload/login resume, database completion and logout. Studio and student views fit 390/768/1440px. Zero browser errors/warnings. [Final flow](qa/launch-production-flow.json).
- Studio and student resource downloads preserve the filename and exact bytes. [Download checks](qa/launch-resource-downloads.json).
- Auth, student and studio screens load when opened. The memoized phone still responds to task taps and stops animated previews under reduced motion. [Motion check](qa/launch-phone-motion.json).
- All four certificate TrueType fonts are included in the PDF route’s function trace. Earlier PDF rendering and Unicode checks remain recorded in the design report.
- Private bridge/invitation values were not found in browser JS bundles. Local owner records were read-only checked: no accounts, lessons, files or progress records had been created. QA data was isolated in temporary directories.

## Convex implementation

The selected cloud backend is Convex database plus file storage. Named queries/mutations validate the private server bridge, opaque sessions, roles and ownership. Existing API/UI contracts and local SQLite data are retained. Video uploads go directly from browser to storage, with authenticated intents, checksum/size/type/signature validation and single-file claims. Local mode retains multipart uploads.

All **15 Convex domain/storage tests passed**, covering role/session guards, private drafts/notes, concurrency, progress, Q&A, certificate eligibility/idempotency, upload ownership/finalization and bounded signature reads. [Test results](qa/convex-tests.json).

Convex cloud functions have not been deployed or exercised against a connected real deployment. Hosted upload CORS, video seeking, cloud resume and certificate generation remain launch checks. Without a Convex URL, local development continues using SQLite even when a private bridge secret has been prepared; Vercel requires complete Convex configuration.

## Performance and hosting

Earlier Lighthouse default mobile performance score: **91/100**. LCP 0.9s, total blocking time 390ms, CLS 0.001. This local lab run predates the enrollment UI; performance has not been remeasured after that addition. [Summary](qa/lighthouse-summary.json), [full report](qa/lighthouse.json).

The owner requires $0 and chose Netlify Free instead of Vercel Hobby. Convex direct terminal sign-in is now verified for team natenael-ermias/project yoh-app-academy. Its subscription is null in the official billing endpoint, which the official dashboard maps to Free. The existing development backend is zealous-weasel-162; a separate Free production backend proficient-squirrel-944 was created and its schema/functions were deployed. No paid plans, auto recharge or purchased domains were enabled. Netlify still reports no CLI account token; its ticket remains pending, and direct terminal sign-in/status was requested.

[Convex/Vercel setup](VERCEL_DEPLOYMENT.md) records the required environment and hosted verification steps. [TODO_CONTENT.md](../TODO_CONTENT.md) tracks recordings, resources, approved prices and student projects. Docker configuration remains an alternative and has not been executed here.

## YO Tech branding

Updated public logos, page titles, account and certificate screens, footer, PDF issuer/author and certificate filename to YO Tech / YO Tech Academy / YO Tech LLC. The production build, route-aware typecheck and local browser checks passed; mobile fits 390px. Internal environment/session/storage identifiers retain compatibility with existing records.

## Two-semester package

Owner confirmed one mentorship program with two semesters at 3,000 ETB each, 6,000 ETB total. Added a shared pricing configuration and visible semester breakdown; removed the previous separate course prices. Package navigation, course dialogs, FAQ and enrollment call link use the confirmed offer. Production build and pnpm typecheck passed. Browser checks at 390/768/1440px passed without horizontal overflow or console errors/warnings. [Desktop](qa/package-1440.png), [mobile](qa/package-390.png), [pricing checks](qa/package-pricing.json). Semester dates, duration, topic allocation and payment/refund terms remain to be supplied.

## Light and dark themes

The sun/moon header control switches the homepage, account dialogs, student workspace, mentor studio and public certificate pages. Shared semantic colors keep fields, highlighted text, buttons and status messages readable in both themes. Video/code surfaces remain dark and the example phone app retains its own light design.

The initial theme follows the device setting; an explicit choice persists in browser storage, overrides later device changes and synchronizes across tabs. A small script applies the choice before hydration. Browser checks passed live device changes, reload/document navigation, cross-tab updates and clearing, invalid preferences, blocked storage, accessible action labels and Enter/Space activation with retained focus. No theme checks wrote to owner application data. [Theme-state checks](qa/theme-state.json).

Both themes passed homepage checks at 390/768/1440px and 34 account/studio/player/certificate screen checks without horizontal overflow or header intersections. Theme controls are at least 44px square. Sampled text contrast was at least 5.43:1 across 128 public and account checks. Production build passed; theme-state and public checks recorded zero browser errors or warnings, and account checks recorded zero React warnings or browser errors. [Public checks](qa/theme-public.json), [account checks](qa/theme-account.json), [dark desktop](qa/theme-home-dark-1440.png), [dark mobile](qa/theme-home-dark-390.png), [light mobile](qa/theme-home-light-390.png).

Two existing font-preload warnings can occur after a full document navigation from the homepage to a certificate with a warm font cache. Fresh homepage and certificate loads recorded none; both fonts loaded and rendered correctly in the warm case. These warnings remain recorded separately from theme errors. [Font diagnosis](qa/theme-font-preloads.json).

## Translucent navigation header

The sticky public header uses an 84% theme-colored background with a 16px backdrop blur, allowing a little underlying color to show during scrolling. Its text and controls stay fully opaque. Navigation colors preserve readability over darker content, and browsers without backdrop-filter support retain a solid background. Production pnpm build passed. Desktop and mobile scroll checks passed in light and dark themes, including mobile menu opening, Escape dismissal, restored focus and no horizontal overflow. [Browser checks](qa/header-glass.json), [light desktop](qa/header-glass-light-1440.png), [dark mobile](qa/header-glass-dark-390.png).

## Enrollment approval guards

The owner selected admin approval for access to the mentorship program. Convex now stores program enrollment separately from per-course activity. Students can request access; only admins can approve or revoke it. Public lesson metadata remains available, with video URLs, resources and chapters withheld from guests and unapproved students. Protected file, progress, notes and Q&A operations recheck approval. Certificate eligibility and new issuance require approval; previously issued certificates remain verifiable and downloadable by their owner.

All 20 Convex domain, storage and enrollment tests pass, including concurrent requests, approval-only access, direct file checks, revocation, timestamp idempotency and admin-only decisions. TypeScript checking passed. These are isolated in-memory Convex checks; no deployment or owner data was changed, and hosted behavior remains to be verified.

The combined suite passes **37 tests across six files**, covering Convex, local API behavior, row-preserving SQLite migration and hosted origin/configuration guards. The production build passes. Isolated browser QA passes request → pending → admin approval → student refresh/play → revocation → locked access, with zero protected requests before approval and direct file/progress denial after revocation. Both themes fit 390/1440px without unexpected browser errors or warnings. New enrollment buttons have 7.61:1 dark-theme contrast and 48px targets. [Tests](qa/enrollment-tests.json), [browser flow](qa/enrollment-browser.json), [contrast](qa/enrollment-contrast.json), [student mobile](qa/enrollment-request-mobile.png), [admin dark mobile](qa/enrollment-admin-dark-mobile.png).

Netlify configuration retains the pnpm workspace lockfile, Node 24, automatic Next.js adapter and all four certificate fonts. Missing cloud configuration fails closed on Vercel or Netlify. [Current free-hosting setup](NETLIFY_DEPLOYMENT.md), [mentor upload guide](MENTOR_UPLOADS.md).

The Convex storage adapter returns reusable bearer file URLs after a successful access check. Revoking enrollment blocks subsequent application/API requests and discovery of file URLs, but does not invalidate a raw storage URL already disclosed to a previously approved student. Previously downloaded copies also remain outside the application's control. Expiring media delivery or a separate authenticated media service has not been implemented; do not describe these approval guards as invalidating previously issued media URLs.

## Verified cloud backend

Both development and production pushes passed schema validation and strict Convex typechecking. Corrected the upload module to `fileStorage.ts`, since Convex rejects hyphens in module names. Queries now require finite, nonnegative, safe integer `requestTime` supplied by the private Next.js bridge; session/upload expiry therefore participates in query cache keys instead of reading the clock inside a query. All **40 tests across six files** pass. [Final backend checks](qa/backend-final-tests.json).

Actual development-cloud browser checks passed a playable **5 MiB** direct video upload, ZIP/PDF storage, publishing, locked metadata before approval, enrollment request/approval, playback/seek, private notes and resume after reload, original resource filenames and byte hashes, explicit certificate PDF/anonymous verification, and revocation with direct application-route denial. Local upload-route bodies stayed below 64 KiB. One expected browser network 403 from the intentional denial probes is recorded separately; no JavaScript exceptions or unexpected warnings occurred. The synthetic lesson was unpublished and its student revoked afterward; QA data remains only in development. [Cloud flow](qa/convex-cloud-flow.json), [cleanup](qa/convex-cloud-cleanup.json), [approved student](qa/convex-cloud-approved-mobile.png).

The production administrator email is yohansforex@gmail.com. Its generated login is saved in an ignored private workspace file with mode 600, never copied into QA evidence or displayed in chat. Production sign-in, admin dashboard/request access, logout and rejection of the old session passed; no synthetic production lessons were created. The owner SQLite database was checked read-only and contains no users, lessons, files, progress, notes, questions or certificates requiring migration. [Production admin check](qa/production-admin-check.json).

The local preview on port 3014 uses the production bridge. The ordinary `pnpm dev` environment remains attached to the separate development backend.

Automatic approval review rejected creation/grant of a production Convex deploy key to Netlify without specific credential-grant approval. No deploy key was created. The selected safer workflow deploys Convex through the existing authenticated local CLI and uploads locally built frontend/function artifacts; Netlify does not receive a Convex management/deploy credential or account token. Its application runtime will still require the private app bridge and configured production URL. The actual Netlify adapter build/public deployment remains unverified until the account connection is available.
