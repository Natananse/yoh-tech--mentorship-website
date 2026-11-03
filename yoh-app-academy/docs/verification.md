# Revision checks

## pnpm setup verification — 3 November 2026

- Added a workspace manifest and forwarding commands so the outer source folder and the app folder both support pnpm.
- Migrated dependencies to the root `pnpm-lock.yaml` and removed the npm lockfile.
- Installed the workspace with `pnpm install --frozen-lockfile --network-concurrency=1` using Node.js 24.18.0 and pnpm 11.20.0. The single connection allowed the large compiler download to finish on this connection.
- `pnpm typecheck` and `pnpm build` passed from the outer source folder; the static export includes `yoh-app-academy/out/index.html`.
- `pnpm dev --hostname 127.0.0.1` started successfully. The homepage returned HTTP 200 with the expected academy title and content. Stopped the test server afterward.

## Existing website checks

- Next.js production build and TypeScript validation passed.
- Rendered at 1440px and 390px viewport widths using a responsive iframe harness. No horizontal page overflow in either; mobile student workspace also fits.
- Verified Expo filter settles to the two Expo courses after the grid animation.
- Verified mobile menu opening/closing and navigation to the free lesson and dashboard.
- Verified video playback reports a 48-second duration, readyState 4 and advancing currentTime.
- Verified transcript panel content and lesson-complete pressed state; the completion state reappears in the student workspace.
- All six course preview clips are 3-second muted local videos. Media assets total under 1 MB, with WebP stills, deferred video loading and a roughly 155 kB first-load JS bundle.
- Reviewed the actual classroom screenshot, six unique course images and generated sample mentor portraits.
- Reduced-motion safeguards are implemented in MotionConfig, animation hooks and CSS; no formal emulated reduced-motion or Lighthouse run was performed.
- Enrollment, payments, real mentor messaging and production upload/auth services are not connected. Sample people, prices, curriculum and feedback are labelled.
