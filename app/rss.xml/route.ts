import { getAllPosts } from '@/lib/blog/utils';
import { SITE_URL } from '@/lib/site';
export const revalidate=3600;
const xml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function GET(){const posts=await getAllPosts();return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Prashant Choudhary — Field notes</title><link>${SITE_URL}/en/blog</link><description>AI systems, research and software engineering.</description><language>en</language>${posts.map(p=>`<item><title>${xml(p.title)}</title><link>${SITE_URL}/en/blog/posts/${p.slug}</link><guid>${SITE_URL}/en/blog/posts/${p.slug}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${xml(p.excerpt)}</description></item>`).join('')}</channel></rss>`,{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, s-maxage=3600'}});}
