# Historical Netlify deployment — archived

Archived 4 November 2026. The owner deleted the Netlify project and selected direct Vercel hosting. Netlify is no longer the academy host. The former `yo-tech-academy.netlify.app` address and its deployment IDs are historical references, not a current service or deployment target.

Use [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for the current project, `yo-app-academy`, and its live direct address, https://yo-app-academy.vercel.app. The Vercel deployment and approved private runtime configuration passed [hosted checks](qa/vercel-public-browser.json). The former `yoh-app-academy.vercel.app` address keeps its HTTP 307 redirect to the YO address.

## Retired workflow

The earlier host used Netlify’s Next.js adapter, an isolated local adapter build and manual upload of generated assets/functions. A Vercel project rule forwarded the YO address to Netlify. A narrow head bootstrap handled whitespace inserted by Netlify’s hosting promotion comment.

That provider-specific workflow is retired. The Netlify adapter dependency, `netlify.toml` and hosting head bootstrap have been removed from the current source. Do not restore the old forwarding rule or run the old artifact-upload commands for a Vercel deployment. Vercel builds Next.js directly with the committed app settings.

The existing Convex production database and file storage are reused. Changing the frontend host does not recreate or move the academy’s accounts, recordings or learning records. No Convex deploy key or CLI account token is required or granted to the frontend host. Billing settings remain unchanged by this migration.

## Historical evidence

The retained QA files describe the earlier Netlify site:

- [Hosted API/admin checks](qa/netlify-hosted-check.json)
- [Public browser checks](qa/netlify-public.json)
- [Head hydration diagnosis](qa/netlify-hydration-diagnosis.json)
- [Light-only browser checks](qa/netlify-light-only.json)
- [Footer and YO brand checks](qa/netlify-footer-final.json)
- [Earlier domain forwarding](qa/yo-domain-forwarding.json)

These reports are preserved rather than rewritten. Earlier dark-theme captures are historical; the current app is light-only. Past Netlify readiness and browser results do not verify the new Vercel host.
