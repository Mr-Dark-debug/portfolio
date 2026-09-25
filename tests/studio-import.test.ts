import { describe, expect, it } from "vitest";
import { importDocument } from "../lib/studio/import-document";
import { applySeoSuggestion } from "../lib/studio/seo-apply";
import { readFileSync } from "node:fs";

describe("Studio document import", () => {
  it("fills the editor from the supplied Markdown format and keeps it a draft", async () => {
    const source = `---
title: "A Cloned Voice Needs a Lifecycle, Not a Magic Trick"
date: 2026-09-25
slug: a-cloned-voice-needs-a-lifecycle
excerpt: "A practical lifecycle for cloned voices."
tags: AI, voice technology, developer tooling
status: DRAFT_READY
---

# A Cloned Voice Needs a Lifecycle, Not a Magic Trick

This is the first useful paragraph.

## Sources

- [Documentation](https://example.org/docs)
`;
    const { document, warnings } = await importDocument("draft.md", Buffer.from(source));
    expect(document.frontmatter.title).toBe("A Cloned Voice Needs a Lifecycle, Not a Magic Trick");
    expect(document.frontmatter.tags).toEqual(["ai", "voice technology", "developer tooling"]);
    expect(document.frontmatter.status).toBe("draft");
    expect(document.frontmatter.publishedAt).toBeNull();
    expect(document.body).toContain("## Sources");
    expect(document.body).not.toMatch(/^# A Cloned/);
    expect(warnings).toContain("Imported as a draft. Review it before saving or publishing.");
  });

  it("rejects unsupported and empty documents", async () => {
    await expect(importDocument("draft.pdf", Buffer.from("text"))).rejects.toThrow(/Markdown/);
    await expect(importDocument("draft.md", Buffer.from(""))).rejects.toThrow(/body/);
  });

  it("converts a Word document exported from an editor to Markdown", async () => {
    const fixture = readFileSync("node_modules/mammoth/test/test-data/single-paragraph.docx");
    const { document } = await importDocument("google-export.docx", fixture);
    expect(document.frontmatter.title).toBe("google export");
    expect(document.frontmatter.status).toBe("draft");
    expect(document.body).toBe("Walking on imported air");
  });

  it("applies array and topic suggestions to real editor fields", async () => {
    const { document } = await importDocument("note.md", Buffer.from("# Note\n\nA useful article paragraph."));
    const suggestions = { topic: "AI Systems", tags: ["Engineering"], faq: [{ question: "Why?", answer: "For clarity." }] };
    const topic = applySeoSuggestion(document.frontmatter, suggestions, "topic");
    const tags = applySeoSuggestion(topic, suggestions, "tags");
    const faq = applySeoSuggestion(tags, suggestions, "faq");
    expect(faq.topics).toEqual(["ai systems"]);
    expect(faq.tags).toEqual(["engineering"]);
    expect(faq.faqs).toEqual(suggestions.faq);
  });
});
