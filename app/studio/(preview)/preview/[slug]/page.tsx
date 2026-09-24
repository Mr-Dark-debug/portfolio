import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getManagedArticle } from "@/lib/studio/content";
import { getPostBySlug, getAdjacentPosts, getRelatedPosts, extractTableOfContents } from "@/lib/blog/utils";
import { renderSafeMarkdown, calculateReadingTime } from "@/lib/studio/markdown";
import { embedsFromFrontmatter } from "@/lib/studio/embeds";
import { STUDIO_SESSION_COOKIE, verifyPreviewToken, verifyStudioSession } from "@/lib/studio/auth";
import BlogPostClient from "@/app/[locale]/blog/posts/[slug]/BlogPostClient";
import type { BlogPost } from "@/lib/blog/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true }, title: "Preview · Field Notes" };

async function previewPost(slug: string): Promise<BlogPost | null> {
  const managed = await getManagedArticle(slug);
  if (!managed) return getPostBySlug(slug, true);
  const data = managed.frontmatter;
  return { slug: data.slug, title: data.title, date: data.publishedAt || data.scheduledAt || "", publishedAt: data.publishedAt || undefined, timezone: data.timezone, updatedAt: data.updatedAt || undefined, scheduledAt: data.scheduledAt || undefined, status: data.status, author: data.author, subtitle: data.subtitle || undefined, excerpt: data.excerpt || data.description || "", tldr: data.tldr || undefined, tldrSource: data.tldrSource || undefined, tags: data.tags, topics: data.topics, categories: data.categories, featured: data.featured, published: false, coverImage: data.coverImage || undefined, coverImageAlt: data.coverImageAlt || undefined, coverVideo: data.coverVideo || undefined, image: data.coverImage || undefined, readingTime: data.readingTime || calculateReadingTime(managed.body), content: await renderSafeMarkdown(managed.body, data.title), body: managed.body, searchText: managed.body.toLowerCase(), socialEmbeds: embedsFromFrontmatter(data as unknown as Record<string, unknown>), metaTitle: data.metaTitle || undefined, metaDescription: data.metaDescription || undefined, canonical: data.canonical || undefined, ogTitle: data.ogTitle || undefined, ogDescription: data.ogDescription || undefined, ogImage: data.ogImage || undefined, seoKeywords: data.seoKeywords, keywords: data.keywords, entities: data.entities, faqs: data.faqs, externalReferences: data.externalReferences, references: data.references, relatedPosts: data.relatedPosts, series: data.series, discussionUrl: data.discussionUrl || undefined, archivedAt: data.archivedAt || undefined, archivePublic: data.archivePublic };
}

export default async function StudioPreviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ token?: string; viewport?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await verifyStudioSession((await cookies()).get(STUDIO_SESSION_COOKIE)?.value);
  if (!session && !(await verifyPreviewToken(query.token, slug))) notFound();
  const post = await previewPost(slug);
  if (!post) notFound();
  const adjacent = await getAdjacentPosts(slug);
  const related = await getRelatedPosts(slug);
  const messages = await getMessages({ locale: "en" });
  return <NextIntlClientProvider locale="en" timeZone="Europe/Berlin" messages={messages}><div data-preview-viewport={query.viewport === "mobile" ? "mobile" : "desktop"} style={query.viewport === "mobile" ? { maxWidth: 390, margin: "0 auto", borderLeft: "1px solid #c4b5fd30", borderRight: "1px solid #c4b5fd30" } : undefined}><div className="studio-alert" style={{ margin: "1rem" }} role="status">Protected Studio preview · not indexed · <a href={`/studio/posts/${slug}`}>Return to editor</a></div><BlogPostClient post={post} previousPost={adjacent.previous} nextPost={adjacent.next} relatedPosts={related} toc={extractTableOfContents(post.content)} /></div></NextIntlClientProvider>;
}
