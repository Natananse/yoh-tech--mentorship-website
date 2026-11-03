# Verification — 3 November 2026

Current result: working local production preview at http://127.0.0.1:3014. The owner selected **keep the local preview until hosting is ready**. No Vercel/Convex deployment is claimed.

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

Final Lighthouse default mobile performance score: **91/100**. LCP 0.9s, total blocking time 390ms, CLS 0.001. This is a local lab result, not a guarantee for a future host/network. [Summary](qa/lighthouse-summary.json), [full report](qa/lighthouse.json).

Vercel CLI authorization was verified. The connected team uses Hobby; the owner deferred public hosting rather than changing plans. Convex account creation/connection was reported by the owner, but CLI device approval expired and no deployment URL was verified. No projects, deployments or paid resources were created here.

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
