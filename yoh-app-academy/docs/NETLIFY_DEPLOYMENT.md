# Netlify Free + Convex Free deployment

The selected launch budget is $0. Use an existing or new **Free** Netlify team and **Free** Convex project, the supplied `netlify.app` domain, and no paid add-ons, upgrades, domain purchases, or auto recharge. Convex production is now deployed at https://proficient-squirrel-944.eu-west-1.convex.cloud; development uses zealous-weasel-162. The public Netlify website is not yet deployed. Netlify CLI authorization is still unavailable in the agent environment.

## Repository and site settings

The root `netlify.toml` installs/builds from the repository root so the shared `pnpm-lock.yaml` and `pnpm-workspace.yaml` are available. In Netlify Build settings use:

| Setting | Value |
| --- | --- |
| Base directory | Empty / repository root |
| Package directory | `yoh-app-academy` |
| Production branch | `main` |
| Build command | From root `netlify.toml` |
| Publish directory | `yoh-app-academy/.next` |
| Functions directory | Leave automatic; the Next.js adapter generates it |

Package directory is a site setting, not a TOML setting. When using the CLI from the repository root, pass `--filter yoh-academy` (the app package name) or `--filter yoh-app-academy` (its path). CLI selection does not persist the Netlify UI build setting. The configured build command, `pnpm --dir yoh-app-academy build`, builds Next.js only. Backend deployment is a separate authenticated local operation. A CLI publication must explicitly use `--prod --context production`; the CLI's default deploy context is `dev`.

Node 24 and pnpm 11.20.0 are already selected by the repository. `PNPM_FLAGS=--shamefully-hoist` follows Netlify's Next.js/pnpm requirement. The automatic OpenNext adapter supports Next.js 15; do not install/pin the legacy Next.js runtime. Keep the existing standalone output and certificate tracing. The TOML also includes the four certificate TTF assets. Do not deploy `.next` as a static-only folder or add an SPA fallback rewrite: API routes and SSR need the adapter-generated functions.

## Prepare private environment values

Set runtime variables through the **Netlify UI, CLI, or API**, never in committed TOML. Variables in TOML are build-only. On Free, leave the default availability to all scopes; choosing granular scopes is a paid-plan feature. Keep these values private:

| Variable | Netlify | Convex production |
| --- | --- | --- |
| `CONVEX_URL` | Exact production Convex deployment URL, available to build and functions | Deployment's existing public URL |
| `NEXT_PUBLIC_CONVEX_URL` | The same production URL, available to build and functions | Deployment's existing public URL |
| `YOH_CONVEX_SERVER_SECRET` | At least 32 random characters | Identical value |
| `YOH_MENTOR_INVITE` | Private mentor invitation | Identical value |
| `YOH_APP_URL` | Exact final HTTPS site origin | Not required |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `yohansforex@gmail.com` | Not required |

Set both Convex URL variables explicitly; no build wrapper injects them. They must identify the same production deployment, since `CONVEX_URL` takes priority. Keep `YOH_BUILD_DIR` unset. Local SQLite and `.data` are not hosted persistence. Missing Convex configuration fails closed on Netlify rather than creating a local database.

Do not create or grant a `CONVEX_DEPLOY_KEY` for this workflow, and do not send a Convex CLI/account access token to Netlify. The matching application bridge secret lets the running academy call its protected backend functions; it does not grant backend deployment access. Git/CI automatic backend deployment is not configured. Any future grant of backend deployment credentials to a hosting or CI provider requires specific approval.

Create/promote the administrator once with `pnpm setup-admin` against the production Convex URL and matching bridge secret. Use a private local environment for admin credentials; no admin password belongs in this document or the repository. Admins approve student enrollment; invited mentors/admins upload lesson videos/resources in Mentor Studio.

## Manual launch workflow

1. Verify the selected Convex and Netlify accounts remain Free. Use the already authenticated local Convex CLI to select/confirm this project's production deployment, set its application bridge/invite values through the authorized local administration workflow, and deploy backend functions locally with `pnpm --dir yoh-app-academy exec convex deploy`. Confirm the target before publishing. The account credential stays in the local CLI store.
2. Prepare an isolated source copy under `/tmp` so deployment builds do not replace the user's running `.next`. Exclude owner `.data`, existing `.next*` output, local environment files, and credential stores. Supply the explicit production URLs and application environment values privately, using the same values configured for Netlify functions.
3. From the isolated workspace root, with the intended Netlify site linked/selected, run `netlify build --context production --filter yoh-academy`. This runs the Next.js build and automatic OpenNext adapter. Inspect the generated functions and certificate fonts; keep these completed artifacts for the next step.
4. Upload those completed artifacts with `netlify deploy --no-build --prod --context production --filter yoh-academy`. Use the same isolated workspace and selected site. The `--no-build` flag prevents an extra build; Next.js functions and adapter output must be included with the static assets.
5. Run the hosted checks below before sharing the public URL. Later application changes use this manual sequence until a separately approved automation arrangement exists. Uploading lesson content in Mentor Studio does not require a new deployment.

## Origins and previews

Production uses explicit `YOH_APP_URL`, or Netlify's documented runtime `URL`. The server trusts these deployment settings and never trusts forwarded headers to establish its allowed origin. Netlify documents `SITE_ID`, `SITE_NAME`, and `URL` for function runtime; `NETLIFY`, `CONTEXT`, and `DEPLOY_PRIME_URL` are build variables. Automatic preview origins are therefore not assumed. Leave automatic Deploy Previews/branch deploys disabled for this initial production-only setup. Before enabling them, use an isolated Convex preview deployment and explicitly configure its trusted runtime origin, or carry the trusted non-secret build URL into a generated server configuration. This does not authorize supplying backend deployment credentials to preview builds.

## Verify before announcing launch

Confirm the account remains Free, then deploy and test a real hosted session: registration/login, student request, administrator approval/revocation, protected video GET/HEAD, lesson upload and publish, playback/seek, original resource download filename, and certificate generation with Latin and Ethiopic names. Verify all four fonts are present in the generated function bundle. Direct browser uploads must go to Convex rather than through Netlify's small request-payload limit. Revocation denies new application file requests; a Convex file URL already received is a bearer URL and is not revoked automatically.

Netlify's current Free plan has a hard limit of 300 credits/month with no recharge; production deployments consume credits alongside traffic and function compute. Exhaustion can interrupt availability. Convex Free currently caps file storage at 1 GB and file egress at 1 GB/month, so compress videos and upload a small initial library. Staying at $0 means accepting these limits rather than upgrading.

Official references: [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/), [CLI monorepos](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/#work-with-monorepos), [Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Next.js with pnpm](https://docs.netlify.com/snippets/frameworks/nextjs-pnpm-support/), [Node and package managers](https://docs.netlify.com/build/configure-builds/manage-dependencies/), [function environment variables](https://docs.netlify.com/build/functions/environment-variables/), [Convex production deployments](https://docs.convex.dev/production), [Netlify Free limits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [Convex limits](https://docs.convex.dev/production/state/limits).
