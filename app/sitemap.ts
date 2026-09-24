import type { MetadataRoute } from "next";
import { locales } from "@/navigation";
import { SITE_URL } from "@/lib/site";
import { getAllPosts } from "@/lib/blog/utils";
import { caseStudies } from "@/lib/case-studies";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const paths = ["", "/blog", "/resume", "/projects", "/services/saas-mvp", "/services/nextjs-audit", ...caseStudies.map((project) => `/projects/${project.slug}`)];
  const pages = locales.flatMap((locale) => paths.map((entry) => ({
    url: `${SITE_URL}/${locale}${entry}`,
    alternates: { languages: { ...Object.fromEntries(locales.map((value) => [value, `${SITE_URL}/${value}${entry}`])), "x-default": `${SITE_URL}/en${entry}` } },
  })));
  // A translated shell does not make the English article a translated page.
  const articles = posts.map((post) => ({
    url: `${SITE_URL}/en/blog/posts/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt || post.date),
  }));
  return [...pages, ...articles];
}
