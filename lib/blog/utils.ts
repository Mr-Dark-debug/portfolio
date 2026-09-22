import matter from 'gray-matter';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import { readingStructure } from './reading-structure';
import { storedPosts, persistPost, removePost, validSlug, type StoredPost } from './storage';
import type { BlogPost, BlogPostMeta, TableOfContentsItem } from './types';
export { validSlug } from './storage';
export const isPublished = (post: { published: boolean; date: string }) => post.published === true && Number.isFinite(Date.parse(post.date)) && Date.parse(post.date) <= Date.now();
async function parse(row: StoredPost): Promise<BlogPost> {
 const { data, content } = matter(row.markdown);
 const rendered = String(await remark().use(remarkGfm).use(readingStructure, { title: String(data.title || row.slug) }).use(html, { sanitize: true }).process(content)).replace(/<h1>/g, "<h2>").replace(/<\/h1>/g, "</h2>");
 const seen = new Map<string, number>();
 const withIds = rendered.replace(/<h([1-6])>([\s\S]*?)<\/h[1-6]>/g, (_, level, text) => {
  const base = generateSlug(text.replace(/<[^>]+>/g, '')) || 'section';
  const count = seen.get(base) || 0; seen.set(base, count + 1);
  return `<h${level} id="${base}${count ? `-${count}` : ''}">${text}</h${level}>`;
 });
 return { slug: row.slug, title: String(data.title || row.slug), date: data.date instanceof Date ? data.date.toISOString() : String(data.date || ''),
  author: String(data.author || 'Prashant Choudhary'), excerpt: String(data.excerpt || data.description || ''),
  tags: Array.isArray(data.tags) ? data.tags.map(String) : [], published: !row.draft && data.published === true,
  image: typeof data.image === 'string' && (/^https:\/\//.test(data.image) || (/^\/(?!\/)/.test(data.image) && !data.image.includes('..') && existsSync(path.join(process.cwd(),'public',data.image)))) ? data.image : undefined,
  readingTime: calculateReadingTime(content), content: withIds,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : data.updatedAt ? new Date(data.updatedAt).toISOString() : undefined };
}
export async function getAllPosts(): Promise<BlogPostMeta[]> {
 const posts = await Promise.all((await storedPosts()).filter(row => !row.draft).map(parse));
 return posts.filter(isPublished).map(({ content, ...meta }) => meta).sort((a,b) => Date.parse(b.date)-Date.parse(a.date));
}
export async function getAllPostsWithDrafts(): Promise<BlogPostMeta[]> {
 return (await Promise.all((await storedPosts()).map(parse))).map(({content, ...meta})=>meta).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
}
export async function getPostBySlug(slug: string, includeDraft = false): Promise<BlogPost | null> {
 if (!validSlug(slug)) return null;
 const row = (await storedPosts()).find(row => row.slug === slug);
 if (!row) return null;
 const post = await parse(row);
 return includeDraft || isPublished(post) ? post : null;
}
export async function getRawPostContent(slug: string, _isDraft = false): Promise<string | null> {
 if (!validSlug(slug)) return null;
 return (await storedPosts()).find(row=>row.slug===slug)?.markdown || null;
}
export async function savePost(slug: string, content: string, isDraft = false): Promise<boolean> {
 if (!validSlug(slug) || typeof content !== 'string' || content.length > 200000 || typeof isDraft !== 'boolean') return false;
 const {data} = matter(content);
 if (typeof data.title !== 'string' || !data.title.trim() || !Number.isFinite(Date.parse(String(data.date)))) return false;
 await persistPost(slug, content, isDraft); return true;
}
export async function deletePost(slug: string): Promise<boolean> { if (!validSlug(slug)) return false; await removePost(slug); return true; }
export function calculateReadingTime(content: string): number { return Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 200)); }
export function generateSlug(title: string): string { return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
export function extractTableOfContents(content: string): TableOfContentsItem[] {
 return [...content.matchAll(/<h([1-6])[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h[1-6]>/g)].map(m=>({ level:Number(m[1]), id:m[2], text:m[3].replace(/<[^>]+>/g,'') }));
}
export async function getAllTags() { return [...new Set((await getAllPosts()).flatMap(post=>post.tags))].sort(); }
export async function getPostsByTag(tag: string) { return (await getAllPosts()).filter(post=>post.tags.includes(tag)); }
export function formatDate(date: string) { return new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); }
export async function getAdjacentPosts(slug: string) {
 const posts=await getAllPosts(); const index=posts.findIndex(post=>post.slug===slug);
 return { previous:index >= 0 ? posts[index+1] || null : null, next:index > 0 ? posts[index-1] : null };
}
export async function getRelatedPosts(slug: string) {
 const posts=await getAllPosts(); const current=posts.find(p=>p.slug===slug);
 return posts.filter(p=>p.slug!==slug).sort((a,b)=>b.tags.filter(t=>current?.tags.includes(t)).length-a.tags.filter(t=>current?.tags.includes(t)).length).slice(0,3);
}
