# Prashant Portfolio Studio — Admin Guide

Studio is the private control center for Field Notes and portfolio content. The public portfolio is unchanged until a post is published.

## Sign in

1. Open `/studio/login`.
2. Enter the username and password configured by the site owner.
3. The session lasts ten hours in an HttpOnly cookie. Use **Sign out** in the Studio rail when finished.
4. If sign-in is unavailable, check the server environment rather than repeatedly guessing credentials.

## Create and edit an article

1. Open **Posts → New post** or an existing title.
2. To import an existing article, choose a Markdown or text file, or export a Google Doc as Word (`.docx`) and upload it. Studio fills the title, slug, excerpt, tags, and body, then keeps the result as a local draft for review. Embedded Word images need a separate upload.
3. Otherwise, write a title, stable slug, excerpt, tags, and topics.
4. Use the toolbar for headings, emphasis, lists, links, code, tables, images, callouts, and provider URLs. On a phone, switch between **Write & save** and **Details & AI**.
5. The status bar shows word count, character count, reading time, local autosave state, and the last repository save.
6. Use **Preview** to render the same sanitized Markdown pipeline used publicly.
7. Use **Save locally** for private unfinished work. It is stored in this browser only, and can be restored after reopening the editor.
8. Use **Save draft to repository** only when a committed draft in the content repository is acceptable.

## Images and media

- Open **Media** to drag and drop JPEG, PNG, WebP, AVIF, or GIF files.
- The server checks the actual file signature, dimensions, and size. WebP and AVIF variants are generated when appropriate.
- Copy an asset URL into the editor's cover image field.
- Add descriptive cover alt text. The cover image is optional but useful for social previews and accessibility.
- Deleting an asset asks for confirmation. Check the used-by list first.

## YouTube and social links

Paste a YouTube, Instagram, Facebook, X/Twitter, LinkedIn, or GitHub URL into the editor and choose the embed tool. Studio recognizes the provider and stores a normalized content block. Before a visitor loads third-party content, the public article shows a provider card and an explicit **Load external content** action. Visitors can revoke the preference from the article or Field Notes footer.

If a provider has no reliable public embed, the link card remains useful and links to the original content. No private social credentials are sent to the browser.

## Publish, unpublish, archive, or schedule

- **Publish** sets a publication timestamp and makes the article eligible for public visibility.
- **Unpublish** moves the article back to a draft.
- **Archive** removes it from normal feeds and search while preserving the Markdown history.
- **Schedule** stores an ISO timestamp. Before that time the post is absent from the index, article route, search, RSS, sitemap, and `llms.txt`; after the time it becomes visible without a cron mutation.

## AI tools

- **Generate TL;DR** creates an editable two-to-four sentence summary from the current title and body. It is generated only when requested and saved only when you save the article.
- **AI SEO optimize** proposes metadata, topics, headings, links, entities, FAQ opportunities, and content gaps. On a new post, **Apply locally** updates the browser draft; save it to the repository when ready. On an existing post, **Apply & save** commits supported fields immediately. Guidance without a matching field has no Apply button. AI never overwrites the body or publishes automatically.
- **Repurpose content** creates editable drafts for LinkedIn, X, Instagram, YouTube, short-form hooks, newsletters, and GitHub announcements. It does not post anywhere.

If AI is not configured, the buttons show a disconnected message and all manual fields remain available.
Hosted repository saves require `GITHUB_CONTENT_TOKEN` in Vercel. If it is missing, Studio reports the error and retains changes in browser recovery.

## SEO and quality

The editor checklist calls out missing or weak title, excerpt, metadata, TL;DR, cover, alt text, tags, topics, internal links, references, heading structure, unsafe HTML, and schedule validity. It deliberately does not reduce the work to a fake score.

The SEO workspace shows public metadata, tag inventory, and deterministic internal-link candidates. Use **Tools** to manually run a conservative link check.

## Revisions

When GitHub content storage is connected, open a post's **Revision history** to inspect commit timestamps and messages. Restoring creates a new commit; it never rewrites repository history. Local development has no remote commit history to show.

## Analytics

**Analytics** uses the official Vercel Web Analytics API. It shows page views, visitors, routes, referrers, devices, countries, and custom events when the configured plan returns those dimensions. If credentials are missing, the page says **Analytics API not configured** instead of showing sample numbers.

## Social hub

**Social hub** stores curated Instagram, LinkedIn, X, Facebook, YouTube, GitHub, and manual links in Git-backed JSON. These are public-content candidates, not automated posts. The site continues to work without social API credentials.

## Privacy

The essential Studio session cookie is unrelated to external-media consent. Third-party embeds are paused until the reader chooses to load them, and the preference is stored locally. The Studio settings page controls default consent copy and the public AI crawler policy; environment-level deployment variables still control server credentials.
