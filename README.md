# YO Tech Academy

A pnpm workspace containing the YO Tech LLC academy website, student lesson player and mentor studio. Production accounts, lesson uploads, per-user progress, timestamped notes and lesson Q&A use the existing Convex database and file storage. Local development without Convex retains SQLite and disk storage. Students can explicitly issue a completion certificate after finishing a course’s published lessons, download its PDF and share its public verification ID.

The current hosting target is **Vercel project `yo-app-academy`**, serving the app directly at **https://yo-app-academy.vercel.app**. The owner deleted the Netlify project; Netlify is no longer the application host. Production deployment `dpl_5hDYmHrDLYoNHpMTgx4kocSxAiQ7` is ready. The cleaned build, private runtime configuration, public APIs, responsive layout and existing administrator login/studio/logout checks passed. See [live Vercel evidence](yoh-app-academy/docs/qa/vercel-public-browser.json). The former `yoh-app-academy.vercel.app` address keeps its HTTP 307 redirect to the YO address.

The existing Convex production backend is reused, so this hosting migration does not move or recreate accounts, recordings or learning records. No Convex deploy key or account token is required or granted to Vercel. Billing settings remain unchanged; this migration does not authorize a paid upgrade.

Use **Node.js 24.13 or newer within major 24** and **pnpm 11.20.0**. Run from this outer folder:

```bash
corepack enable
pnpm install --frozen-lockfile
cp -n yoh-app-academy/.env.example yoh-app-academy/.env.local
pnpm dev
```

The copy command preserves any existing `.env.local`, including the configured local invitation. Open http://localhost:3002. For a new setup, set `YOH_APP_URL` in `.env.local` to the exact browser origin, including the port. Supply a private `YOH_MENTOR_INVITE` to enable invited mentor registration.

The supplied public contact address is `yohansforex@gmail.com`; set `NEXT_PUBLIC_CONTACT_EMAIL` before building. Never put the invitation code or administrator password in a public environment variable.

```bash
pnpm typecheck
pnpm build
pnpm start
```

`pnpm start` runs the packaged production server on port 3002. This is a server application. Vercel uses the existing Convex backend; a persistent Node host with SQLite remains a local/self-hosted alternative. See [Vercel deployment](yoh-app-academy/docs/VERCEL_DEPLOYMENT.md) for the app root, Node 24, Corepack/pnpm commands and required runtime settings. The [Netlify guide](yoh-app-academy/docs/NETLIFY_DEPLOYMENT.md) is archived historical context.

See [setup, environment variables and deployment](yoh-app-academy/README.md), [content still needed](yoh-app-academy/TODO_CONTENT.md), and [verification notes](yoh-app-academy/docs/verification.md). Historical Netlify QA is not proof of the new Vercel deployment.

A root [Dockerfile](Dockerfile) and [Compose configuration](compose.yaml) are included. Run Docker commands from this outer folder; the app README documents that alternative, admin setup and backups.
