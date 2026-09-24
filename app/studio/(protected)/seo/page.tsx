import { getManagedArticles } from "@/lib/studio/content";
import { StudioPageHeader } from "@/components/studio/studio-shell";
import SeoWorkspace from "@/components/studio/seo-workspace";

export const dynamic = "force-dynamic";

export default async function StudioSeoPage() {
  const articles = await getManagedArticles();
  const rows = articles.map((article) => ({ slug: article.slug, title: article.frontmatter.title, status: article.frontmatter.status, tags: article.frontmatter.tags, topics: article.frontmatter.topics, metaTitle: article.frontmatter.metaTitle, metaDescription: article.frontmatter.metaDescription, tldr: article.frontmatter.tldr, coverImage: article.frontmatter.coverImage }));
  return <><StudioPageHeader eyebrow="Discovery / SEO" title="Search and answer engines" description="Review the signals that help people and answer systems understand the Field Notes. Recommendations stay separate from article content." /><SeoWorkspace articles={rows} /></>;
}
