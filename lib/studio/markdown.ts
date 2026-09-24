import matter from "gray-matter";
import sanitizeHtml from "sanitize-html";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import { readingStructure } from "@/lib/blog/reading-structure";
import { extractEmbedDirectives } from "./embeds";
import {
  articleFrontmatterSchema,
  normalizeDate,
  slugify,
  statusForDates,
  type ArticleDocument,
  type ArticleFrontmatter,
  type ArticleStatus,
} from "./schema";

const headingPattern = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;

export function calculateReadingTime(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\[\]()]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function countWords(markdown: string): number {
  return markdown.trim() ? markdown.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function countCharacters(markdown: string): number {
  return markdown.length;
}

export function generateHeadingId(text: string, seen: Map<string, number>): string {
  const base = slugify(text.replace(/<[^>]+>/g, "")) || "section";
  const count = seen.get(base) || 0;
  seen.set(base, count + 1);
  return count ? `${base}-${count}` : base;
}

function addHeadingIds(rendered: string): string {
  const seen = new Map<string, number>();
  return rendered.replace(headingPattern, (_match, level: string, attrs: string, inner: string) => {
    const id = generateHeadingId(inner, seen);
    const cleanAttrs = attrs.replace(/\s+id="[^"]*"/gi, "");
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });
}

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "a",
    "abbr",
    "blockquote",
    "br",
    "code",
    "del",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"],
    pre: ["class"],
    th: ["align"],
    td: ["align"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: "a",
      attribs: {
        ...attribs,
        rel: "nofollow noopener noreferrer",
        ...(attribs.target === "_blank" ? { target: "_blank" } : {}),
      },
    }),
    img: (_tagName, attribs) => ({
      tagName: "img",
      attribs: { ...attribs, loading: "lazy" },
    }),
  },
};

export async function renderSafeMarkdown(markdown: string, title = "Article"): Promise<string> {
  const { markdown: cleaned } = extractEmbedDirectives(markdown);
  const rendered = String(
    await remark()
      .use(remarkGfm)
      .use(readingStructure, { title })
      .use(html, { sanitize: true })
      .process(cleaned),
  )
    .replace(/<h1>/g, "<h2>")
    .replace(/<\/h1>/g, "</h2>");
  return addHeadingIds(sanitizeHtml(rendered, sanitizeOptions));
}

export function parseArticleMarkdown(markdown: string, fallbackSlug: string): ArticleDocument {
  const parsed = matter(markdown);
  const raw = parsed.data as Record<string, unknown>;
  const publishedAt = normalizeDate(raw.publishedAt ?? raw.date);
  const scheduledAt = normalizeDate(raw.scheduledAt);
  const status = statusForDates(
    typeof raw.status === "string" ? (raw.status as ArticleStatus) : undefined,
    publishedAt,
    scheduledAt,
    raw.published === true,
  );
  const candidate = {
    ...raw,
    title: raw.title ?? "Untitled article",
    slug: raw.slug ?? fallbackSlug,
    author: raw.author ?? "Prashant Choudhary",
    status,
    date: normalizeDate(raw.date),
    publishedAt,
    updatedAt: normalizeDate(raw.updatedAt),
    scheduledAt,
    timezone: typeof raw.timezone === "string" ? raw.timezone : "Europe/Berlin",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    seoKeywords: Array.isArray(raw.seoKeywords) ? raw.seoKeywords : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    entities: Array.isArray(raw.entities) ? raw.entities : [],
    faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
    relatedPosts: Array.isArray(raw.relatedPosts) ? raw.relatedPosts : [],
    socialEmbeds: Array.isArray(raw.socialEmbeds) ? raw.socialEmbeds : [],
    youtube: Array.isArray(raw.youtube) ? raw.youtube : [],
    instagram: Array.isArray(raw.instagram) ? raw.instagram : [],
    facebook: Array.isArray(raw.facebook) ? raw.facebook : [],
    twitter: Array.isArray(raw.twitter) ? raw.twitter : [],
    linkedin: Array.isArray(raw.linkedin) ? raw.linkedin : [],
    github: Array.isArray(raw.github) ? raw.github : [],
    externalReferences: Array.isArray(raw.externalReferences) ? raw.externalReferences : [],
    references: Array.isArray(raw.references) ? raw.references : [],
    coverImageAlt: typeof raw.coverImageAlt === "string" ? raw.coverImageAlt : undefined,
    tldrSource: raw.tldrSource === "ai" || raw.tldrSource === "manual" ? raw.tldrSource : undefined,
    archivedAt: normalizeDate(raw.archivedAt),
    archivePublic: raw.archivePublic === true,
    featured: raw.featured === true,
    published: status === "published",
  };
  const result = articleFrontmatterSchema.safeParse(candidate);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid article metadata");
  }
  return { frontmatter: result.data, body: parsed.content.trim() };
}

export function serializeArticle(frontmatter: ArticleFrontmatter, body: string): string {
  const data: Record<string, unknown> = {
    title: frontmatter.title,
    slug: frontmatter.slug,
    subtitle: frontmatter.subtitle || null,
    excerpt: frontmatter.excerpt || frontmatter.description || null,
    author: frontmatter.author,
    status: frontmatter.status,
    publishedAt: frontmatter.publishedAt || null,
    updatedAt: frontmatter.updatedAt || new Date().toISOString(),
    scheduledAt: frontmatter.scheduledAt || null,
    timezone: frontmatter.timezone,
    tags: frontmatter.tags,
    topics: frontmatter.topics,
    categories: frontmatter.categories,
    featured: frontmatter.featured,
    coverImage: frontmatter.coverImage || frontmatter.image || null,
    coverImageAlt: frontmatter.coverImageAlt || null,
    coverVideo: frontmatter.coverVideo || null,
    readingTime: frontmatter.readingTime ?? calculateReadingTime(body),
    tldr: frontmatter.tldr || null,
    tldrSource: frontmatter.tldrSource || null,
    metaTitle: frontmatter.metaTitle || null,
    metaDescription: frontmatter.metaDescription || null,
    canonical: frontmatter.canonical || null,
    ogTitle: frontmatter.ogTitle || null,
    ogDescription: frontmatter.ogDescription || null,
    ogImage: frontmatter.ogImage || frontmatter.socialPreviewImage || frontmatter.coverImage || null,
    socialPreviewImage: frontmatter.socialPreviewImage || null,
    seoKeywords: frontmatter.seoKeywords,
    keywords: frontmatter.keywords,
    entities: frontmatter.entities,
    faqs: frontmatter.faqs,
    youtube: frontmatter.youtube,
    instagram: frontmatter.instagram,
    facebook: frontmatter.facebook,
    twitter: frontmatter.twitter,
    linkedin: frontmatter.linkedin,
    github: frontmatter.github,
    externalReferences: frontmatter.externalReferences,
    references: frontmatter.references,
    relatedPosts: frontmatter.relatedPosts,
    socialEmbeds: frontmatter.socialEmbeds,
    series: frontmatter.series || null,
    discussionUrl: frontmatter.discussionUrl || null,
    archivedAt: frontmatter.archivedAt || null,
    archivePublic: frontmatter.archivePublic,
  };
  return matter.stringify(`\n${body.trim()}\n`, data);
}

export function extractTableOfContents(markdown: string): { level: number; id: string; text: string }[] {
  return [...markdown.matchAll(/<h([2-4])(?:\s+[^>]*)?\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi)].map(
    (match) => ({ level: Number(match[1]), id: match[2], text: match[3].replace(/<[^>]+>/g, "").trim() }),
  );
}

export function extractLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi)]
    .map((match) => match[1])
    .filter((url, index, values) => values.indexOf(url) === index);
}

export function qualityChecks(document: ArticleDocument): { level: "error" | "warning" | "info"; message: string }[] {
  const { frontmatter, body } = document;
  const checks: { level: "error" | "warning" | "info"; message: string }[] = [];
  if (!frontmatter.title.trim()) checks.push({ level: "error", message: "Add a title." });
  if (frontmatter.title.length > 70) checks.push({ level: "warning", message: "Title is longer than 70 characters." });
  if (!frontmatter.excerpt?.trim()) checks.push({ level: "warning", message: "Add an excerpt for archive previews." });
  if (frontmatter.excerpt && frontmatter.excerpt.length > 180) checks.push({ level: "warning", message: "Keep the excerpt near 160 characters." });
  if (!frontmatter.metaTitle?.trim()) checks.push({ level: "warning", message: "Add a focused meta title." });
  if (frontmatter.metaTitle && (frontmatter.metaTitle.length < 30 || frontmatter.metaTitle.length > 60)) checks.push({ level: "info", message: "Aim for a 30–60 character meta title." });
  if (!frontmatter.metaDescription?.trim()) checks.push({ level: "warning", message: "Add a meta description." });
  if (frontmatter.metaDescription && (frontmatter.metaDescription.length < 70 || frontmatter.metaDescription.length > 160)) checks.push({ level: "info", message: "Aim for a 70–160 character meta description." });
  if (!frontmatter.tldr?.trim()) checks.push({ level: "info", message: "Add a TL;DR for readers and answer engines." });
  if (!frontmatter.coverImage?.trim() && !frontmatter.coverVideo?.trim()) checks.push({ level: "info", message: "Add a cover image or video." });
  if (!frontmatter.tags.length) checks.push({ level: "warning", message: "Add at least one tag." });
  if (!frontmatter.topics.length) checks.push({ level: "info", message: "Add a topic to improve discovery." });
  if (!extractLinks(body).length) checks.push({ level: "info", message: "Add a source or reference link where relevant." });
  if (!/\]\(\/(?:en|de|[a-z]{2}-[A-Z]{2})\//.test(body)) checks.push({ level: "info", message: "Consider one descriptive internal link." });
  if (/^#\s+/m.test(body)) checks.push({ level: "warning", message: "Article body headings should start at H2." });
  if (/<\/?(?:script|iframe|object|embed|form)\b/i.test(body)) checks.push({ level: "error", message: "Remove executable or embedded HTML from Markdown." });
  if (frontmatter.status === "scheduled" && (!frontmatter.scheduledAt || Date.parse(frontmatter.scheduledAt) <= Date.now())) checks.push({ level: "error", message: "Choose a future schedule time." });
  if (frontmatter.status === "published" && frontmatter.publishedAt && Date.parse(frontmatter.publishedAt) > Date.now()) checks.push({ level: "error", message: "Published articles cannot have a future publication time." });
  return checks;
}
