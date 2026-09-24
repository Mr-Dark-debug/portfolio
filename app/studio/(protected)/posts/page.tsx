import { getManagedArticles } from "@/lib/studio/content";
import { getAnalyticsSnapshot } from "@/lib/studio/analytics";
import { StudioPageHeader } from "@/components/studio/studio-shell";
import PostsTable from "@/components/studio/posts-table";

export const dynamic = "force-dynamic";

export default async function StudioPostsPage() {
  const [articles, analytics] = await Promise.all([getManagedArticles(), getAnalyticsSnapshot({ days: 30 })]);
  const rows = articles.map((article) => ({ slug: article.slug, path: article.path, sha: article.sha, frontmatter: article.frontmatter, invalid: article.invalid }));
  const viewsBySlug: Record<string, number> = {};
  if (analytics.totals) for (const row of analytics.topPages) {
    const route = row.requestPath;
    const views = row.pageviews;
    if (typeof route !== "string" || typeof views !== "number") continue;
    const slug = route.match(/^\/[a-z]{2}\/blog\/posts\/([a-z0-9-]+)\/?$/)?.[1];
    if (slug) viewsBySlug[slug] = (viewsBySlug[slug] || 0) + views;
  }
  return <><StudioPageHeader eyebrow="Content library" title="Field Notes" description="Write locally, commit deliberately, and keep every publication state visible." /><div className="studio-alert studio-alert-warning" role="note"><strong>Public repository drafts:</strong> a committed draft is readable by anyone who can access the repository. Use Save locally for unfinished private work; choose Save draft to repository only when that visibility is intentional.</div><PostsTable initialArticles={rows} viewsBySlug={viewsBySlug} /></>;
}
