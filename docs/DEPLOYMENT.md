# Deployment and integration notes

## Required Studio variables

Set these in Vercel for Production and Preview when hosted editing is required:

```env
ADMIN_USERNAME=your-private-username
ADMIN_PASSWORD_HASH=$argon2id$v=19$m=19456,t=2,p=1$...
SESSION_SECRET=at-least-32-random-characters
GITHUB_CONTENT_TOKEN=github-fine-grained-token
GITHUB_CONTENT_OWNER=repository-owner
GITHUB_CONTENT_REPO=repository-name
GITHUB_CONTENT_BRANCH=main
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/your-project-id/your-hook-id
NEXT_PUBLIC_SITE_URL=https://prashant.sbs
```

Generate the password hash with `npm run hash-password`. Do not put the plaintext password in a URL, shell history, client code, or a committed file.

## GitHub token permissions

Use a fine-grained personal access token limited to the content repository:

- Repository contents: **Read and write** for Markdown, JSON settings, and Git-backed media.
- Metadata: read access if the GitHub UI requires it.
- No workflow, organization, package, issue, or pull-request permissions.
- No access to other repositories.

The adapter requests the current file SHA before updates. A GitHub 409 becomes a visible conflict error; it does not silently overwrite a remote edit. A public repository means committed drafts are technically readable by anyone who can access the repository.

## Vercel

1. Import the repository into Vercel or keep the existing `prashant-project/prashant-portfolio` project.
2. Use Node 20.18.1 or newer.
3. Keep the default Next.js build command and `npm` install command.
4. Add the Studio variables above to Production. Create the deploy hook in Project Settings → Git for the `main` branch and store its URL as a secret. Use a separate hook for Preview if editing against a preview branch.
5. Enable Web Analytics and Speed Insights in the Vercel project.
6. Create a Vercel access token with Web Analytics read access and set `VERCEL_ANALYTICS_TOKEN`, `VERCEL_PROJECT_ID`, and, for a team project, `VERCEL_TEAM_ID`.
7. Verify the canonical domain is `prashant.sbs`; keep the locale routes and apex/www behavior unchanged.
8. Confirm `/studio`, `/api/studio`, and preview responses are not indexed. The app also sends `X-Robots-Tag` for those paths.

GitHub commits are persistent content changes. Studio requests a production deployment after an article, media, settings, or social content commit. The API reports whether the build was queued; a queued build is not proof that the new content is live. Check the production deployment and URL before announcing publication. If the hook is absent or fails, the Git commit is retained and Studio reports the deployment gap.

Scheduled Markdown is included by the build requested when it is scheduled. The public article and listing revalidate on a short interval after the due time; feeds and discovery files have longer cache windows. Vercel Hobby cron cannot run more than once per day and has hour-level timing, so it cannot guarantee an exact schedule-time deployment.

## Media

- With `BLOB_READ_WRITE_TOKEN`, uploads use Vercel Blob and Markdown remains Git-backed.
- Without Blob, local development uses `public/blog` and the Git adapter commits media files when configured.
- Uploads are limited to 10 MB, checked by actual image signature, constrained to 40 megapixels, resized to a maximum 2400px width, and emitted as WebP/AVIF variants where appropriate.
- Do not expose a Blob write token to the browser.

## AI

Optional variables:

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_API_KEY=server-only-key
AI_API_URL=
```

Supported adapters are OpenAI-compatible, Anthropic, and Gemini-shaped requests. Manual metadata, Markdown, TL;DR, and publishing work without AI. AI output is always a proposal and requires a deliberate save.

## Analytics

The Studio API uses the official Vercel endpoints:

- `/v1/query/web-analytics/visits/count`
- `/v1/query/web-analytics/visits/aggregate`
- `/v1/query/web-analytics/events/aggregate`

Responses are server-only and cached briefly. Dimensions not available on the current Vercel plan are shown as unavailable. No event contains names, email addresses, contact messages, IPs, draft text, session tokens, or secrets.

## Optional social metadata

The public system works with manual cards without social credentials. If approved provider metadata is needed, configure only the server-side variables appropriate to the provider:

```env
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
X_BEARER_TOKEN=
X_USER_ID=
FACEBOOK_ACCESS_TOKEN=
```

Do not scrape provider pages. Prefer official oEmbed/OpenGraph/API methods and retain the link-card fallback.

## Content and deployment checks

After the first Studio commit, verify:

- `/en/blog` lists only published and due scheduled posts.
- A future scheduled slug returns not found publicly and is absent from `/rss.xml`, `/sitemap.xml`, `/llms.txt`, and `/llms-full.txt`.
- `/llms.txt` and `/llms-full.txt` contain no draft or admin content.
- `/studio/login` returns a generic error for wrong credentials.
- An unauthenticated `/api/studio/posts` request returns 401.
- Analytics without credentials says **Analytics API not configured**.
- AI without credentials returns the disconnected state without changing content.
- External media remains a card until a reader explicitly allows it.
