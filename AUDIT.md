# Portfolio Repository Audit

Audit date: 2026-09-24

This audit was completed before the Studio implementation. The public portfolio is treated as the regression baseline. The working tree already contained one untracked Markdown draft, `data/posts/agent-sandboxes-need-real-boundaries.md`; it was not treated as published content and was not deleted or rewritten.

## 1. Existing stack

- Next.js 16.3.5 App Router with the Next 16 `proxy.ts` convention.
- React and React DOM 19.2.3.
- TypeScript 5.9 with strict mode, bundler module resolution, and path aliases.
- Tailwind CSS 3.4 with a shadcn/Radix-style component layer.
- PostCSS, ESLint 9, Vitest 4, and Playwright 1.63.
- Inter is loaded through `next/font/google`; the existing code uses browser monospace fallbacks for technical metadata.
- Node 20.18.1 or newer is required in practice; the installed Next.js and `undici` dependency graph is not compatible with the README's old Node 18 claim.

## 2. Route inventory

### Public portfolio routes

- `/{locale}` — home.
- `/{locale}/resume` — résumé.
- `/{locale}/projects` — project index.
- `/{locale}/projects/{slug}` — case-study pages.
- `/{locale}/projects/repository/{owner}/{repo}` — repository evidence page.
- `/{locale}/services/{slug}` — service pages.
- `/{locale}/blog` — Field Notes archive.
- `/{locale}/blog/posts/{slug}` — Field Notes article.
- `/{locale}/privacy` — privacy page.
- `/{locale}/newsletter/{confirm|unsubscribe}` — newsletter confirmation actions.
- `/opengraph-image` — site social image.
- `/{locale}/blog/posts/{slug}/opengraph-image` — article social image.
- `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/manifest.webmanifest` — discovery resources.

### Existing private route

- `/{locale}/blog/captainscabin` — legacy token-protected Captain's Cabin admin.
- `/{locale}/blog/captainscabin/editor/new`.
- `/{locale}/blog/captainscabin/editor/{slug}`.
- Legacy admin APIs under `/api/blog/captainscabin`.

### New private route family

The implementation adds a separate top-level Studio root so the private interface does not enter the localized public navigation:

- `/studio/login`.
- `/studio`.
- `/studio/posts`.
- `/studio/posts/new`.
- `/studio/posts/{slug}`.
- `/studio/preview/{slug}`.
- `/studio/media`.
- `/studio/analytics`.
- `/studio/social`.
- `/studio/settings`.
- `/studio/seo`.
- `/studio/tools`.

## 3. Design-system notes

The active public identity is a night-meadow editorial system:

- Canvas `#080c22`.
- Meadow green `#d4f994` for primary actions.
- Violet `#c4b5fd` for AI, focus, labels, and metadata.
- Inter-led headings with compact editorial spacing.
- Thin low-contrast rules and numbered Field Notes rows.
- Project-specific abstract illustrations rather than generic image cards.
- The public Field Notes reader already has reading progress, a sticky desktop TOC, code highlighting, social sharing, related posts, adjacent navigation, and a mobile layout.

Studio uses the same palette through scoped `.studio-*` tokens. It is a denser control-room layout, not a replacement public theme. Lime remains the primary action color; violet identifies AI or selected state.

## 4. Existing content architecture

- Résumé, experience, education, skills, and certifications: `lib/resume.ts`.
- Curated case studies: `lib/case-studies.ts`.
- Service content: `lib/services.ts`.
- Additional project data: `lib/projects-data.ts`.
- Localized UI copy: `messages/*.json`.
- Social/profile constants: `lib/site.ts`.
- Existing Markdown posts: `data/posts/*.md`.
- Draft directory support: `data/drafts/*.md`.

## 5. Current blog implementation

- `gray-matter` parses frontmatter.
- `remark`, `remark-gfm`, and `remark-html` render Markdown.
- `lib/blog/reading-structure.ts` removes duplicate contents blocks and normalizes heading depth.
- `lib/blog/utils.ts` calculates reading time, heading IDs, adjacent posts, and related posts.
- Public visibility historically requires `published: true` and a non-future date.
- Existing storage reads bundled files and can overlay Postgres rows.
- Existing code highlighting uses client-loaded `highlight.js`; the new safe renderer adds an explicit server-side sanitization pass while retaining the public visual treatment.
- No arbitrary MDX execution is introduced.

## 6. Analytics status

- `@vercel/analytics` and `@vercel/speed-insights` are already mounted in `components/providers.tsx`.
- Existing anonymous custom events include repository, résumé, contact, and project interactions.
- No server-only Vercel Web Analytics API client existed.
- The Studio analytics adapter uses the official Vercel aggregate/count endpoints and shows a disconnected state when credentials are absent. It never fabricates metrics.
- Custom event tracking remains anonymous and excludes names, email, message content, IPs, draft text, and session secrets.

## 7. Deployment target

- Vercel is the existing deployment target.
- The local Vercel project link identifies `prashant-project/prashant-portfolio`.
- Vercel Analytics, Speed Insights, Blob, Sentry, Postgres, Formspree, Resend, and Groq integrations already exist in the repository.
- There is no tracked `vercel.json`; dashboard configuration remains authoritative for domains, Analytics, environment variables, and Blob stores.
- Production content writes are now designed around GitHub API commits. A deployment/revalidation is required after a remote Markdown or media commit.

## 8. Migration risks

- The existing locale root layout is the public root layout. Studio uses a separate top-level root layout to avoid adding private navigation to the public tree.
- Legacy Captain's Cabin routes and APIs must remain regression-safe while new Studio routes take over the primary editing workflow.
- Slugs historically came from filenames; uppercase and spaced filenames could silently disappear. New mutations validate frontmatter and slugs with Zod.
- Some existing posts use `description`, `image`, and legacy `published` fields. The new parser accepts these fields while emitting the richer model.
- Public routes must continue to filter scheduled and draft content. All discovery routes use the public post query.
- Existing CSP is partial. Studio authentication and upload routes are protected independently; a full CSP rollout must preserve Vercel, fonts, existing analytics, and consent-gated embeds.
- Local filesystem writes are not durable on Vercel. GitHub-backed writes are required in hosted environments.
- Public-repository committed drafts are readable by anyone with repository access. The UI explicitly distinguishes local drafts from committed drafts.
- Vercel Web Analytics dimensions and custom events depend on the enabled plan. Missing dimensions are displayed as unavailable, never estimated.
- External social metadata and AI calls can be unavailable, rate-limited, or changed by providers. Manual fields and link cards remain functional.

## 9. Chosen implementation architecture

### Presentation

- Existing public pages and Field Notes components remain the baseline.
- Studio is a separate `/studio` root with a dark scoped stylesheet and responsive rail/header layout.
- Studio client code is isolated behind the private route and API boundary.

### Authentication

- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET` are server-only.
- Passwords use Argon2id PHC hashes generated by `npm run hash-password`.
- A signed HMAC session token is stored in an HttpOnly, SameSite=Strict cookie for ten hours.
- Secure is enabled in production/Vercel.
- Every Studio API handler checks the session server-side. Proxy redirects are only an early navigation optimization.
- Legacy token authentication remains temporarily supported for the old Captain's Cabin regression surface.

### Content

- Markdown remains the source of truth in `data/posts` and `data/drafts`.
- `lib/studio/github.ts` uses the official GitHub Contents and Commits APIs when configured.
- Local filesystem storage is an explicit development fallback.
- Zod validates the article model and mutation payloads.
- The GitHub adapter obtains the current file SHA and surfaces conflicts rather than overwriting remote changes.
- Scheduled visibility is calculated from status and time; no request mutates an article.
- Git history powers revision and activity views when GitHub is configured.

### Media

- `lib/studio/images.ts` verifies image signatures, limits dimensions and bytes, and creates WebP/AVIF variants with Sharp.
- `lib/studio/media.ts` provides one storage abstraction with Vercel Blob preference and Git/local fallback.
- Markdown commits and binary media use separate operations.

### AI and SEO

- AI calls are server-only and provider-neutral through `AI_PROVIDER`, `AI_MODEL`, and `AI_API_KEY`.
- TL;DR, SEO suggestions, internal-link suggestions, and repurposing are suggestions; they never auto-publish or silently rewrite the body.
- The public renderer emits Article/BlogPosting, BreadcrumbList, visible FAQ, and valid VideoObject data only when the source supports it.
- Dynamic article OG images use the existing portfolio colors and only published content.
- `/llms.txt` and `/llms-full.txt` are generated from public portfolio data and published articles only.

### Analytics

- Existing Vercel Analytics and Speed Insights remain mounted.
- Studio uses a server-only Vercel Web Analytics API client with five-minute response caching.
- The disconnected state is explicit when credentials or dimensions are unavailable.

## 10. Legacy routes requiring regression tests

- `/{locale}` for all supported locales.
- `/{locale}/resume` and both PDF assets.
- `/{locale}/projects` and each case-study slug.
- `/{locale}/projects/repository/{owner}/{repo}`.
- `/{locale}/services/{slug}`.
- `/{locale}/blog` and published Field Notes article URLs.
- `/{locale}/privacy`.
- `/sitemap.xml`, `/robots.txt`, `/rss.xml`, `/llms.txt`, `/llms-full.txt` when present.
- `/opengraph-image` and article OG image routes.
- Existing public API validation routes: `/api/contact`, `/api/chat`, `/api/health`, `/api/blog/posts`, and `/api/blog/posts/{slug}`.
- Legacy `/api/blog/captainscabin` denial behavior while the old surface remains available.
- Mobile layouts at approximately 360px, 768px, 1024px, and 1440px.

## Implementation migration note

The former Captain's Cabin pages now redirect to the matching protected Studio pages. Its old write APIs return HTTP 410 after legacy authentication in production; Studio is the hosted Git-backed write path. Existing public portfolio and Field Notes URLs are unchanged.
