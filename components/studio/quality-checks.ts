import type { ArticleFrontmatter } from "@/lib/studio/schema";

export interface ClientQualityCheck { level: "error" | "warning" | "info" | "ok"; message: string; }

export function clientQualityChecks(frontmatter: ArticleFrontmatter, body: string): ClientQualityCheck[] {
  const checks: ClientQualityCheck[] = [];
  const add = (level: ClientQualityCheck["level"], message: string) => checks.push({ level, message });
  if (!frontmatter.title.trim()) add("error", "Add a title before publishing.");
  if (frontmatter.title.length > 70) add("warning", "Title is longer than 70 characters.");
  if (!frontmatter.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.slug)) add("error", "Use a lowercase, hyphenated slug.");
  if (!frontmatter.excerpt?.trim()) add("warning", "Add an excerpt for the Field Notes index.");
  if (frontmatter.excerpt && frontmatter.excerpt.length > 180) add("warning", "Keep the excerpt close to 160 characters.");
  if (!frontmatter.metaTitle?.trim()) add("warning", "Add a meta title.");
  if (frontmatter.metaTitle && (frontmatter.metaTitle.length < 30 || frontmatter.metaTitle.length > 60)) add("info", "Aim for a 30–60 character meta title.");
  if (!frontmatter.metaDescription?.trim()) add("warning", "Add a meta description.");
  if (frontmatter.metaDescription && (frontmatter.metaDescription.length < 70 || frontmatter.metaDescription.length > 160)) add("info", "Aim for a 70–160 character meta description.");
  if (!frontmatter.tldr?.trim()) add("info", "Add a TL;DR for fast readers and answer engines.");
  if (!frontmatter.coverImage?.trim() && !frontmatter.coverVideo?.trim()) add("info", "Add a cover image or hero video.");
  if (frontmatter.coverImage && !frontmatter.coverImageAlt?.trim()) add("warning", "Add descriptive cover image alt text.");
  if (!frontmatter.tags.length) add("warning", "Add at least one tag.");
  if (!frontmatter.topics.length) add("info", "Add a topic for discovery.");
  if (!body.trim()) add("error", "The article body is empty.");
  if (/^#\s+/m.test(body)) add("warning", "Keep the article title as H1 and start body headings at H2.");
  if (/<\/?(?:script|iframe|object|embed|form)\b/i.test(body)) add("error", "Remove executable or embedded HTML.");
  if (!/\[[^\]]+\]\(\/(?:en|de|[a-z]{2}-[A-Z]{2})\//.test(body)) add("info", "Consider one descriptive internal Field Notes link.");
  if (!/\[[^\]]+\]\(https?:\/\//.test(body) && !frontmatter.externalReferences.length) add("info", "Add a source or reference when the article makes external claims.");
  if (frontmatter.status === "scheduled" && (!frontmatter.scheduledAt || Date.parse(frontmatter.scheduledAt) <= Date.now())) add("error", "Choose a future schedule time.");
  if (!checks.some((check) => check.level === "error")) add("ok", "Required publication fields are ready.");
  return checks;
}
