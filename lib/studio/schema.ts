import { z } from "zod";

export const articleStatuses = [
  "local-draft",
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

export type ArticleStatus = (typeof articleStatuses)[number];

const optionalString = z.string().trim().max(2000).optional().nullable();
const urlList = z.array(z.string().trim().url().max(2000)).max(100).default([]);
const tagList = z.array(z.string().trim().min(1).max(80)).max(50).default([]);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens.");

export const socialEmbedSchema = z.object({
  provider: z.enum([
    "youtube",
    "instagram",
    "facebook",
    "x",
    "linkedin",
    "github",
    "link",
  ]),
  url: z.string().trim().url().max(2000),
  title: z.string().trim().max(240).optional(),
  description: z.string().trim().max(1000).optional(),
  thumbnail: z.string().trim().max(2000).optional(),
  stars: z.number().int().min(0).max(100000000).optional(),
  language: z.string().trim().max(80).optional(),
  start: z.number().int().min(0).max(86400).optional(),
});

export type SocialEmbed = z.infer<typeof socialEmbedSchema>;

export const faqSchema = z.object({ question: z.string().trim().min(1).max(240), answer: z.string().trim().min(1).max(2000) });

export const articleFrontmatterSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: slugSchema,
  subtitle: optionalString,
  excerpt: z.string().trim().max(500).optional().nullable(),
  description: optionalString,
  author: z.string().trim().min(1).max(120).default("Prashant Choudhary"),
  status: z.enum(articleStatuses).default("draft"),
  publishedAt: optionalString,
  updatedAt: optionalString,
  scheduledAt: optionalString,
  timezone: z.string().trim().min(1).max(80).default("Europe/Berlin"),
  date: optionalString,
  tags: tagList,
  topics: tagList,
  categories: tagList,
  featured: z.boolean().default(false),
  coverImage: optionalString,
  coverImageAlt: optionalString,
  coverVideo: optionalString,
  image: optionalString,
  readingTime: z.number().int().min(1).max(1000).optional(),
  tldr: optionalString,
  tldrSource: z.enum(["manual", "ai"]).optional().nullable(),
  metaTitle: optionalString,
  metaDescription: optionalString,
  canonical: optionalString,
  ogTitle: optionalString,
  ogDescription: optionalString,
  ogImage: optionalString,
  socialPreviewImage: optionalString,
  seoKeywords: tagList,
  keywords: tagList,
  entities: tagList,
  faqs: z.array(faqSchema).max(20).default([]),
  youtube: urlList,
  instagram: urlList,
  facebook: urlList,
  twitter: urlList,
  linkedin: urlList,
  github: urlList,
  externalReferences: urlList,
  references: urlList,
  relatedPosts: z.array(slugSchema).max(20).default([]),
  socialEmbeds: z.array(socialEmbedSchema).max(50).default([]),
  series: z
    .object({
      name: z.string().trim().min(1).max(120),
      order: z.number().int().min(1).max(1000),
    })
    .nullable()
    .optional(),
  discussionUrl: optionalString,
  archivedAt: optionalString,
  archivePublic: z.boolean().default(false),
  published: z.boolean().optional(),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

export const articleDocumentSchema = z.object({
  frontmatter: articleFrontmatterSchema,
  body: z.string().max(200000),
});

export type ArticleDocument = z.infer<typeof articleDocumentSchema>;

export const articleMutationSchema = z.object({
  slug: slugSchema,
  frontmatter: articleFrontmatterSchema,
  body: z.string().max(200000),
  expectedSha: z.string().trim().max(100).optional(),
});

export const socialItemSchema = z.object({
  id: z.string().trim().min(1).max(100),
  provider: socialEmbedSchema.shape.provider,
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(1000).optional().nullable(),
  thumbnail: z.string().trim().max(2000).optional().nullable(),
  url: z.string().trim().url().max(2000),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).max(10000).default(0),
  publishedAt: z.string().trim().max(100).optional().nullable(),
});

export type SocialItem = z.infer<typeof socialItemSchema>;

export const socialSettingsSchema = z.object({
  defaultAuthor: z.string().trim().min(1).max(120).default("Prashant Choudhary"),
  defaultOgImage: optionalString,
  defaultMetaDescription: optionalString,
  siteUrl: z.string().trim().url().default("https://prashant.sbs"),
  postsPerPage: z.number().int().min(1).max(100).default(10),
  defaultAiModel: z.string().trim().max(120).optional().nullable(),
  defaultTldrStyle: z.string().trim().max(80).default("concise"),
  defaultSocialImageStyle: z.string().trim().max(80).default("field-notes"),
  rssTitle: z.string().trim().min(1).max(160).default("Prashant Choudhary — Field notes"),
  rssDescription: z.string().trim().min(1).max(500).default("AI systems, research, and software engineering."),
  externalMediaConsent: z.enum(["ask", "allow", "deny"]).default("ask"),
  externalMediaConsentCopy: z.string().trim().max(300).default("Load external content only when you choose."),
  aiCrawlerPolicy: z.enum(["allow", "block"]).default("allow"),
  publicSocialLinks: z.object({ github: optionalString, linkedin: optionalString, x: optionalString, instagram: optionalString }).default({}),
  timezone: z.string().trim().min(1).max(80).default("Europe/Berlin"),
  defaultPublicationTime: z.string().trim().regex(/^\d{2}:\d{2}$/).default("09:00"),
});

export type SocialSettings = z.infer<typeof socialSettingsSchema>;

export const analyticsEventSchema = z.enum([
  "project_open",
  "project_github_click",
  "article_open",
  "blog_share",
  "youtube_open",
  "instagram_open",
  "linkedin_open",
  "facebook_open",
  "github_open",
  "resume_click",
  "contact_click",
  "code_copy",
  "table_of_contents_click",
  "related_article_click",
  "social_embed_load",
]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

export function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function statusForDates(
  status: ArticleStatus | undefined,
  publishedAt: string | undefined,
  scheduledAt: string | undefined,
  legacyPublished: boolean | undefined,
  now = Date.now(),
): ArticleStatus {
  if (status === "archived" || status === "local-draft" || status === "draft") return status ?? "draft";
  if (status === "scheduled") return scheduledAt && Date.parse(scheduledAt) <= now ? "published" : "scheduled";
  if (status === "published") {
    if (publishedAt && Date.parse(publishedAt) > now) return "scheduled";
    return "published";
  }
  if (legacyPublished === true) {
    if (publishedAt && Date.parse(publishedAt) > now) return "scheduled";
    return "published";
  }
  return "draft";
}

export function isPublicStatus(status: ArticleStatus, publishedAt: string | undefined, now = Date.now(), archivePublic = false): boolean {
  if (status === "archived") return archivePublic && (!publishedAt || Date.parse(publishedAt) <= now);
  if (status === "scheduled") return Boolean(publishedAt && Date.parse(publishedAt) <= now);
  return status === "published" && (!publishedAt || Date.parse(publishedAt) <= now);
}
