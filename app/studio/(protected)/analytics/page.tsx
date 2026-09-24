import { getAnalyticsSnapshot } from "@/lib/studio/analytics";
import { getManagedArticle } from "@/lib/studio/content";
import { StudioPageHeader } from "@/components/studio/studio-shell";
import AnalyticsView from "@/components/studio/analytics-view";

export const dynamic = "force-dynamic";

export default async function StudioAnalyticsPage({ searchParams }: { searchParams: Promise<{ slug?: string; days?: string }> }) {
  const query = await searchParams;
  const days = Math.min(365, Math.max(1, Number(query.days || 30)));
  const article = query.slug ? await getManagedArticle(query.slug) : null;
  const path = article ? `/en/blog/posts/${article.slug}` : undefined;
  const snapshot = await getAnalyticsSnapshot({ days, path });
  return <><StudioPageHeader eyebrow="Signals / analytics" title={article ? article.frontmatter.title : "Analytics"} description={article ? `Article performance for ${article.frontmatter.title}. Only aggregate, anonymous data is shown.` : "Real Vercel aggregates for the portfolio and Field Notes. Unavailable dimensions stay unavailable."} /><AnalyticsView initialSnapshot={snapshot} articleSlug={article?.slug} /></>;
}
