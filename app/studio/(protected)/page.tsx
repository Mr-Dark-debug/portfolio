import Link from "next/link";
import { ArrowUpRight, BarChart3, FilePlus2, FolderOpen, ImagePlus, PenLine, Share2 } from "lucide-react";
import { getManagedArticles, studioActivity } from "@/lib/studio/content";
import { getAnalyticsSnapshot } from "@/lib/studio/analytics";
import { StudioPageHeader } from "@/components/studio/studio-shell";
import AnalyticsChart from "@/components/studio/analytics-chart";

export const dynamic = "force-dynamic";

function countStatus(articles: Awaited<ReturnType<typeof getManagedArticles>>, status: string) {
  return articles.filter((article) => article.frontmatter.status === status).length;
}

export default async function StudioDashboardPage() {
  const [articlesResult, analytics, activity] = await Promise.allSettled([getManagedArticles(), getAnalyticsSnapshot({ days: 30 }), studioActivity()]);
  const articles = articlesResult.status === "fulfilled" ? articlesResult.value : [];
  const snapshot = analytics.status === "fulfilled" ? analytics.value : null;
  const recentActivity = activity.status === "fulfilled" ? activity.value : [];
  const published = articles.filter((article) => article.frontmatter.status === "published");
  const drafts = articles.filter((article) => article.frontmatter.status === "draft" || article.frontmatter.status === "local-draft");
  const scheduled = articles.filter((article) => article.frontmatter.status === "scheduled");
  const totalViews = snapshot?.totals?.pageviews;
  const timeline = snapshot?.timeline || [];
  return <>
    <StudioPageHeader eyebrow="Control room / overview" title="Good work needs a clear surface." description="A quiet place to inspect what is live, what is next, and what still needs your judgment." actions={<><Link className="studio-button studio-button-primary" href="/studio/posts/new"><FilePlus2 aria-hidden="true" /> New post</Link><Link className="studio-button studio-button-secondary" href="/studio/media"><ImagePlus aria-hidden="true" /> Upload media</Link></>} />
    {!articlesResult || articlesResult.status === "rejected" ? <div className="studio-alert studio-alert-warning" role="status"><BarChart3 aria-hidden="true" /><span>Content storage is temporarily unavailable. Local development can continue; configure GitHub content variables for hosted editing.</span></div> : null}
    <div className="studio-stat-grid" style={{ marginTop: articlesResult.status === "rejected" ? "1rem" : undefined }}>
      <div className="studio-stat"><span className="studio-stat-label">Views / 30 days</span><strong className="studio-stat-value">{totalViews?.toLocaleString() ?? "—"}</strong><span className="studio-stat-note">{snapshot?.totals ? "Vercel aggregate" : snapshot?.message || "Analytics API not configured"}</span></div>
      <div className="studio-stat"><span className="studio-stat-label">Visitors / 30 days</span><strong className="studio-stat-value">{snapshot?.totals?.visitors?.toLocaleString() ?? "—"}</strong><span className="studio-stat-note">Anonymous, aggregated</span></div>
      <div className="studio-stat"><span className="studio-stat-label">Published notes</span><strong className="studio-stat-value">{published.length}</strong><span className="studio-stat-note">{countStatus(articles, "archived")} archived</span></div>
      <div className="studio-stat"><span className="studio-stat-label">In progress</span><strong className="studio-stat-value">{drafts.length + scheduled.length}</strong><span className="studio-stat-note">{scheduled.length} scheduled</span></div>
    </div>
    <div className="studio-dashboard-grid">
      <div className="studio-dashboard-stack">
        <section className="studio-card"><div className="studio-card-header"><div><h2>Traffic pulse</h2><p>Page views from the last 30 days when the Vercel API is available.</p></div><Link className="studio-button studio-button-quiet" href="/studio/analytics">Open analytics <ArrowUpRight aria-hidden="true" /></Link></div>{snapshot?.totals ? <AnalyticsChart rows={timeline} /> : <div className="studio-empty"><BarChart3 aria-hidden="true" /><strong>Analytics unavailable</strong><p>{snapshot?.message || "Add the server-only Vercel variables to see real aggregate traffic here."}</p></div>}</section>
        <section className="studio-card"><div className="studio-card-header"><div><h2>Recent Field Notes</h2><p>Newest content across local and committed drafts.</p></div><Link className="studio-button studio-button-quiet" href="/studio/posts">All posts <ArrowUpRight aria-hidden="true" /></Link></div><div className="studio-list">{articles.slice(0, 5).map((article) => <Link className="studio-list-row" href={`/studio/posts/${article.slug}`} key={article.slug}><span><strong>{article.frontmatter.title}</strong><small>{article.frontmatter.status} · {article.frontmatter.readingTime || 1} min read</small></span><ArrowUpRight aria-hidden="true" /></Link>)}{!articles.length ? <div className="studio-empty"><PenLine aria-hidden="true" /><strong>No Field Notes yet</strong><p>Start with a local draft, then decide when it is ready for the repository.</p></div> : null}</div></section>
      </div>
      <div className="studio-dashboard-stack">
        <section className="studio-card"><div className="studio-card-header"><div><h2>Quick actions</h2><p>Common publishing moves.</p></div></div><div className="studio-quick-actions"><Link className="studio-quick-action" href="/studio/posts/new"><FilePlus2 aria-hidden="true" /><span>New post</span></Link><Link className="studio-quick-action" href="/studio/media"><FolderOpen aria-hidden="true" /><span>Upload media</span></Link><Link className="studio-quick-action" href="/studio/analytics"><BarChart3 aria-hidden="true" /><span>View analytics</span></Link><Link className="studio-quick-action" href="/studio/social"><Share2 aria-hidden="true" /><span>Add social item</span></Link></div></section>
        <section className="studio-card"><div className="studio-card-header"><div><h2>Next on the desk</h2><p>Scheduled and recently edited work.</p></div></div><div className="studio-list">{scheduled.slice(0, 4).map((article) => <Link className="studio-list-row" href={`/studio/posts/${article.slug}`} key={article.slug}><span><strong>{article.frontmatter.title}</strong><small>{article.frontmatter.scheduledAt ? new Date(article.frontmatter.scheduledAt).toLocaleString() : "Time to confirm"}</small></span><span className="studio-badge studio-badge-scheduled">Scheduled</span></Link>)}{!scheduled.length ? <div className="studio-empty"><PenLine aria-hidden="true" /><strong>Nothing scheduled</strong><p>Schedule a note when the story and search intent are ready.</p></div> : null}</div></section>
        <section className="studio-card"><div className="studio-card-header"><div><h2>CMS activity</h2><p>GitHub history when connected.</p></div></div><div className="studio-list">{recentActivity.slice(0, 5).map((item) => <div className="studio-list-row" key={item.sha}><span><strong>{item.message}</strong><small>{item.author} · {new Date(item.date).toLocaleDateString()}</small></span></div>)}{!recentActivity.length ? <div className="studio-empty"><PenLine aria-hidden="true" /><strong>No remote activity</strong><p>Connect GitHub content storage to see commit history here.</p></div> : null}</div></section>
      </div>
    </div>
  </>;
}
