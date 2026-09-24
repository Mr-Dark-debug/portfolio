import { beforeEach, describe, expect, it, vi } from "vitest";

const posts = [
  { slug: "public-note", title: "Public & safe", excerpt: "A published note", date: "2025-01-01T00:00:00.000Z", publishedAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-02T00:00:00.000Z", tags: ["engineering"], topics: ["systems"], readingTime: 3 },
];
vi.mock("next-intl/navigation", () => ({ createNavigation: () => ({}) }));
vi.mock("../navigation", () => ({ locales: ["en"] }));
vi.mock("../lib/blog/utils", () => ({ getAllPosts: vi.fn(async () => posts), getPostBySlug: vi.fn(async (slug: string) => slug === "public-note" ? { ...posts[0], body: "Public body", content: "<p>Public body</p>" } : null) }));
import { GET as rss } from "../app/rss.xml/route";
import { GET as llms } from "../app/llms.txt/route";
import { GET as llmsFull } from "../app/llms-full.txt/route";
import sitemap from "../app/sitemap";

describe("public discovery resources", () => {
  beforeEach(() => vi.clearAllMocks());
  it("writes escaped RSS items and no draft fields", async () => {
    const response = await rss();
    const text = await response.text();
    expect(text).toContain("Public &amp; safe");
    expect(text).toContain("/en/blog/posts/public-note");
    expect(text).not.toContain("draft");
  });
  it("includes only public articles in LLM discovery files", async () => {
    const compact = await (await llms()).text();
    const full = await (await llmsFull()).text();
    expect(compact).toContain("public-note");
    expect(full).toContain("Public body");
    expect(compact).not.toContain("captainscabin");
    expect(full).not.toContain("secret-draft");
  });
  it("keeps Studio out of the sitemap", async () => {
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.includes("/studio"))).toBe(false);
    expect(entries.some((entry) => entry.url.includes("/en/blog/posts/public-note"))).toBe(true);
  });
});
