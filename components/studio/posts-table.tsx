"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, BarChart3, CalendarClock, Copy, Edit3, Eye, EyeOff, FilePlus2, Filter, MoreHorizontal, Search, Send, Trash2, UploadCloud } from "lucide-react";
import type { ArticleFrontmatter } from "@/lib/studio/schema";
import { studioFetch, formatDateTime, deploymentMessage, type DeploymentRequest } from "./studio-api";

export interface StudioArticleRow { slug: string; path: string; sha?: string; frontmatter: ArticleFrontmatter; invalid?: string; }

const statusLabels: Record<string, string> = { published: "Published", scheduled: "Scheduled", draft: "Draft", "local-draft": "Local draft", archived: "Archived" };

export default function PostsTable({ initialArticles, viewsBySlug }: { initialArticles: StudioArticleRow[]; viewsBySlug: Record<string, number> }) {
  const [articles, setArticles] = useState(initialArticles);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<"updated-desc" | "published-desc" | "title-asc" | "views-desc">("updated-desc");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [scheduleSlug, setScheduleSlug] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");
  const tags = useMemo(() => [...new Set(articles.flatMap((article) => article.frontmatter.tags))].sort(), [articles]);
  const filtered = useMemo(() => articles.filter((article) => {
    const haystack = `${article.frontmatter.title} ${article.frontmatter.excerpt || ""} ${article.frontmatter.tags.join(" ")}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && (status === "all" || article.frontmatter.status === status) && (tag === "all" || article.frontmatter.tags.includes(tag)) && (!featuredOnly || article.frontmatter.featured);
  }).sort((a, b) => {
    if (sort === "title-asc") return a.frontmatter.title.localeCompare(b.frontmatter.title);
    if (sort === "views-desc") return (viewsBySlug[b.slug] ?? -1) - (viewsBySlug[a.slug] ?? -1);
    const field = sort === "published-desc" ? "publishedAt" : "updatedAt";
    return Date.parse(b.frontmatter[field] || "0") - Date.parse(a.frontmatter[field] || "0");
  }), [articles, query, status, tag, featuredOnly, sort, viewsBySlug]);
  const refresh = async () => setArticles((await studioFetch<StudioArticleRow[]>("/api/studio/posts")).map((article) => ({ ...article, sha: article.sha })));
  const load = async (slug: string) => studioFetch<{ article: { slug: string; path: string; sha?: string; source: "github" | "local"; frontmatter: ArticleFrontmatter; body: string } }>(`/api/studio/posts/${slug}`);
  const update = async (slug: string, action: "save" | "publish" | "schedule" | "unpublish" | "archive", scheduledAt?: string) => {
    setBusy(slug); setMessage("");
    try {
      const result = await load(slug);
      const frontmatter = { ...result.article.frontmatter, ...(scheduledAt ? { scheduledAt, status: "scheduled" as const } : {}) };
      const saved = await studioFetch<{ deployment: DeploymentRequest }>(`/api/studio/posts/${slug}`, { method: "PATCH", body: JSON.stringify({ slug, frontmatter, body: result.article.body, action, expectedSha: result.article.sha }) });
      await refresh();
      setMessage((action === "publish" ? "Publication committed." : action === "schedule" ? "Schedule committed." : action === "archive" ? "Post archived in the content store." : action === "unpublish" ? "Post moved to draft in the content store." : "Post saved.") + deploymentMessage(saved.deployment));
    } catch (error) { setMessage(error instanceof Error ? error.message : "The post could not be updated."); }
    finally { setBusy(null); }
  };
  const duplicate = async (slug: string) => {
    setBusy(slug); setMessage("");
    try {
      const result = await load(slug);
      if (result.article.source === "github" && !window.confirm("Create a committed draft copy? This repository is public, so the draft Markdown will be readable on GitHub.")) return;
      const nextSlug = `${slug}-copy`;
      await studioFetch("/api/studio/posts", { method: "POST", body: JSON.stringify({ slug: nextSlug, frontmatter: { ...result.article.frontmatter, slug: nextSlug, title: `${result.article.frontmatter.title} (copy)`, status: "draft", publishedAt: null, scheduledAt: null }, body: result.article.body, action: "save" }) });
      await refresh();
      setMessage(result.article.source === "github" ? "A committed draft copy was created. Its Markdown is readable on public GitHub." : "A local draft copy was created.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The post could not be duplicated."); }
    finally { setBusy(null); }
  };
  const remove = async (slug: string) => {
    if (!window.confirm(`Delete “${articles.find((article) => article.slug === slug)?.frontmatter.title || slug}”? This removes the Markdown file.`)) return;
    setBusy(slug); setMessage("");
    try { await studioFetch(`/api/studio/posts/${slug}`, { method: "DELETE" }); await refresh(); setMessage("Post deleted."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The post could not be deleted."); }
    finally { setBusy(null); }
  };
  const openSchedule = (article: StudioArticleRow) => {
    const date = article.frontmatter.scheduledAt ? new Date(article.frontmatter.scheduledAt) : new Date(Date.now() + 86400000);
    setScheduleSlug(article.slug);
    setScheduleValue(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };
  return <>
    <section className="studio-card"><div className="studio-filter-bar"><label className="studio-search"><Search aria-hidden="true" /><span className="studio-visually-hidden">Search posts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, excerpt, or tag" /></label><label className="studio-visually-hidden" htmlFor="post-status">Filter status</label><select className="studio-select" id="post-status" value={status} onChange={(event) => setStatus(event.target.value)} style={{ width: "9.5rem" }}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><label className="studio-visually-hidden" htmlFor="post-tag">Filter tag</label><select className="studio-select" id="post-tag" value={tag} onChange={(event) => setTag(event.target.value)} style={{ width: "9.5rem" }}><option value="all">All tags</option>{tags.map((value) => <option value={value} key={value}>{value}</option>)}</select><button className={`studio-button ${featuredOnly ? "studio-button-primary" : "studio-button-secondary"}`} type="button" aria-pressed={featuredOnly} onClick={() => setFeaturedOnly((value) => !value)}><Filter aria-hidden="true" /> Featured</button><label className="studio-visually-hidden" htmlFor="post-sort">Sort posts</label><select className="studio-select" id="post-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} style={{ width: "10rem" }}><option value="updated-desc">Recently updated</option><option value="published-desc">Publication date</option><option value="title-asc">Title A–Z</option><option value="views-desc">Most viewed</option></select><button className="studio-icon-button" type="button" aria-label="Refresh posts" onClick={() => void refresh()}><UploadCloud aria-hidden="true" /></button></div>{message ? <div className="studio-alert" style={{ margin: "1rem" }} role="status">{message}</div> : null}<div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Title</th><th>Status</th><th>Published</th><th>Scheduled</th><th>Tags</th><th>Updated</th><th>Read</th><th>Views / 30d</th><th><span className="studio-visually-hidden">Actions</span></th></tr></thead><tbody>{filtered.map((article) => <tr key={article.slug}><td><div className="studio-table-title"><Link href={`/studio/posts/${article.slug}`}>{article.frontmatter.title || "Untitled"}</Link><small>/{article.slug}</small>{article.invalid ? <small className="studio-check-error">Metadata needs attention</small> : null}</div></td><td><span className={`studio-badge studio-badge-${article.frontmatter.status}`}>{statusLabels[article.frontmatter.status] || article.frontmatter.status}</span></td><td>{formatDateTime(article.frontmatter.publishedAt)}</td><td>{formatDateTime(article.frontmatter.scheduledAt)}</td><td><div className="studio-tag-list">{article.frontmatter.tags.slice(0, 3).map((value) => <span className="studio-tag" key={value}>#{value}</span>)}</div></td><td>{formatDateTime(article.frontmatter.updatedAt)}</td><td>{article.frontmatter.readingTime || 1} min</td><td>{viewsBySlug[article.slug]?.toLocaleString() ?? "—"}</td><td><div className="studio-row-actions"><Link className="studio-icon-button" href={`/studio/posts/${article.slug}`} aria-label={`Edit ${article.frontmatter.title}`}><Edit3 aria-hidden="true" /></Link><Link className="studio-icon-button" href={`/studio/preview/${article.slug}`} target="_blank" aria-label={`Preview ${article.frontmatter.title}`}><Eye aria-hidden="true" /></Link><button className="studio-icon-button" type="button" disabled={busy === article.slug} onClick={() => void duplicate(article.slug)} aria-label={`Duplicate ${article.frontmatter.title}`}><Copy aria-hidden="true" /></button>{article.frontmatter.status === "published" ? <button className="studio-icon-button" type="button" disabled={busy === article.slug} onClick={() => void update(article.slug, "unpublish")} aria-label={`Unpublish ${article.frontmatter.title}`}><EyeOff aria-hidden="true" /></button> : article.frontmatter.status === "archived" ? <button className="studio-icon-button" type="button" disabled={busy === article.slug} onClick={() => void update(article.slug, "unpublish")} aria-label={`Restore ${article.frontmatter.title} as draft`}><Eye aria-hidden="true" /></button> : <button className="studio-icon-button" type="button" disabled={busy === article.slug} onClick={() => void update(article.slug, "publish")} aria-label={`Publish ${article.frontmatter.title}`}><Send aria-hidden="true" /></button>}{article.frontmatter.status !== "archived" ? <button className="studio-icon-button" type="button" disabled={busy === article.slug} onClick={() => void update(article.slug, "archive")} aria-label={`Archive ${article.frontmatter.title}`}><Archive aria-hidden="true" /></button> : null}<button className="studio-icon-button" type="button" disabled={busy === article.slug} onClick={() => openSchedule(article)} aria-label={`Schedule ${article.frontmatter.title}`}><CalendarClock aria-hidden="true" /></button><Link className="studio-icon-button" href={`/studio/analytics?slug=${article.slug}`} aria-label={`View analytics for ${article.frontmatter.title}`}><BarChart3 aria-hidden="true" /></Link><button className="studio-icon-button" type="button" disabled={busy === article.slug} onClick={() => void remove(article.slug)} aria-label={`Delete ${article.frontmatter.title}`}><Trash2 aria-hidden="true" /></button></div></td></tr>)}{!filtered.length ? <tr><td colSpan={9}><div className="studio-empty"><MoreHorizontal aria-hidden="true" /><strong>No posts match these filters.</strong><p>Try a broader search or start a new Field Note.</p><Link className="studio-button studio-button-primary" href="/studio/posts/new"><FilePlus2 aria-hidden="true" /> New post</Link></div></td></tr> : null}</tbody></table></div><div className="studio-pagination"><span className="studio-help">{filtered.length} of {articles.length} posts</span></div></section>
    {scheduleSlug ? <div className="studio-modal-backdrop" role="presentation"><div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-title"><div className="studio-panel-header"><h2 id="schedule-title">Schedule publication</h2><button className="studio-icon-button" type="button" aria-label="Close schedule dialog" onClick={() => setScheduleSlug(null)}>×</button></div><p className="studio-help">The post stays out of public lists, search, RSS, sitemap, and metadata until this time passes.</p><label className="studio-field"><span>Date and time</span><input className="studio-input" type="datetime-local" value={scheduleValue} onChange={(event) => setScheduleValue(event.target.value)} /></label><div className="studio-actions"><button className="studio-button studio-button-primary" type="button" onClick={() => { const slug = scheduleSlug; setScheduleSlug(null); if (slug) void update(slug, "schedule", new Date(scheduleValue).toISOString()); }}><CalendarClock aria-hidden="true" /> Schedule</button><button className="studio-button studio-button-quiet" type="button" onClick={() => setScheduleSlug(null)}>Cancel</button></div></div></div> : null}
  </>;
}
