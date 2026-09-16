# Production integrations

## Configured for this delivery

- Vercel project: `prashant-project/prashant-portfolio`.
- Groq: local key validated against the live models endpoint and synchronized to production and preview. Default: `openai/gpt-oss-120b`.
- Admin: Basic authentication protects the page and every write API. Use username `admin` and the generated `ADMIN_SECRET` stored in the ignored `.env.local` and Vercel. No secret is committed.
- Contact: the existing Formspree form `mwvyznvj` is used behind server validation and rate limiting. Delivery tests must not send fabricated messages to the owner.
- GitHub Discussions: enabled on the portfolio repository. The discussion link works without an embedded widget.

## Owner configuration still required

1. Connect a dedicated Postgres database as `DATABASE_URL`; run `node scripts/migrate.mjs`. Tables use the `portfolio_` prefix and RLS with no public policies. Use a server-only database role, not a browser credential. Bundled published markdown remains readable; hosted editing returns 503 until Postgres is configured. Database rows override bundled posts and deletion tombstones prevent old posts from reappearing.
2. Connect a public Vercel Blob store using `BLOB_READ_WRITE_TOKEN` for the editor’s image uploader.
3. Add `RESEND_API_KEY` and a verified `EMAIL_FROM` for newsletter confirmations. Subscriptions require Postgres and explicit confirmation. Confirmation links expire after 24 hours; unsubscribe removes the record. Provider failure produces an error, never a successful-subscription message. Newsletter campaign delivery is not an automatic broadcast feature of this site; exported confirmed recipients can be managed in the chosen provider.
4. Install the Giscus GitHub app on `Mr-Dark-debug/portfolio`, then set `NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDONqiIiA` and `NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDONqiIiM4DFlyM` (Announcements). The embed loads only after reader interaction. Until installed, the direct Discussions link remains available.
5. Add `SENTRY_DSN` to enable server error monitoring. Request bodies, user details, extras and breadcrumbs are removed before sending events. Performance tracing is disabled.
6. Enable Web Analytics and Speed Insights in the Vercel project dashboard to receive the instrumented events.
7. Verify the site in Google Search Console and Bing Webmaster Tools; optional verification codes are supported as `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`. Submit `https://prashant.sbs/sitemap.xml`. A public sitemap does not prove submission or indexing.

## Operational checks

`/api/health` reports the deployed revision and service availability without credentials. Configure an external uptime check for this endpoint once a monitoring provider is selected. A database failure returns 503. With no database, public read-only storage is reported explicitly.

With Postgres configured, abuse limits are atomic across instances. Without it, limits are process-local and best effort; use Vercel Firewall for an additional hosted boundary. Periodically delete expired rows from `portfolio_rate_limits` and expired, unconfirmed subscriber rows. Reader counts are deduplicated by anonymous browser cookie and are not unique-person analytics.

## Content provenance

The two supplied PDFs are copied unchanged. Experience, education, certifications and the four case studies use the supplied English CV. Its adoption and research metrics are explicitly labeled as CV statements. Live GitHub verification on 2026-09-14 found 67 stars and 11 forks on PocketLLM, but the site does not hardcode those as live counts. Public repositories for SetFit and AetherMind were independently verified. No testimonials, placement rates or unpublished benchmarks were invented.

## Primary implementation references

- [Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Groq model availability](https://console.groq.com/docs/models) — live account availability takes precedence over the catalog.
- [Groq tool use](https://console.groq.com/docs/tool-use/overview)
- [Vercel storage](https://vercel.com/docs/storage)
