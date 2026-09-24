# Production integrations

## Current public services

- Vercel project: `prashant-project/prashant-portfolio`.
- Vercel Analytics and Speed Insights are mounted on public routes.
- Groq remains available for the existing chat and project overview features.
- Formspree handles the validated quick-contact form.
- Postgres remains available for rate limits, reactions, and newsletter records.
- Sentry is optional and strips request/user data before server events.
- GitHub Discussions are linked without loading a comment iframe automatically.

## Studio services

Studio uses the Git-backed Markdown CMS and optional Vercel Blob media adapter. Configure the variables in `.env.example`:

- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` for the private Studio session.
- `GITHUB_CONTENT_TOKEN`, `GITHUB_CONTENT_OWNER`, `GITHUB_CONTENT_REPO`, `GITHUB_CONTENT_BRANCH` for hosted Markdown and settings writes.
- `BLOB_READ_WRITE_TOKEN` for Vercel Blob media.
- `VERCEL_ANALYTICS_TOKEN`, `VERCEL_PROJECT_ID`, and optional `VERCEL_TEAM_ID` for real Studio analytics.
- `AI_PROVIDER`, `AI_MODEL`, and `AI_API_KEY` for optional TL;DR, SEO, internal-link, and repurposing tools.

Missing credentials produce explicit disconnected states. The system does not display placeholder analytics, fake AI output, or claim that a hosted write succeeded when it did not.

## Content provenance

The supplied PDFs remain unchanged. Experience, education, certifications, and case studies continue to use the supplied CV. Historical CV metrics are labeled as historical statements rather than live measurements. Public project repository facts are fetched from allowlisted public repositories and are not treated as AI-generated proof.

## Public discovery

`/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and `/llms-full.txt` read only currently public published posts. Drafts, future scheduled posts, Studio routes, and preview routes are excluded.

## Operational checks

- Enable Web Analytics and Speed Insights in the Vercel project.
- Add Google Search Console and Bing Webmaster Tools verification codes if desired.
- Submit `https://prashant.sbs/sitemap.xml` after deployment.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before deployment.
- Run the Playwright suite against a production server or preview deployment.
- Rotate any credential that has ever been exposed in logs, shell history, or an untrusted transcript.

See `DEPLOYMENT.md` and `ADMIN-GUIDE.md` for the complete Studio setup and user workflow.
