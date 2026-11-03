# YOH App Academy

A pnpm workspace containing the YOH Tech LLC academy website, student lesson player and mentor studio. Accounts, lesson uploads, per-user progress, timestamped notes and lesson Q&A use a real SQLite database and server-side file storage. Students can explicitly issue a completion certificate after finishing a course’s published lessons, download its PDF and share its public verification ID.

Use **Node.js 24.13 or newer** and **pnpm 11.20.0**. Run from this outer folder:

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

`pnpm start` runs the packaged production server on port 3002. This is a server application, not a static export. Production requires a Node host with persistent writable storage for the database and uploads.

The deployment files are instructions and source configuration; they do not establish that a public deployment or Docker run has taken place.

See [setup, environment variables and deployment](yoh-app-academy/README.md), [content still needed](yoh-app-academy/TODO_CONTENT.md), and [verification notes](yoh-app-academy/docs/verification.md).

A root [Dockerfile](Dockerfile) and [Compose configuration](compose.yaml) are included. Run Docker commands from this outer folder; the app README documents deployment, admin setup and backups.
