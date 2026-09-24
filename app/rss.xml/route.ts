import { getAllPosts } from "@/lib/blog/utils";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getAllPosts();
  const items = posts.map((post) => {
    const url = `${SITE_URL}/en/blog/posts/${post.slug}`;
    const categories = [...post.tags, ...post.topics].map((value) => `<category>${escapeXml(value)}</category>`).join("");
    return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><pubDate>${new Date(post.publishedAt || post.date).toUTCString()}</pubDate><dc:creator>${escapeXml(post.author)}</dc:creator><description>${escapeXml(post.excerpt)}</description>${categories}</item>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Prashant Choudhary — Field notes</title><link>${SITE_URL}/en/blog</link><description>AI systems, research, and software engineering.</description><language>en</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
