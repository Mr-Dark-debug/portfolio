import type { SeoSuggestions } from "./ai";
import type { ArticleFrontmatter } from "./schema";

export const editableSeoKeys = ["metaTitle", "metaDescription", "excerpt", "slug", "topic", "tags", "entities", "tldr", "ogTitle", "ogDescription", "primaryTopic", "secondaryTopics", "faq"] as const;
export type EditableSeoKey = (typeof editableSeoKeys)[number];

export function applySeoSuggestion(frontmatter: ArticleFrontmatter, suggestions: SeoSuggestions, key: EditableSeoKey): ArticleFrontmatter {
  const value = suggestions[key];
  if (!value || (Array.isArray(value) && !value.length)) return frontmatter;
  const next = { ...frontmatter };
  if (key === "topic" || key === "primaryTopic") next.topics = [...new Set([...next.topics, String(value).trim().toLowerCase()])];
  else if (key === "secondaryTopics" && Array.isArray(value)) next.topics = [...new Set([...next.topics, ...value.filter((item): item is string => typeof item === "string").map((item) => item.trim().toLowerCase())])];
  else if (key === "tags" && Array.isArray(value)) next.tags = [...new Set([...next.tags, ...value.filter((item): item is string => typeof item === "string").map((item) => item.trim().toLowerCase())])];
  else if (key === "entities" && Array.isArray(value)) next.entities = [...new Set([...next.entities, ...value.filter((item): item is string => typeof item === "string").map((item) => item.trim())])];
  else if (key === "faq" && Array.isArray(value)) next.faqs = value.filter((item): item is { question: string; answer: string } => typeof item === "object" && item !== null).slice(0, 20);
  else if (key === "tldr" && typeof value === "string") { next.tldr = value; next.tldrSource = "ai"; }
  else if (key === "slug" && typeof value === "string") next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
  else if (["metaTitle", "metaDescription", "excerpt", "ogTitle", "ogDescription"].includes(key) && typeof value === "string") {
    Object.assign(next, { [key]: value });
  }
  return next;
}
