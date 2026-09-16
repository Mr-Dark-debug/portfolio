# Portfolio Upgrade Implementation Plan

**Goal:** Deliver the supplied portfolio audit while preserving the visual component structure.

**Architecture:** Shared profile/project data powers indexable pages and AI retrieval. A repository layer reads Postgres in hosted mode and filesystem content locally. Route-level authorization, validation and rate limits protect writes; provider failures are visible.

**Tech stack:** Next.js App Router, next-intl, Groq AI SDK, Postgres, Vercel Blob, Vitest and Playwright.

## Work packages

- [ ] Security and persistence: `lib/admin-auth.ts`, `lib/blog/utils.ts`, `lib/db.ts`, `lib/rate-limit.ts`, admin layouts/routes, SQL migration. Test missing/wrong credentials, traversal, draft and scheduled leakage, XSS, failed hosted writes, malformed contact input.
- [ ] Content and visual work: server homepage with existing client islands, supplied background and PDFs, `lib/case-studies.ts`, resume/projects/services pages. Verify CV facts, every CTA and mobile layout.
- [ ] AI: `lib/ai/knowledge.ts`, tool functions and chat route. Test project-name and semantic-term retrieval, source URLs, allowlisted roles/models, errors and real Groq streaming.
- [ ] Blog and discovery: metadata helpers, sitemap, robots, RSS, JSON-LD, headings, related posts, search and professional blog copy. Verify HTML before hydration and public API filtering.
- [ ] Engagement and operations: database reactions, confirmed newsletter with unsubscribe, optional Giscus, analytics events, Sentry hooks and health endpoint. Never show fictitious subscriptions or counts.
- [ ] Delivery: `npm run test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, browser smoke tests, deployment and production probes. Save evidence and provider setup status to `docs/DELIVERY.md`.
