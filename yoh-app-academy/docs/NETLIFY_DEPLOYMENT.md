# Netlify Free + Convex Free deployment

The selected launch budget is $0. Use the verified **Free** Netlify account and **Free** Convex project, the supplied `netlify.app` domain, and no paid add-ons, upgrades, domain purchases, or auto recharge. Convex production is deployed at https://proficient-squirrel-944.eu-west-1.convex.cloud; development uses zealous-weasel-162. The Netlify production deploy `6aea501477ef1c66f67c0f47` is ready at https://yo-tech-academy.netlify.app (site ID `cb462df0-39d2-4330-9884-8adade779ce6`). Production visibility is public and previews remain private. **Hosted API/admin and public browser verification passed.**

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

Package directory is a site setting, not a TOML setting. When using the CLI from the repository root, pass `--filter yoh-academy` (the app package name) or `--filter yoh-app-academy` (its path). CLI selection does not persist the Netlify UI build setting. The configured build command, `pnpm --dir yoh-app-academy build`, builds Next.js only. Backend deployment is a separate authenticated local operation. Use `--context production` on the build command and `--prod` on artifact upload. Netlify CLI 27.16.2 rejects `--context` together with `--no-build`, and does not expose a `--config` deploy option.

Node 24 and pnpm 11.20.0 are selected by the repository. `PNPM_FLAGS=--shamefully-hoist` follows Netlify's Next.js/pnpm requirement. The app pins the current tested OpenNext adapter, `@netlify/plugin-nextjs` **5.16.5**, as a dev dependency; root TOML explicitly registers it with `[[plugins]]`. This makes local offline builds reproducible without relying on remotely injected adapters. Keep the standalone output, certificate tracing, and four certificate TTF inclusions. API routes and SSR require the adapter-generated functions and routing metadata.

## Prepare private environment values

Set runtime variables through the **Netlify UI, CLI, or API**, never in committed TOML. Variables in TOML are build-only. On Free, leave the default availability to all scopes; choosing granular scopes is a paid-plan feature. The bridge secret and mentor invitation are private; the deployment URLs and contact email are public configuration:

| Variable | Netlify | Convex production |
| --- | --- | --- |
| `CONVEX_URL` | Exact production Convex deployment URL, available to build and functions | Deployment's existing public URL |
| `NEXT_PUBLIC_CONVEX_URL` | The same production URL, available to build and functions | Deployment's existing public URL |
| `YOH_CONVEX_SERVER_SECRET` | At least 32 random characters | Identical value |
| `YOH_MENTOR_INVITE` | Private mentor invitation | Identical value |
| `YOH_APP_URL` | `https://yo-tech-academy.netlify.app` | Not required |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `yohansforex@gmail.com` | Not required |

Set both Convex URL variables explicitly; no build wrapper injects them. They must identify the same production deployment, since `CONVEX_URL` takes priority. Keep `YOH_BUILD_DIR` unset. Local SQLite and `.data` are not hosted persistence. Missing Convex configuration fails closed on Netlify rather than creating a local database.

Do not create or grant a `CONVEX_DEPLOY_KEY` for this workflow, and do not send a Convex CLI/account access token to Netlify. The matching application bridge secret lets the running academy call its protected backend functions; it does not grant backend deployment access. Git/CI automatic backend deployment is not configured. Any future grant of backend deployment credentials to a hosting or CI provider requires specific approval.

Create/promote the administrator once with `pnpm setup-admin` against the production Convex URL and matching bridge secret. Use a private local environment for admin credentials; no admin password belongs in this document or the repository. Admins approve student enrollment; invited mentors/admins upload lesson videos/resources in Mentor Studio.

## Manual launch workflow

1. Verify the selected Convex and Netlify accounts remain Free. Use the already authenticated local Convex CLI to select/confirm this project's production deployment, set its application bridge/invite values through the authorized local administration workflow, and deploy backend functions locally with `pnpm --dir yoh-app-academy exec convex deploy`. Confirm the target before publishing. The account credential stays in the local CLI store.
2. Prepare an isolated source copy at `/tmp/yo-netlify-source` so builds do not replace the user's running `.next`. Exclude owner `.data`, existing `.next*`/`.netlify` output, `.env*` files, and credential stores. Run `pnpm install --frozen-lockfile --shamefully-hoist` from this staging root. The committed app manifest and workspace lock must contain the exact adapter dev dependency `5.16.5`; no new dependency belongs in the owner workspace during deployment. Link the staged app to the existing Netlify site.
3. Build from the staging root with the pinned Netlify CLI and only public application values. The commands below use `netlify` for CLI **27.16.2**; invoke the same installed/cached executable, or `pnpm dlx netlify-cli@27.16.2` if needed. Do not load private environment files, bridge/invite values, administrator passwords, or Convex account/deployment credentials into this build:

```bash
CONVEX_URL=https://proficient-squirrel-944.eu-west-1.convex.cloud \
NEXT_PUBLIC_CONVEX_URL=https://proficient-squirrel-944.eu-west-1.convex.cloud \
NEXT_PUBLIC_CONTACT_EMAIL=yohansforex@gmail.com \
NETLIFY_TELEMETRY_DISABLED=1 \
netlify build --offline --context production --filter yoh-academy
```

4. Confirm the build logs include the Next.js adapter and **Functions bundling**. Verify the generated handler and `.netlify/functions/manifest.json` specify the catchall route with `prefer_static: true` and `nodejs24.x`. The tested staging bundle contains all 22 API route modules, all four certificate fonts, and no private `.env`/credential files. Paths under `yoh-app-academy` are:

| Artifact | Relative path |
| --- | --- |
| CDN assets | `.netlify/static` |
| Generated redirects and immutable-assets header | `.netlify/netlify.toml` |
| Generated Next.js handler | `.netlify/functions-internal/___netlify-server-handler` |
| Function ZIP and manifest | `.netlify/functions` |
| Prerendered page blobs | `.netlify/deploy/v1/blobs` |

5. Prepare the **staging root** `netlify.toml` for artifact upload. The adapter temporarily swaps static content into `.next` during a build, then restores the full `.next` in `onEnd`. Therefore, upload `.netlify/static` and preserve its generated routing metadata. Merge only the generated `headers` and `redirects` arrays into the original staging TOML, and set `build.publish = "yoh-app-academy/.netlify/static"`. Preserve the original functions, adapter, Node and pnpm settings. Do not copy the entire normalized generated TOML: its absolute base paths and internal origin metadata are unsuitable as a source config. Do not create a second app-level `netlify.toml`.

This Python 3.11+ preparation example edits only `/tmp/yo-netlify-source/netlify.toml` after a fresh build:

```python
from pathlib import Path
import json, re, tomllib

root = Path('/tmp/yo-netlify-source')
source = root / 'netlify.toml'
text = source.read_text()
original = tomllib.loads(text)
generated = tomllib.loads((root / 'yoh-app-academy/.netlify/netlify.toml').read_text())
assert original['build']['publish'] == 'yoh-app-academy/.next'
assert not original.get('headers') and not original.get('redirects')
assert len(generated['redirects']) == 3 and len(generated['headers']) == 1

def value(item):
    if isinstance(item, dict):
        return '{' + ', '.join(json.dumps(k) + ' = ' + value(v) for k, v in item.items()) + '}'
    if isinstance(item, list):
        return '[' + ', '.join(value(v) for v in item) + ']'
    return json.dumps(item, ensure_ascii=False)

text, count = re.subn(r'(?m)^(\s*publish\s*=\s*)"yoh-app-academy/\.next"\s*$',
                     r'\1"yoh-app-academy/.netlify/static"', text, count=1)
assert count == 1
for section in ['headers', 'redirects']:
    for entry in generated[section]:
        text += '\n[[' + section + ']]\n'
        text += '\n'.join(json.dumps(k) + ' = ' + value(v) for k, v in entry.items()) + '\n'
checked = tomllib.loads(text)
assert checked['build']['publish'] == 'yoh-app-academy/.netlify/static'
assert len(checked['redirects']) == 3 and len(checked['headers']) == 1
source.write_text(text)
```

6. From `/tmp/yo-netlify-source`, upload the completed assets and generated functions:

```bash
netlify deploy --no-build --prod --filter yoh-academy \
  --site cb462df0-39d2-4330-9884-8adade779ce6 \
  --dir /tmp/yo-netlify-source/yoh-app-academy/.netlify/static
```

The CLI automatically discovers the staged root TOML, package-scoped internal handler, function manifest, and prerendered blobs. Do not point `--functions` at the ZIP directory. Function manifests have a two-minute cache lifetime; an expired manifest causes the CLI to rezip the existing generated handler without rebuilding Next.js. Runtime application secrets stay configured on Netlify Functions. Keep the staging upload config and artifacts together; retain `.next` as the owner source's **build** publish directory. A future build should start from a fresh source config rather than the staging upload override.

7. Run the hosted checks below before announcing launch. Later code changes use this sequence until a separately approved automation arrangement exists. Uploading lesson content in Mentor Studio does not require a deployment.

## Origins and previews

New projects on recently created Credit-based Netlify teams can start private by default, including projects created with the CLI or API. A ready production deploy can therefore still return a Netlify login page to anonymous visitors. In Project configuration > General > Visitor access > Project visibility, make **production public** and keep **previews private**. The current site has this setting; its site-level team-login metadata is `sso_login: true` with `sso_login_context: "non_production"`. Team defaults are unchanged. This changes Netlify's outer visibility layer; academy sessions, administrator-approved enrollment, and content authorization remain enforced by the application. See [Netlify project visibility](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/).

Production uses explicit `YOH_APP_URL`, or Netlify's documented runtime `URL`. The server trusts these deployment settings and never trusts forwarded headers to establish its allowed origin. Netlify documents `SITE_ID`, `SITE_NAME`, and `URL` for function runtime; `NETLIFY`, `CONTEXT`, and `DEPLOY_PRIME_URL` are build variables. Automatic preview origins are therefore not assumed. Leave automatic Deploy Previews/branch deploys disabled for this initial production-only setup. Before enabling them, use an isolated Convex preview deployment and explicitly configure its trusted runtime origin, or carry the trusted non-secret build URL into a generated server configuration. This does not authorize supplying backend deployment credentials to preview builds.

## Verify before announcing launch

Confirm the account remains Free, then deploy and test a real hosted session: registration/login, student request, administrator approval/revocation, protected video GET/HEAD, lesson upload and publish, playback/seek, original resource download filename, and certificate generation with Latin and Ethiopic names. Verify all four fonts are present in the generated function bundle. Direct browser uploads must go to Convex rather than through Netlify's small request-payload limit. Revocation denies new application file requests; a Convex file URL already received is a bearer URL and is not revoked automatically.

Netlify's current Free plan has a hard limit of 300 credits/month with no recharge; production deployments consume credits alongside traffic and function compute. Exhaustion can interrupt availability. Convex Free currently caps file storage at 1 GB and file egress at 1 GB/month, so compress videos and upload a small initial library. Staying at $0 means accepting these limits rather than upgrading.

Official references: [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/), [CLI monorepos](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/#work-with-monorepos), [Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Next.js with pnpm](https://docs.netlify.com/snippets/frameworks/nextjs-pnpm-support/), [Node and package managers](https://docs.netlify.com/build/configure-builds/manage-dependencies/), [function environment variables](https://docs.netlify.com/build/functions/environment-variables/), [Convex production deployments](https://docs.convex.dev/production), [Netlify Free limits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [Convex limits](https://docs.convex.dev/production/state/limits).

Hosted verification: the public homepage, portrait and backend endpoints return 200; production admin sign-in, dashboard/request access, secure cookie flags, logout and rejection of the old session passed. Production remains empty for the owner’s first recording. The full cloud content flow was tested in development, not with synthetic production recordings. See [hosted evidence](qa/netlify-hosted-check.json) and [verification](verification.md).

The app includes a narrow pre-hydration compatibility bootstrap for the blank head text node inserted before Netlify’s hosting comment. It preserves the promotion comment and badge and is a no-op when the provider does not insert that whitespace. Keep it ahead of hydration while this provider behavior persists; see [diagnostic evidence](qa/netlify-hydration-diagnosis.json).

Final live visual checks on the ready deployment passed desktop/mobile light and dark themes, normal/reduced motion, the translucent header and auth dialogs, with no browser errors, warnings or failed responses. [Browser evidence](qa/netlify-public.json), [contrast evidence](qa/netlify-contrast.json).

The current published appearance is light-only; the theme switch and saved/device preference logic have been removed. The replacement build and live backend endpoints passed. See [light-only build](qa/netlify-light-only-build.json) and [live HTTP checks](qa/netlify-light-only-http.json). Earlier light/dark visual reports describe the launch revision.

Live [light-only browser checks](qa/netlify-light-only.json) confirm the light appearance even with an OS dark preference and a saved dark choice. Homepage/auth/certificate layouts fit390/1440px; the only console warnings are the previously documented warm-cache font preloads during certificate navigation.

The public YO entry address https://yo-app-academy.vercel.app forwards to this Netlify site. A persistent host-specific Vercel routing rule and old-address redirect preserve paths/query strings; no Vercel backend secrets were supplied. Keep that project rule while Netlify remains the selected host. [Domain proof](qa/yo-domain-forwarding.json), [current footer/brand checks](qa/netlify-footer-final.json).
