# Deploy YO Tech Academy directly to Vercel

Updated 4 November 2026. The owner deleted the Netlify project and selected **Vercel project `yo-app-academy`** as the application host. The live direct address is **https://yo-app-academy.vercel.app**. Production deployment `dpl_5hDYmHrDLYoNHpMTgx4kocSxAiQ7` is **READY**. The owner approved the two sensitive Production-only application variables; deployment, public API and existing administrator browser checks passed. [Deployment evidence](qa/vercel-deployment.json), [API checks](qa/vercel-public-api.json), [browser checks](qa/vercel-public-browser.json). Historical Netlify results do not establish Vercel readiness.

Reuse the existing Convex production deployment, `proficient-squirrel-944`, for database and file storage. This frontend migration does not create another backend or move/recreate existing accounts, recordings, enrollment and learning records. Billing settings remain unchanged; this workflow does not authorize a plan upgrade, paid add-on or domain purchase.

## Project and domain settings

The repository is `Natananse/yoh-tech--mentorship-website`, with production branch `main`.

| Setting | Value |
| --- | --- |
| Vercel project | `yo-app-academy` |
| Root Directory | `yoh-app-academy` |
| Framework Preset | Next.js |
| Node.js Version | `24.x` |
| `engines.node` | `>=24.13.0 <25` |
| Package manager | `pnpm@11.20.0`, pinned in `packageManager` |
| Install Command | `corepack pnpm install --frozen-lockfile` |
| Build Command | `corepack pnpm run build` |
| Output Directory | Next.js default |

The app’s `vercel.json` supplies the framework/install/build commands. Keep the root `pnpm-lock.yaml` and `pnpm-workspace.yaml`, and include source files outside the Root Directory in the build so the workspace files are available. Set `ENABLE_EXPERIMENTAL_COREPACK=1` for the intended Vercel deployment environment.

The former project-level forwarding rule to Netlify is disabled, and the YO hostname serves the tested Vercel build directly with HTTP 200. Keep the former `yoh-app-academy.vercel.app` hostname’s HTTP 307 redirect to `yo-app-academy.vercel.app`, preserving paths and query strings. Do not redirect the new hostname back to the deleted Netlify site.

The current source no longer includes the Netlify adapter, `netlify.toml` or Netlify-specific head bootstrap. Do not use the archived Netlify build or artifact-upload sequence.

## Production environment

Configure values in the Vercel **Production** environment before building/publishing. Private runtime values must be supplied through approved protected provider input; no secret value belongs in source, logs or chat.

| Variable | Vercel Production | Existing Convex production |
| --- | --- | --- |
| `CONVEX_URL` | `https://proficient-squirrel-944.eu-west-1.convex.cloud` | Existing deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | Same production URL | Existing deployment URL |
| `YOH_CONVEX_SERVER_SECRET` | Existing private application bridge secret, at least 32 characters | Exactly the same existing value |
| `YOH_MENTOR_INVITE` | Existing private mentor invitation | Exactly the same existing value |
| `YOH_APP_URL` | `https://yo-app-academy.vercel.app` | Not required |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `yohansforex@gmail.com` | Not required |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Not required |

Set both Convex URLs explicitly to the same intended backend; `CONVEX_URL` takes precedence. `NEXT_PUBLIC_` values are embedded at build time, so changing them requires a rebuild. Runtime bridge/invitation values must match the existing backend; do not rotate them merely to move the frontend. The canonical `YOH_APP_URL` must match the browser origin so authenticated mutations and certificate links use the Vercel address.

Do not set `YOH_DATA_DIR` as a production persistence solution. SQLite/disk storage is for the persistent local/Node/Docker alternative; Vercel requires Convex and fails closed if that configuration is missing. Leave `YOH_BUILD_DIR` unset on Vercel. Vercel manages the runtime port and hostname.

The existing administrator account remains in Convex. Reuse it to validate the migration; do not create another administrator or retain bootstrap passwords in Vercel environment settings.

## Backend credentials and previews

Vercel builds the Next.js frontend against the existing backend. **No `CONVEX_DEPLOY_KEY`, Convex account token or CLI credential is required or granted to Vercel.** Application bridge/invitation values permit the app’s protected operations; they do not grant backend deployment access.

Backend changes remain a separate operation through the authenticated local Convex CLI, targeting the intended deployment. A frontend-only hosting migration does not require redeploying or reseeding that backend. Keep account credentials in the local CLI store.

Leave automatic previews disabled until an isolated test backend and matching runtime values/origin are configured. Do not connect arbitrary preview builds to production data. Use the exact trusted preview origin for that preview’s `YOH_APP_URL` and keep backend deployment credentials local.

## Build, deploy and verify

1. Confirm the intended Vercel project/root/runtime settings and matching approved application runtime configuration. Do not change billing settings as part of this migration.
2. Run `pnpm typecheck`, the relevant existing tests and `pnpm build`. Keep the maintained Next.js/React versions and workspace lockfile; do not bypass vulnerable-version deployment checks.
3. Deploy the application source with the configured Corepack/pnpm build. Retain `public/media/`, `public/fonts/` and all four certificate TTF files in the generated certificate function trace. `.vercelignore` excludes private environment files, local databases, caches and QA screenshots; it does not replace provider access controls.
4. Wait for the actual deployment to be ready, then verify the YO hostname serves it directly without the old Netlify redirect, comment/badge or head bootstrap. Record the actual deployment ID/status rather than treating a local build as publication.
5. Run read-only hosted checks: homepage/package/footer at 375/768/1280px, uppercase YO logos, teacher portrait/sample media, light-only appearance, existing administrator UI login, studio/enrollment list access and logout. Do not create synthetic production users, lessons or certificates for this migration.
6. Confirm runtime API access, secure session cookies and logout invalidation. Validate the legacy hostname and deep-link/query redirects separately. Mark hosted functional checks passed only after their actual results are recorded.

The full development-cloud content flow has earlier evidence, but production uploads on the new Vercel host still need owner-authorized verification. Use an isolated development backend for synthetic registration/upload/enrollment/playback/notes/certificate regression tests; keep production content changes explicit.

## Upload and access behavior

The mentor studio obtains an authorized upload intent, sends the file directly from the browser to Convex, then finalizes through a small app API request. The app validates ownership, size, MIME type, checksum and file signature. Videos remain limited to 250 MB; PDF/ZIP resources to 25 MB. Direct uploads have progress/cancellation and a two-minute request timeout, and are not resumable.

Keep large video/resource bodies out of Vercel Functions. Approved students and mentors/admins obtain file access through authorized app routes; drafts remain owner/admin-only. A released raw Convex storage URL is a reusable bearer URL: revocation blocks new application requests but does not invalidate a copied storage URL. Existing browser resource downloads retain original filenames.

Official references: [Vercel monorepos](https://vercel.com/docs/monorepos), [package managers](https://vercel.com/docs/package-managers), [Node.js runtime versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [environment variables](https://vercel.com/docs/environment-variables), [Convex production deployments](https://docs.convex.dev/production), [Convex file uploads](https://docs.convex.dev/file-storage/upload-files).

The [Netlify guide](NETLIFY_DEPLOYMENT.md) is archived historical context. Historical QA reports remain unchanged. The dedicated Vercel reports above record this deployment’s checks.
