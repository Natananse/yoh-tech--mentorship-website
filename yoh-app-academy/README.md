# YO Tech Academy

The YO Tech LLC academy application uses Next.js 15, React 19, TypeScript and pnpm. It includes the academy page, a chapter-based player, mentor uploads, saved progress, private timestamped notes, lesson Q&A and verifiable completion certificates. Convex stores production account and learning records and uploaded files. Local development without a Convex URL retains the existing SQLite and disk storage. The current design uses Bricolage Grotesque, Inter and JetBrains Mono with cobalt actions, paper surfaces and limited yellow highlights.

Use the sun/moon button in the header to switch between light and dark themes. The site follows the device setting until a choice is made, then remembers that choice in the browser and synchronizes it across tabs. The preference applies before the first paint, including on account and certificate pages. When browser storage is unavailable, switching still works for the current tab.

## Requirements and local setup

- Node.js **24.13 or newer**. The server uses the built-in `node:sqlite` module.
- pnpm **11.20.0**, selected by the `packageManager` field.
- A writable storage directory. An internet connection is needed for the first dependency installation.

Commands work from the outer workspace or this app folder. From the outer workspace:

```bash
corepack enable
pnpm install --frozen-lockfile
cp -n yoh-app-academy/.env.example yoh-app-academy/.env.local
pnpm dev
```

When running from this app folder, use `cp -n .env.example .env.local` instead. These commands preserve an existing environment file; do not overwrite the configured local invitation or other private settings. Open http://localhost:3002. Press Ctrl+C to stop the development server. If using another port or hostname, update `YOH_APP_URL` to match the browser's exact origin before starting.

Convex is the selected production backend. Without a Convex URL, local development uses SQLite even when a server secret has been prepared. Vercel requires a configured Convex URL and matching private server secret; local SQLite is disabled there. See [Convex and Vercel setup](docs/VERCEL_DEPLOYMENT.md).

The current hosting choice is **Netlify Free + Convex Free**, within a strict $0 budget. No paid plan or automatic recharge is authorized. Follow [Netlify deployment](docs/NETLIFY_DEPLOYMENT.md); the free plans have usage limits, and a cloud deployment must still be verified. Hosted Netlify execution also requires Convex and disables the local SQLite fallback.

## Environment variables

Create `.env.local` from `.env.example` only if it does not already exist, then edit the needed values. Exported environment variables take precedence over `.env.local`, which takes precedence over `.env`.

| Variable | Purpose |
| --- | --- |
| `YOH_APP_URL` | Canonical browser origin, such as `http://localhost:3002` locally or `https://academy.example.com` in production. Mutating API requests validate this origin. |
| `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL. The public URL is safe to expose; server RPC calls use the private bridge secret. The Convex CLI sets `NEXT_PUBLIC_CONVEX_URL` during Vercel builds. |
| `YOH_CONVEX_SERVER_SECRET` | Private random server secret, at least 32 characters. Set the same value in Next.js and its matching Convex deployment. Never use `NEXT_PUBLIC_` for this value. |
| `CONVEX_DEPLOY_KEY` | Production- or Preview-scoped CI deploy key, stored privately in Vercel. The build wrapper deploys matching backend functions before publication. |
| `YOH_DATA_DIR` | Persistent directory containing `academy.sqlite` and `uploads/`. Defaults to `.data` in the app. Relative paths resolve from the app directory; use an absolute persistent path in production. |
| `YOH_MENTOR_INVITE` | A private, long invitation code required to register a mentor account. Leave empty to disable new mentor registrations. Student registration remains available. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public company contact address. Use the supplied `yohansforex@gmail.com`. Embedded in the client at build time; set it before `pnpm build` and rebuild when changing it. |
| `YOH_ADMIN_EMAIL` | Email used by the one-time admin setup command. An existing account with this email is promoted; otherwise a new admin account is created. |
| `YOH_ADMIN_NAME` | Name for a new admin account. |
| `YOH_ADMIN_PASSWORD` | Password for a new admin account, 10–256 characters. Remove it from the environment file after provisioning. |
| `YOH_BUILD_DIR` | Optional Next.js output directory for isolated development or CI builds. Default `.next`. Use the same value when building and starting. Leave unset for the supplied Docker build. |
| `PORT` | Production server port. Defaults to `3002`; `pnpm start --port 3004` overrides it. |
| `HOSTNAME` | Production bind address. The startup script defaults to `0.0.0.0`; `pnpm start --hostname 127.0.0.1` overrides it. |

Generate an invitation value locally if needed:

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

Keep `.env.local`, the database and uploaded files outside source control. Only the public contact address uses a `NEXT_PUBLIC_` variable.

## Accounts and the learning flow

See the [mentor upload guide](docs/MENTOR_UPLOADS.md) for first-time mentor registration, exact studio steps, accepted files and the current lesson-access behavior.

1. Register a student account, or register as a mentor using the configured invitation code.
2. As a mentor, open the studio, create a draft, choose its course, and upload a video and optional resources.
3. Add duration/chapter details and publish after the video is attached. Drafts are visible only to their owner and admins.
4. A student requests enrollment from **My learning**. An administrator approves or revokes access in the studio’s **Student enrollment** section. Approval covers the mentorship program; it does not process a payment. Approved students can watch published lessons, resume from the last saved position and mark them complete. Position and completion are stored per account in the database and survive logout and another browser session.
5. Sign out to end the current session. Session cookies are HttpOnly and become Secure when the canonical origin uses HTTPS.

The mentor studio also shows real unique student viewers and lesson completions. Empty activity is shown as an empty state rather than fabricated counters.

## Notes, questions and certificates

- **Notes:** signed-in learners can save private notes at the current video timestamp. Clicking a note’s timestamp seeks to that point. Notes persist in the account database.
- **Q&A:** signed-in learners can post a lesson question, optionally with a timestamp. The lesson’s mentor or an admin can reply. Questions and replies are stored with the lesson and visible to signed-in learners who can access it.
- **Certificates:** the student workspace enables **Create certificate** only after every currently published video lesson in that course is complete. Creation requires an explicit click; completion alone never issues a certificate.
- **PDF and verification:** the recipient or an admin can download the generated PDF. Anyone with the verification ID can open `/verify/[id]` to see the recipient name, course, issue date and published-lesson count. The public page does not expose email or account IDs, and invalid certificate IDs return HTTP 404.

A certificate records the published lesson count when it was issued. It is a YO Tech Academy course-completion record, not a claim of external accreditation. Set `YOH_APP_URL` correctly so PDF verification links point to the deployed application. Certificate font files are included with the packaged server; no external PDF service is required.

Public registration cannot assign the admin role. To create an admin, fill the `YOH_ADMIN_*` variables in `.env.local`, then run:

```bash
pnpm setup-admin
```

The command loads the app's `.env.local` and `.env` itself. It preserves values already exported in the shell and works from either workspace folder. Remove the bootstrap password afterward. Restart the app after changing runtime settings.

## Uploads and storage

- Video: **MP4 or WebM, up to 250 MB per file**.
- Resources: **PDF or ZIP, up to 25 MB per file**, with up to 20 resources per lesson.
- Both the client and server validate type and size. Convex mode uses a short-lived direct upload URL, browser upload progress and a server-verified upload intent. Actual storage metadata, checksum, file signature and ownership are checked before attachment. Large files never pass through a Vercel Function. Local mode retains multipart uploads.
- Convex video access checks run before redirecting to storage. Published recordings require approved student enrollment or a mentor/admin account; drafts remain restricted to their owner/admin. Shared storage URLs grant bearer access once released, so revocation blocks fresh application requests but cannot invalidate a copied raw storage URL. Resources download in the browser with their original filenames. Hosted playback, range support and download CORS must be verified against the selected deployment.
- Convex keeps cloud data across Vercel redeployments. For the local/Docker alternative, upload bytes and SQLite data must survive process/container restarts; do not use an ephemeral data directory.
- Convex direct uploads have a two-minute request timeout and are not resumable in this implementation. For the local/Docker alternative, allow multipart overhead in the proxy and provision enough memory for the bounded upload parser.

The supplied free lesson and example course/mentor content are explicitly marked where appropriate. Upload your recorded lessons through the studio. See [TODO_CONTENT.md](TODO_CONTENT.md) for every content item still required; sample material must not be presented as verified student or mentor claims.

## Production build and start

```bash
pnpm typecheck
pnpm build
pnpm start
```

The build creates a Next.js standalone server and packages `public/` and static assets, including local fonts. The workspace may place the entry point at `.next/standalone/yoh-app-academy/server.js`; `pnpm start` resolves the correct location automatically. It also loads environment files and resolves the data directory against the source app directory.

Stop the development server before building into the same `.next` directory. For independent test builds, set `YOH_BUILD_DIR` to a different directory for both build and start.

For the selected free launch, follow [NETLIFY_DEPLOYMENT.md](docs/NETLIFY_DEPLOYMENT.md) and configure Convex before deploying. [VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) retains the optional Vercel settings. Account authorization and hosted end-to-end verification are required; a successful local build alone does not establish a public deployment.

For the alternative persistent Node/Docker deployment, deploy the Node server behind an HTTPS reverse proxy. Configure `YOH_APP_URL` to the HTTPS origin and attach a persistent disk for `YOH_DATA_DIR`. Run one application instance against this local SQLite/storage directory. This implementation is not suitable for a static host or an ephemeral/serverless filesystem; a distributed deployment needs a shared database and object-storage adapter first.

## Docker deployment

The Dockerfile and Compose file live in the outer workspace. They are configured to build with Node 24 and pnpm 11.20.0 and run the packaged standalone server as the `node` user; Docker execution has not been verified here.

From the outer workspace, after creating and editing `yoh-app-academy/.env.local`:

```bash
docker compose --env-file yoh-app-academy/.env.local up --build -d
```

Compose exposes port `3002` and mounts the named `academy-data` volume at `/app/data`. To select a different host port, set `YOH_PORT` and update `YOH_APP_URL` accordingly. A real public URL still requires a Node-capable host, DNS and HTTPS; these files do not publish a website by themselves.

To provision the admin inside the container, first set the bootstrap variables in `.env.local`, then run:

```bash
docker compose --env-file yoh-app-academy/.env.local run --rm --no-deps academy node yoh-app-academy/scripts/setup-admin.mjs
```

Remove `YOH_ADMIN_PASSWORD` from the file and recreate the service so the runtime no longer retains it:

```bash
docker compose --env-file yoh-app-academy/.env.local up -d --force-recreate
```

`NEXT_PUBLIC_CONTACT_EMAIL` is passed as a build argument by the Compose command above. Rebuild when changing it. Runtime secrets are loaded from the environment file and are excluded from the image build context.

## Backup and restore

Back up the **entire data directory**, including SQLite auxiliary files if present and `uploads/`. Stop all app processes using the directory before copying it, then restart them. Store backups outside the web root and the repository.

For a normal Node deployment, after stopping the service:

```bash
tar -czf academy-backup.tar.gz -C /absolute/path/to/academy-data .
```

For the supplied Compose deployment, from the outer workspace:

```bash
docker compose stop academy
docker compose run --rm --no-deps --entrypoint tar academy -C /app/data -czf - . > academy-backup.tar.gz
docker compose start academy
```

To restore, stop the app, extract the archive into the intended empty data directory or volume, preserve ownership for the runtime user, then restart. Restoring only `academy.sqlite` without the associated uploads leaves lesson files unavailable.

## Source guide

| Location | Purpose |
| --- | --- |
| `app/page.tsx` | Existing page/view integration and course dialogs |
| `components/academy-homepage.tsx` | Hero, featured course, catalog and public page navigation |
| `components/lesson-player.tsx` | Video player, captions, chapters, progress, timestamped notes and Q&A |
| `components/academy-account.tsx` | Registration, sign-in, student workspace and certificate issuance |
| `components/academy-studio.tsx` | Mentor/admin drafts, uploads, publishing and lesson analytics |
| `components/academy-sections.tsx` | Supporting public sections and footer |
| `lib/academy-data.ts` | Existing course catalog data |
| `lib/platform-types.ts` | Shared account, lesson, progress, discussion, analytics and certificate types |
| `lib/server/` | Async local SQLite adapter, Convex server bridge, auth, files, discussion, certificates and PDF generation |
| `convex/` | Validated cloud schema, named domain functions, file upload intents and permission checks |
| `app/api/` | Auth, lessons, files, progress, analytics, notes, Q&A and certificate endpoints |
| `app/verify/[id]/` | Public completion verification and invalid-ID 404 page |
| `app/design-tokens.css` | Shared color, typography and spacing tokens |
| `app/lesson-player.css`, `app/academy-account.css` | Player and account/studio layouts |
| `public/` | Local fonts, course assets and clearly marked sample media |
| `scripts/` | Admin setup and standalone server packaging/startup |

[Verification notes](docs/verification.md) record performed checks. Docker image execution must be verified on a host with access to a Docker engine; a local build or source review alone does not establish a public deployment.
