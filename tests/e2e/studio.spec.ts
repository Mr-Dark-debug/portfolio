import { test, expect } from "@playwright/test";

test("public Field Notes and discovery remain available while Studio is private", async ({ page, request }) => {
  await page.goto("/en/blog");
  await expect(page.getByRole("heading", { name: "Field notes.", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Explore the archive" })).toBeVisible();
  await expect((await request.get("/en/blog")).ok()).toBeTruthy();
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/login/);
  expect((await request.get("/studio")).status()).toBe(200);
  expect((await request.get("/api/studio/posts")).status()).toBe(401);
  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
  expect((await request.get("/llms.txt")).ok()).toBeTruthy();
  expect((await request.get("/llms-full.txt")).ok()).toBeTruthy();
});

test("Studio login rejects bad credentials", async ({ page }) => {
  await page.goto("/studio/login");
  await page.getByLabel("Username").fill("wrong");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Enter Studio" }).click();
  const alert = page.locator(".studio-login-error");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/incorrect|not configured/i);
});

test("Studio publishing flow can be exercised when E2E credentials are supplied", async ({ page }) => {
  test.skip(!process.env.STUDIO_E2E_USERNAME || !process.env.STUDIO_E2E_PASSWORD, "Set STUDIO_E2E_USERNAME and STUDIO_E2E_PASSWORD for authenticated Studio E2E coverage.");
  await page.goto("/studio/login");
  await page.getByLabel("Username").fill(process.env.STUDIO_E2E_USERNAME || "");
  await page.getByLabel("Password").fill(process.env.STUDIO_E2E_PASSWORD || "");
  await page.getByRole("button", { name: "Enter Studio" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.getByRole("heading", { name: /Good work needs a clear surface/ })).toBeVisible();
  const api = (url: string, init: RequestInit = {}) => page.evaluate(async ({ url, init: requestInit }) => { const response = await fetch(url, { ...requestInit, headers: { "Content-Type": "application/json", ...(requestInit.headers || {}) } }); return { status: response.status, body: await response.json() }; }, { url, init });
  const slug = `studio-e2e-${Date.now()}`;
  const frontmatter = { title: "Studio E2E Note", slug, subtitle: null, excerpt: "A temporary article used to verify the protected publishing flow.", author: process.env.STUDIO_E2E_USERNAME || "owner", status: "draft", publishedAt: null, updatedAt: null, scheduledAt: null, timezone: "Europe/Berlin", tags: ["testing"], topics: ["studio"], categories: [], featured: false, coverImage: null, coverImageAlt: null, coverVideo: null, readingTime: 1, tldr: null, tldrSource: "manual", metaTitle: null, metaDescription: null, canonical: null, ogTitle: null, ogDescription: null, ogImage: null, socialPreviewImage: null, seoKeywords: [], keywords: [], entities: [], faqs: [], youtube: [], instagram: [], facebook: [], twitter: [], linkedin: [], github: [], externalReferences: [], references: [], relatedPosts: [], socialEmbeds: [], series: null, discussionUrl: null, archivedAt: null, archivePublic: false, published: false };
  const created = await api("/api/studio/posts", { method: "POST", body: JSON.stringify({ slug, frontmatter, body: "## Verification\n\nThis temporary note is deleted by the test.", action: "save" }) });
  expect(created.status).toBe(201);
  const loaded = await api(`/api/studio/posts/${slug}`);
  expect(loaded.status).toBe(200);
  const article = loaded.body.article;
  const scheduled = await api(`/api/studio/posts/${slug}`, { method: "PATCH", body: JSON.stringify({ slug, frontmatter: { ...article.frontmatter, scheduledAt: new Date(Date.now() + 3600000).toISOString() }, body: article.body, action: "schedule", expectedSha: article.sha }) });
  expect(scheduled.status).toBe(200);
  expect((await page.request.get(`/api/blog/posts/${slug}`)).status()).toBe(404);
  const current = await api(`/api/studio/posts/${slug}`);
  const published = await api(`/api/studio/posts/${slug}`, { method: "PATCH", body: JSON.stringify({ slug, frontmatter: { ...current.body.article.frontmatter, status: "published", publishedAt: new Date().toISOString(), scheduledAt: null }, body: current.body.article.body, action: "publish", expectedSha: current.body.article.sha }) });
  expect(published.status).toBe(200);
  expect((await page.request.get(`/api/blog/posts/${slug}`)).status()).toBe(200);
  const preview = await page.goto(`/studio/preview/${slug}`);
  expect(preview?.status()).toBe(200);
  const unpublished = await api(`/api/studio/posts/${slug}`, { method: "PATCH", body: JSON.stringify({ slug, frontmatter: published.body.article.frontmatter, body: article.body, action: "unpublish", expectedSha: published.body.article.sha }) });
  expect(unpublished.status).toBe(200);
  expect((await page.request.get(`/api/blog/posts/${slug}`)).status()).toBe(404);
  const archived = await api(`/api/studio/posts/${slug}`, { method: "PATCH", body: JSON.stringify({ slug, frontmatter: unpublished.body.article.frontmatter, body: article.body, action: "archive", expectedSha: unpublished.body.article.sha }) });
  expect(archived.status).toBe(200);
  expect((await page.request.get(`/api/blog/posts/${slug}`)).status()).toBe(404);
  const removed = await api(`/api/studio/posts/${slug}`, { method: "DELETE" });
  expect(removed.status).toBe(200);
});
