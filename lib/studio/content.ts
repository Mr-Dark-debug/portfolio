import "server-only";
import {
  articleContentPath,
  deleteFile,
  getActivity,
  getRevisions,
  getTextFile,
  listMarkdownFiles,
  putTextFile,
  type GithubCommit,
  type ManagedFile,
} from "./github";
import { parseArticleMarkdown, serializeArticle, calculateReadingTime } from "./markdown";
import { socialSettingsSchema, socialItemSchema, type ArticleDocument, type ArticleFrontmatter, type SocialItem, type SocialSettings } from "./schema";
import { normalizeSocialEmbeds } from "./embeds";

export interface ManagedArticle {
  slug: string;
  path: string;
  sha?: string;
  frontmatter: ArticleFrontmatter;
  body: string;
  source: "github" | "local";
  invalid?: string;
}

function pathSlug(filePath: string): string {
  return filePath.split("/").pop()?.replace(/\.md$/i, "") || "";
}

function toManagedArticle(file: ManagedFile): ManagedArticle {
  try {
    const document = parseArticleMarkdown(file.content, pathSlug(file.path));
    return { slug: document.frontmatter.slug || pathSlug(file.path), path: file.path, sha: file.sha, frontmatter: document.frontmatter, body: document.body, source: file.source };
  } catch (error) {
    return {
      slug: pathSlug(file.path),
      path: file.path,
      sha: file.sha,
      frontmatter: {
        title: pathSlug(file.path),
        slug: pathSlug(file.path).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "invalid-post",
        author: "Prashant Choudhary",
        status: "draft",
        timezone: "Europe/Berlin",
        featured: false,
        tags: [],
        topics: [],
        categories: [],
        seoKeywords: [],
        keywords: [],
        entities: [],
        faqs: [],
        tldrSource: undefined,
        coverImageAlt: undefined,
        archivePublic: false,
        youtube: [],
        instagram: [],
        facebook: [],
        twitter: [],
        linkedin: [],
        github: [],
        externalReferences: [],
        references: [],
        relatedPosts: [],
        socialEmbeds: [],
      },
      body: file.content,
      source: file.source,
      invalid: error instanceof Error ? error.message : "Invalid article metadata",
    };
  }
}

export async function getManagedArticles(): Promise<ManagedArticle[]> {
  const files = [
    ...(await listMarkdownFiles("data/posts")),
    ...(await listMarkdownFiles("data/drafts")),
  ];
  const result = files.map(toManagedArticle);
  const bySlug = new Map<string, ManagedArticle>();
  for (const article of result) {
    const previous = bySlug.get(article.slug);
    if (!previous || article.path.startsWith("data/posts/")) bySlug.set(article.slug, article);
  }
  return [...bySlug.values()].sort((a, b) => {
    const aDate = Date.parse(a.frontmatter.publishedAt || a.frontmatter.scheduledAt || a.frontmatter.updatedAt || "0");
    const bDate = Date.parse(b.frontmatter.publishedAt || b.frontmatter.scheduledAt || b.frontmatter.updatedAt || "0");
    return bDate - aDate;
  });
}

export async function getManagedArticle(slug: string): Promise<ManagedArticle | null> {
  const articles = await getManagedArticles();
  return articles.find((article) => article.slug === slug) || null;
}

function commitMessage(frontmatter: ArticleFrontmatter, action: "save" | "publish" | "schedule" | "unpublish" | "archive") {
  const verb = action === "publish" ? "publish" : action === "schedule" ? "schedule" : action === "unpublish" ? "unpublish" : action === "archive" ? "archive" : "update";
  return `content(blog): ${verb} "${frontmatter.title.replace(/[\r\n"]/g, " ").slice(0, 100)}"`;
}

export async function saveManagedArticle(document: ArticleDocument, action: "save" | "publish" | "schedule" | "unpublish" | "archive" = "save", expectedSha?: string): Promise<ManagedArticle> {
  const frontmatter = {
    ...document.frontmatter,
    slug: document.frontmatter.slug,
    updatedAt: new Date().toISOString(),
    readingTime: document.frontmatter.readingTime || calculateReadingTime(document.body),
  };
  const normalized: ArticleDocument = { frontmatter, body: document.body };
  const nextStatus = action === "publish" ? "published" : action === "schedule" ? "scheduled" : action === "unpublish" ? "draft" : action === "archive" ? "archived" : frontmatter.status;
  normalized.frontmatter = { ...frontmatter, status: nextStatus, ...(nextStatus === "scheduled" ? { publishedAt: frontmatter.scheduledAt } : {}) };
  if (nextStatus === "published" && !normalized.frontmatter.publishedAt) normalized.frontmatter.publishedAt = new Date().toISOString();
  if (nextStatus === "scheduled" && !normalized.frontmatter.scheduledAt) throw new Error("A scheduled article needs a future date and time");
  const content = serializeArticle(normalized.frontmatter, normalized.body);
  const current = await getManagedArticle(normalized.frontmatter.slug);
  const oldPath = current?.path;
  const targetPath = articleContentPath(normalized.frontmatter.slug, nextStatus === "draft" || nextStatus === "local-draft");
  const written = await putTextFile(targetPath, content, commitMessage(normalized.frontmatter, action), expectedSha || (targetPath === current?.path ? current.sha : undefined));
  if (oldPath && oldPath !== targetPath) await deleteFile(oldPath, `content(blog): move "${normalized.frontmatter.title.replace(/[\r\n"]/g, " ").slice(0, 100)}"`, current.sha);
  return toManagedArticle(written);
}

export async function renameManagedArticle(slug: string, newSlug: string, document: ArticleDocument, expectedSha?: string): Promise<ManagedArticle> {
  if (newSlug === slug) return saveManagedArticle(document, "save", expectedSha);
  const current = await getManagedArticle(slug);
  if (!current) throw new Error("Article not found");
  if (await getManagedArticle(newSlug)) throw new Error("A different article already uses that slug");
  const next = { ...document.frontmatter, slug: newSlug, updatedAt: new Date().toISOString() };
  const targetPath = articleContentPath(newSlug, next.status === "draft" || next.status === "local-draft");
  const written = await putTextFile(targetPath, serializeArticle(next, document.body), `content(blog): rename "${current.frontmatter.title.replace(/[\r\n"]/g, " ").slice(0, 100)}" → "${next.title.replace(/[\r\n"]/g, " ").slice(0, 100)}"`);
  await deleteFile(current.path, `content(blog): rename "${current.frontmatter.title.replace(/[\r\n"]/g, " ").slice(0, 100)}"`, current.sha);
  return toManagedArticle(written);
}

export async function removeManagedArticle(slug: string): Promise<void> {
  const article = await getManagedArticle(slug);
  if (!article) throw new Error("Article not found");
  await deleteFile(article.path, `content(blog): delete "${article.frontmatter.title.replace(/[\r\n"]/g, " ").slice(0, 100)}"`, article.sha);
}

export async function articleRevisions(slug: string): Promise<GithubCommit[]> {
  const article = await getManagedArticle(slug);
  return article ? getRevisions(article.path) : [];
}

export async function studioActivity(): Promise<GithubCommit[]> {
  return getActivity();
}

const socialPath = "data/studio/social.json";
const settingsPath = "data/studio/settings.json";

export async function getSocialItems(): Promise<SocialItem[]> {
  const file = await getTextFile(socialPath);
  if (!file) return [];
  try {
    const value = JSON.parse(file.content) as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      const parsed = socialItemSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    }).sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function saveSocialItems(items: SocialItem[]): Promise<SocialItem[]> {
  const valid = items.flatMap((item) => {
    const parsed = socialItemSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
  await putTextFile(socialPath, `${JSON.stringify(valid, null, 2)}\n`, "content(social): update curated links");
  return valid;
}

export function defaultSettings(): SocialSettings {
  return socialSettingsSchema.parse({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://prashant.sbs",
    defaultAiModel: process.env.AI_MODEL || process.env.GROQ_MODEL || null,
  });
}

export async function getSettings(): Promise<SocialSettings> {
  const file = await getTextFile(settingsPath);
  if (!file) return defaultSettings();
  try {
    return socialSettingsSchema.parse({ ...defaultSettings(), ...JSON.parse(file.content) });
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(settings: SocialSettings): Promise<SocialSettings> {
  const parsed = socialSettingsSchema.parse(settings);
  await putTextFile(settingsPath, `${JSON.stringify(parsed, null, 2)}\n`, "content(studio): update settings");
  return parsed;
}

export function articleEmbeds(article: ManagedArticle) {
  return normalizeSocialEmbeds(article.frontmatter.socialEmbeds);
}
