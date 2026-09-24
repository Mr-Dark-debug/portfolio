import { describe, expect, it } from "vitest";
import { renderSafeMarkdown, parseArticleMarkdown, serializeArticle, qualityChecks } from "../lib/studio/markdown";
import { isPublicStatus, statusForDates } from "../lib/studio/schema";
import { extractEmbedDirectives, providerFromUrl, youtubeVideoId } from "../lib/studio/embeds";

describe("Studio article model", () => {
  it("validates and round-trips the extended frontmatter", () => {
    const source = `---\ntitle: "A useful note"\nslug: a-useful-note\nstatus: published\npublishedAt: 2025-01-01T10:00:00.000Z\ntags: [AI, engineering]\ntopics: [ai-systems]\ntldr: "A concise answer."\nmetaTitle: "A useful note"\nmetaDescription: "A practical explanation of the system and its limits."\n---\n\n## Context\n\nBody`;
    const document = parseArticleMarkdown(source, "fallback");
    expect(document.frontmatter.slug).toBe("a-useful-note");
    expect(document.frontmatter.tags).toEqual(["AI", "engineering"]);
    expect(serializeArticle(document.frontmatter, document.body)).toContain("tldr");
  });

  it("calculates scheduled visibility without mutating the record", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(statusForDates("scheduled", undefined, future, false)).toBe("scheduled");
    expect(statusForDates("scheduled", past, future, false)).toBe("scheduled");
    expect(statusForDates("scheduled", undefined, past, false)).toBe("published");
    expect(isPublicStatus("scheduled", future)).toBe(false);
    expect(isPublicStatus("scheduled", past)).toBe(true);
    expect(statusForDates(undefined, undefined, undefined, true)).toBe("published");
  });

  it("sanitizes executable HTML and unsafe links", async () => {
    const html = await renderSafeMarkdown("## Safe section\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n[good](https://example.com)", "A different title");
    expect(html).toContain('id="safe-section"');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("https://example.com");
  });

  it("reports useful publication checks without a fake score", () => {
    const document = parseArticleMarkdown(`---\ntitle: "A note"\nslug: a-note\nstatus: scheduled\n---\nBody`, "a-note");
    const checks = qualityChecks(document);
    expect(checks.some((check) => check.level === "error")).toBe(true);
    expect(checks.every((check) => typeof check.message === "string")).toBe(true);
  });

  it("recognizes provider URLs and extracts safe embed directives", () => {
    expect(providerFromUrl("https://www.youtube.com/watch?v=abc12345678")).toBe("youtube");
    expect(providerFromUrl("https://github.com/Mr-Dark-debug/portfolio")).toBe("github");
    expect(youtubeVideoId("https://youtu.be/abc12345678")).toBe("abc12345678");
    const result = extractEmbedDirectives("Before\n\n:::embed https://www.youtube.com/watch?v=abc12345678\n\nAfter");
    expect(result.embeds[0]?.provider).toBe("youtube");
    expect(result.markdown).not.toContain(":::embed");
  });
});
