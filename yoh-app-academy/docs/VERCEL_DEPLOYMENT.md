# Deploy YO Tech Academy to Vercel with Convex

Updated 3 November 2026. The selected hosted backend is **Convex database and file storage**. Configuration and application adapters are prepared; a successful cloud deployment and its browser checks must be recorded before claiming publication. Local SQLite remains available for development without a Convex URL, even when a private server secret has been prepared. Vercel always requires a working Convex configuration.

Current handoff: the owner requires a **$0 budget** and has selected **Netlify Free + Convex Free** instead of a Vercel commercial launch. Use [the Netlify deployment guide](NETLIFY_DEPLOYMENT.md) for the current target; this document retains the optional Vercel configuration. No plan upgrades or paid services are authorized. Vercel CLI sign-in was rechecked successfully, but the active team remains Hobby and no academy project exists there. Cloud deployment is not yet verified. Administrator-approved program enrollment has now been implemented in both backends; hosted upload/playback and approval checks remain launch requirements.

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
corepack pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'corepack pnpm run build'
```

This publishes matching Convex functions and frontend code on subsequent Git deployments. It needs a deploy key; the configuration file does not provision one. [Official Convex/Vercel workflow](https://docs.convex.dev/production/hosting/vercel).

## Connect accounts and set environment values

1. Confirm Convex project/deployment access and the intended Vercel team/project. Vercel sign-in is already verified on this computer. Before a commercial launch, use a suitable Vercel plan; the connected team currently uses Hobby, whose policy limits it to personal, non-commercial projects. The owner deferred publication rather than changing plans. [Hobby policy](https://vercel.com/docs/plans/hobby).
2. Create the Convex production deployment. Generate a production deploy key with `deployment:deploy` permission, then add it to Vercel as **`CONVEX_DEPLOY_KEY`**, scoped only to Production.
3. Set these values in the indicated environment dashboards:

| Variable | Vercel | Convex |
| --- | --- | --- |
| `YOH_CONVEX_SERVER_SECRET` | Private random value of at least 32 characters | Exactly the same value |
| `YOH_MENTOR_INVITE` | Private production mentor invitation | Exactly the same value; required by Convex mentor registration |
| `YOH_APP_URL` | Exact public HTTPS origin | Not required |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Supplied public company contact | Not required |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Not required |

The build command supplies `NEXT_PUBLIC_CONVEX_URL`. For manual/local hosted-backend runs, configure `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` to the intended deployment URL. Avoid a production `CONVEX_URL` override in Preview: it takes precedence over the URL generated for that preview.

Keep `YOH_BUILD_DIR` unset on Vercel. `YOH_DATA_DIR` cannot persist records there. Enter private credentials through the provider dashboards or protected CLI input, never source files or chat. Do not give private keys a `NEXT_PUBLIC_` prefix.

Preview needs its own Convex Preview deploy key, matching default bridge/invitation variables and test data. Do not copy a production-only `YOH_APP_URL` into a different preview hostname without testing the origin guard. [Convex previews](https://docs.convex.dev/production/hosting/vercel#preview-deployments).

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
