import { existsSync } from "node:fs";
import path from "node:path";
import { renderSafeMarkdown, parseArticleMarkdown, calculateReadingTime, extractTableOfContents as extractRenderedTableOfContents } from "@/lib/studio/markdown";
import { embedsFromFrontmatter, extractEmbedDirectives, normalizeSocialEmbeds } from "@/lib/studio/embeds";
import { isPublicStatus, statusForDates, type ArticleStatus } from "@/lib/studio/schema";
import { storedPosts, persistPost, removePost, validSlug, type StoredPost } from "./storage";
import type { BlogPost, BlogPostMeta, TableOfContentsItem } from "./types";

export { validSlug } from "./storage";
export { calculateReadingTime } from "@/lib/studio/markdown";

export function isPublished(post: { published?: boolean; status?: ArticleStatus; date?: string; publishedAt?: string; scheduledAt?: string }): boolean {
  const status = statusForDates(post.status, post.publishedAt || post.date, post.scheduledAt, post.published);
  const effectiveDate = post.status === "scheduled" && post.scheduledAt ? post.scheduledAt : post.publishedAt || post.date;
  return isPublicStatus(status, effectiveDate);
}

function validImagePath(value: string | null | undefined): string | undefined {
  if (!value || value.length > 2000 || value.includes("..") || value.includes("\0")) return undefined;
  if (/^https:\/\//i.test(value)) return value;
  if (!/^\/(?!\/)/.test(value)) return undefined;
  return existsSync(path.join(process.cwd(), "public", value)) ? value : undefined;
}

async function parse(row: StoredPost): Promise<BlogPost> {
  const document = parseArticleMarkdown(row.markdown, row.slug);
  const data = document.frontmatter;
  const publishedAt = data.status === "scheduled" && data.scheduledAt ? data.scheduledAt : data.publishedAt || data.scheduledAt || data.date;
  const status = statusForDates(data.status, publishedAt || undefined, data.scheduledAt || undefined, data.published);
  const body = document.body;
  const coverImage = validImagePath(data.coverImage || data.image);
  const socialEmbeds = normalizeSocialEmbeds([...embedsFromFrontmatter(data as unknown as Record<string, unknown>), ...extractEmbedDirectives(body).embeds]);
  const excerpt = data.excerpt || data.description || "";
  return {
    slug: data.slug || row.slug,
    title: data.title,
    date: publishedAt || "",
    publishedAt: publishedAt || undefined,
    updatedAt: data.updatedAt || undefined,
    scheduledAt: data.scheduledAt || undefined,
    timezone: data.timezone,
    status,
    author: data.author,
    subtitle: data.subtitle || undefined,
    excerpt,
    tldr: data.tldr || undefined,
    tldrSource: data.tldrSource || undefined,
    tags: data.tags,
    topics: data.topics,
    categories: data.categories,
    featured: data.featured,
    published: !row.draft && isPublicStatus(status, publishedAt || undefined, Date.now(), data.archivePublic),
    coverImage,
    coverImageAlt: data.coverImageAlt || undefined,
    coverVideo: data.coverVideo || undefined,
    image: coverImage,
    readingTime: data.readingTime || calculateReadingTime(body),
    content: await renderSafeMarkdown(body, data.title),
    body,
    searchText: `${data.title} ${data.subtitle || ""} ${excerpt} ${body} ${data.tags.join(" ")} ${data.topics.join(" ")} ${data.categories.join(" ")}`.toLowerCase(),
    socialEmbeds,
    metaTitle: data.metaTitle || undefined,
    metaDescription: data.metaDescription || undefined,
    canonical: data.canonical || undefined,
    ogTitle: data.ogTitle || undefined,
    ogDescription: data.ogDescription || undefined,
    ogImage: data.ogImage || data.socialPreviewImage || coverImage,
    seoKeywords: data.seoKeywords,
    keywords: data.keywords,
    entities: data.entities,
    faqs: data.faqs,
    externalReferences: data.externalReferences,
    references: data.references,
    relatedPosts: data.relatedPosts,
    series: data.series,
    discussionUrl: data.discussionUrl || undefined,
    archivedAt: data.archivedAt || undefined,
    archivePublic: data.archivePublic,
  };
}

function publicMeta(post: BlogPost): BlogPostMeta {
  const { content: _content, body: _body, ...meta } = post;
  return meta;
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const parsed = await Promise.allSettled((await storedPosts()).filter((row) => !row.draft).map(parse));
  return parsed.flatMap((result) => result.status === "fulfilled" && result.value.published && result.value.status === "published" ? [publicMeta(result.value)] : []).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export async function getAllPostsWithDrafts(): Promise<BlogPostMeta[]> {
  const parsed = await Promise.allSettled((await storedPosts()).map(parse));
  return parsed.flatMap((result) => result.status === "fulfilled" ? [publicMeta(result.value)] : []).sort((a, b) => Date.parse(b.date || b.updatedAt || "0") - Date.parse(a.date || a.updatedAt || "0"));
}

export async function getPostBySlug(slug: string, includeDraft = false): Promise<BlogPost | null> {
  if (!validSlug(slug)) return null;
  const row = (await storedPosts()).find((candidate) => candidate.slug === slug);
  if (!row) return null;
  try {
    const post = await parse(row);
    return includeDraft || post.published ? post : null;
  } catch {
    return null;
  }
}

export async function getRawPostContent(slug: string, _isDraft = false): Promise<string | null> {
  if (!validSlug(slug)) return null;
  return (await storedPosts()).find((row) => row.slug === slug)?.markdown || null;
}

export async function savePost(slug: string, content: string, isDraft = false): Promise<boolean> {
  if (!validSlug(slug) || typeof content !== "string" || content.length > 200000 || typeof isDraft !== "boolean") return false;
  try {
    parseArticleMarkdown(content, slug);
  } catch {
    return false;
  }
  await persistPost(slug, content, isDraft);
  return true;
}

export async function deletePost(slug: string): Promise<boolean> {
  if (!validSlug(slug)) return false;
  await removePost(slug);
  return true;
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}

export function extractTableOfContents(content: string): TableOfContentsItem[] {
  return extractRenderedTableOfContents(content).map((item) => ({ level: item.level, id: item.id, text: item.text }));
}

export async function getAllTags(): Promise<string[]> {
  return [...new Set((await getAllPosts()).flatMap((post) => [...post.tags, ...post.topics]))].sort((a, b) => a.localeCompare(b));
}

export async function getPostsByTag(tag: string): Promise<BlogPostMeta[]> {
  return (await getAllPosts()).filter((post) => post.tags.includes(tag) || post.topics.includes(tag));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function getAdjacentPosts(slug: string) {
  const posts = await getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  return { previous: index >= 0 ? posts[index + 1] || null : null, next: index > 0 ? posts[index - 1] : null };
}

export async function getRelatedPosts(slug: string): Promise<BlogPostMeta[]> {
  const posts = await getAllPosts();
  const current = posts.find((post) => post.slug === slug);
  if (!current) return [];
  const manual = current.relatedPosts.map((relatedSlug) => posts.find((post) => post.slug === relatedSlug)).filter((post): post is BlogPostMeta => Boolean(post));
  const candidates = posts.filter((post) => post.slug !== slug && !manual.some((item) => item.slug === post.slug));
  const automatic = candidates
    .map((post) => {
      const sharedTags = post.tags.filter((tag) => current.tags.includes(tag)).length;
      const sharedTopics = post.topics.filter((topic) => current.topics.includes(topic)).length;
      const sharedEntities = post.entities.filter((entity) => current.entities.includes(entity)).length;
      const titleWords = new Set(current.title.toLowerCase().split(/\W+/).filter((word) => word.length > 3));
      const titleOverlap = post.title.toLowerCase().split(/\W+/).filter((word) => titleWords.has(word)).length;
      return { post, score: sharedTags * 4 + sharedTopics * 5 + sharedEntities * 6 + titleOverlap };
    })
    .sort((a, b) => b.score - a.score || Date.parse(b.post.date) - Date.parse(a.post.date))
    .map(({ post }) => post);
  return [...manual, ...automatic].slice(0, 4);
}
