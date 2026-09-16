import type { MetadataRoute } from 'next';
import { locales } from '@/navigation';
import { SITE_URL } from '@/lib/site';
import { getAllPosts } from '@/lib/blog/utils';
import { caseStudies } from '@/lib/case-studies';
export const revalidate=3600;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const posts=await getAllPosts();const paths=['','/blog','/resume','/projects','/services/saas-mvp','/services/nextjs-audit',...caseStudies.map(p=>`/projects/${p.slug}`)];
 const entries=paths.map(path=>({path,lastModified:undefined as Date|undefined})).concat(posts.map(p=>({path:`/blog/posts/${p.slug}`,lastModified:new Date(p.updatedAt||p.date)})));
 return locales.flatMap(locale=>entries.map(entry=>({url:`${SITE_URL}/${locale}${entry.path}`,lastModified:entry.lastModified,alternates:{languages:{...Object.fromEntries(locales.map(l=>[l,`${SITE_URL}/${l}${entry.path}`])),'x-default':`${SITE_URL}/en${entry.path}`}}})));
}
