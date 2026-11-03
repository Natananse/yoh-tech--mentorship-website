# Deploy YO Tech Academy to Vercel with Convex

Updated 3 November 2026. The app is live at https://yo-tech-academy.netlify.app using **Convex database and file storage**. Its production backend is `proficient-squirrel-944`; the full development-cloud content flow and live Netlify API/admin/browser checks passed. A Vercel deployment has not been verified. Local SQLite remains available for development without a Convex URL; Vercel requires complete Convex configuration.

The owner requires a **$0 budget** and selected **Netlify Free + Convex Free**. Use [the Netlify deployment guide](NETLIFY_DEPLOYMENT.md) for the current host. This document prepares an optional Vercel migration; no plan upgrades or paid services are authorized. The Vercel team was last checked on Hobby. Vercel restricts Hobby to non-commercial personal use, so this paid academy requires a suitable paid plan before a Vercel commercial launch. [Vercel policy](https://vercel.com/docs/limits/fair-use-guidelines).

## Project settings

Import `Natananse/yoh-tech--mentorship-website`, production branch `main`:

| Setting | Value |
| --- | --- |
| Root Directory | `yoh-app-academy` |
| Framework Preset | Next.js |
| Node.js Version | `24.x` |
| Recommended `engines.node` range | `>=24.13.0 <25` |
| Package manager | `pnpm@11.20.0`, pinned in `packageManager` |
| Install Command | `corepack pnpm install --frozen-lockfile` |
| Output Directory | Next.js default |

Keep the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Enable access outside the Root Directory if Vercel requests it for workspace dependencies. Set `ENABLE_EXPERIMENTAL_COREPACK=1` for Production and Preview. [Monorepos](https://vercel.com/docs/monorepos), [package managers](https://vercel.com/docs/package-managers), [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

The app's `vercel.json` supplies this build command:

```bash
corepack pnpm run build
```

This builds the frontend against the existing Convex production backend. Backend changes are deployed separately through the authenticated local Convex CLI. No Convex deploy key or account token is required or granted to Vercel by this workflow.

## Connect accounts and set environment values

1. Confirm access to the intended Vercel team/project and a suitable commercial hosting plan. The current $0 instruction does not authorize a paid upgrade. [Hobby policy](https://vercel.com/docs/plans/hobby).
2. Reuse the existing Convex production deployment at `https://proficient-squirrel-944.eu-west-1.convex.cloud`. Keep its matching runtime bridge/invitation values; do not create another backend or a deploy key for this migration.
3. Set these values in the indicated environment dashboards:

| Variable | Vercel | Convex |
| --- | --- | --- |
| `CONVEX_URL` | Existing production deployment URL | Existing public URL |
| `NEXT_PUBLIC_CONVEX_URL` | Same production URL | Existing public URL |
| `YOH_CONVEX_SERVER_SECRET` | Private random value of at least 32 characters | Exactly the same value |
| `YOH_MENTOR_INVITE` | Private production mentor invitation | Exactly the same value; required by Convex mentor registration |
| `YOH_APP_URL` | Exact public HTTPS origin | Not required |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Supplied public company contact | Not required |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Not required |

Set both Convex URL variables explicitly to the same intended backend; the build does not inject them. `CONVEX_URL` takes precedence. Production must use the existing production deployment, while previews must use an isolated test deployment.

Keep `YOH_BUILD_DIR` unset on Vercel. `YOH_DATA_DIR` cannot persist records there. Enter private credentials through the provider dashboards or protected CLI input, never source files or chat. Do not give private keys a `NEXT_PUBLIC_` prefix.

Leave automatic previews disabled until an isolated test backend and its matching runtime variables are configured. Deploy that backend locally rather than granting Vercel a backend deploy credential. Set each preview's exact trusted `YOH_APP_URL`; do not copy the production origin into a different preview hostname.

## Upload and access behavior

The mentor studio requests an authorized upload intent, uploads the raw file directly to Convex with progress/cancellation, then finalizes it through a small API request. The server verifies ownership, size, MIME type, SHA256 and file signature before attaching it. Video remains limited to 250 MB; PDF/ZIP resources to 25 MB. A generated upload URL lasts one hour, and Convex's upload POST has a **two-minute timeout**; this flow is not resumable. [Convex upload limits](https://docs.convex.dev/file-storage/upload-files).

File routes check lesson access before redirecting the browser to Convex. Direct Convex file URLs are reusable bearer URLs once disclosed; unpublished URLs are released only to the owning mentor/admin. Replacing a video deletes the prior stored video. Never route large upload/download bodies through Vercel Functions, whose payload limit is 4.5 MB. [Convex file access](https://docs.convex.dev/file-storage/serve-files), [Vercel limits](https://vercel.com/docs/functions/limitations).

## Validate and publish

- Run `pnpm typecheck`, the Convex domain/storage tests and `pnpm build`. Keep a maintained security-patched Next.js/React release; do not bypass vulnerable-version deployment checks.
- Confirm `public/fonts/*-certificate.ttf` is included in the certificate route's function trace. Public images/fonts and the teacher portrait must remain in deployment uploads.
- Deploy a Preview. Test register/login/logout, a mentor video larger than 4.5 MB, PDF/ZIP upload and download filename, playback/seek, account resume/completion, private notes, Q&A and certificate PDF/verification. Confirm draft file URLs are denied to guests and other accounts.
- Recheck 390px navigation, the teacher name/photo/contact and public course content. Promote only the tested version, verify the HTTPS domain and record the actual deployment URL/status.
- Bootstrap the owner/admin against the intended Convex deployment using the existing setup command, then remove the bootstrap password. Upload the real lesson recordings through the studio.

`.vercelignore` excludes local environment files, SQLite/runtime data, caches and QA screenshots while retaining `public/media/` and `public/fonts/`. These exclusions do not replace provider-side access controls or backups.
