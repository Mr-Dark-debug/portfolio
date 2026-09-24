# Prashant Choudhary — Portfolio and Field Notes

A Next.js App Router portfolio for Prashant Choudhary: practical AI engineering, full-stack products, project case studies, and the **Field Notes** engineering journal.

The public site is intentionally unchanged in identity: night meadow colors, Inter typography, editorial project treatments, localized routes, and the typography-led Field Notes reader remain the baseline. The private publishing system lives at `/studio` and is not part of public navigation.

## Stack

- Next.js 16 App Router and React 19
- TypeScript strict mode
- Tailwind CSS and scoped Studio CSS
- `gray-matter`, Remark, GFM, and server-side HTML sanitization
- Vercel Analytics and Speed Insights
- GitHub Contents/Commits API for Markdown CMS operations
- Sharp and optional Vercel Blob for media
- Optional provider-neutral AI integration
- Vitest and Playwright

## Local setup

Use Node 20.18.1 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/en` for the public site and `http://localhost:3000/studio/login` for Studio.

## Studio authentication

Studio uses an Argon2id password hash and a signed, HttpOnly, SameSite=Strict session cookie. Generate a hash without putting the password in a command-line argument:

```bash
npm run hash-password
```

Copy the printed PHC value to `ADMIN_PASSWORD_HASH`. Set a random `SESSION_SECRET` of at least 32 characters and set `ADMIN_USERNAME`. Passwords and secrets are never sent to client JavaScript.

## Content storage

The repository's existing `data/posts` directory remains the Markdown source of truth. Configure the four `GITHUB_CONTENT_*` variables for hosted Studio writes. Without them, local development writes to the filesystem; hosted writes fail with a clear configuration message rather than pretending to persist.

Committed drafts in a public repository are readable by people who can access that repository. Use the editor's local autosave for private unfinished work and choose repository saving deliberately.

## Media

Set `BLOB_READ_WRITE_TOKEN` to use Vercel Blob. Without it, Studio uses the Git/local media adapter. Images are signature-checked, size-limited, resized when necessary, and generated as WebP/AVIF variants where appropriate.

## Optional services

- `AI_PROVIDER`, `AI_MODEL`, and `AI_API_KEY` enable TL;DR, SEO suggestions, internal-link assistance, and content repurposing. Manual writing remains available without them.
- `VERCEL_ANALYTICS_TOKEN`, `VERCEL_PROJECT_ID`, and optional `VERCEL_TEAM_ID` enable the server-only Studio analytics dashboard. Missing credentials show a disconnected state; no metrics are invented.
- `INSTAGRAM_*`, `X_*`, and `FACEBOOK_ACCESS_TOKEN` are reserved for approved provider metadata. Manual social cards work without them.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The E2E suite starts a local development server on port 3100 by default and uses installed Google Chrome. Set `TEST_BASE_URL` to test a deployed preview, or set `E2E_SERVER_COMMAND="npm run start -- -p 3100"` to exercise a production build.

## Documentation

- `AUDIT.md` — repository audit, route inventory, risks, and architecture decisions.
- `ADMIN-GUIDE.md` — non-technical Studio workflow.
- `docs/DEPLOYMENT.md` — GitHub, Vercel, media, AI, analytics, and optional social setup.
- `docs/INTEGRATIONS.md` — existing service notes.

## Public routes

Public routes remain locale-prefixed under `/en`, `/de`, `/de-CH`, `/lb-LU`, `/es`, `/hi-IN`, and `/fr`. Studio routes are top-level, private, noindex, and protected independently at the server/API layer.
