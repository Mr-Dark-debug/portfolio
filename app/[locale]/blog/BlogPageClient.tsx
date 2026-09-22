"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Newsletter } from "@/components/blog/newsletter";
import {
  JournalDate,
  JournalFooter,
  JournalNav,
} from "@/components/blog/journal-shell";
import type { BlogPostMeta } from "@/lib/blog/types";

export default function BlogPageClient({
  posts,
  tags,
}: {
  posts: BlogPostMeta[];
  tags: string[];
}) {
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") || "");
      setTag(params.get("tag"));
      setReady(true);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (tag) params.set("tag", tag);
    else params.delete("tag");
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );
  }, [query, tag, ready]);
  const filtered = useMemo(
    () =>
      posts.filter(
        (post) =>
          (!tag || post.tags.includes(tag)) &&
          `${post.title} ${post.excerpt} ${post.tags.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [posts, query, tag],
  );
  const featured = !query.trim() && !tag ? posts[0] : undefined;
  const clear = () => {
    setQuery("");
    setTag(null);
  };
  return (
    <div className="journal-page">
      <JournalNav locale={locale} />
      <header className="journal-container journal-intro">
        <div>
          <p className="journal-kicker">The engineering journal</p>
          <h1>
            Field notes<span>.</span>
          </h1>
          <p className="journal-standfirst">
            Behind the build.
            <br />
            Beyond the demo.
          </p>
        </div>
        <div className="journal-intro-side">
          <p>
            Experiments, practical guides and lessons from building AI systems.
            The decisions, the details, and what I learned along the way.
          </p>
          <label className="journal-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Explore the archive</span>
            <input
              type="search"
              placeholder="Search the library…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            )}
          </label>
        </div>
      </header>
      <div className="journal-topic-bar">
        <div
          className="journal-container journal-topics"
          role="group"
          aria-label="Filter articles by topic"
        >
          <button aria-pressed={!tag} onClick={() => setTag(null)}>
            All topics
          </button>
          {tags.map((topic) => (
            <button
              key={topic}
              aria-pressed={tag === topic}
              onClick={() => setTag(tag === topic ? null : topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
      {featured && (
        <section className="journal-feature" aria-label="Featured article">
          <div className="journal-container journal-feature-inner">
            <span className="journal-issue" aria-hidden="true">
              01 /
            </span>
            <div>
              <p className="journal-kicker">
                Featured · {featured.tags[0] || "Engineering"}
              </p>
              <h2>
                <Link href={`/${locale}/blog/posts/${featured.slug}`}>
                  {featured.title}
                </Link>
              </h2>
              <p className="journal-feature-excerpt">{featured.excerpt}</p>
              <div className="journal-meta">
                <JournalDate date={featured.date} locale={locale} />
                <span>{featured.readingTime} min read</span>
                <Link
                  href={`/${locale}/blog/posts/${featured.slug}`}
                  className="journal-read"
                >
                  Read the article <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
      <section
        className="journal-container journal-library"
        aria-labelledby="library-title"
      >
        <header className="journal-library-heading">
          <div>
            <p className="journal-kicker">The library</p>
            <h2 id="library-title">
              {tag || (query ? "Search results" : "All field notes")}
            </h2>
          </div>
          <p role="status">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            {query.trim() ? ` matching “${query.trim()}”` : ""}
          </p>
        </header>
        <div className="journal-entries">
          {filtered.map((post, index) => (
            <article className="journal-entry" key={post.slug}>
              <span className="journal-entry-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="journal-kicker">
                  {post.tags[0] || "Engineering"}
                </p>
                <h3>
                  <Link href={`/${locale}/blog/posts/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>
                <p className="journal-entry-excerpt">{post.excerpt}</p>
                <div className="journal-meta">
                  <JournalDate date={post.date} locale={locale} />
                  <span>{post.readingTime} min read</span>
                </div>
              </div>
              <Link
                href={`/${locale}/blog/posts/${post.slug}`}
                className="journal-entry-arrow"
                aria-label={`Read ${post.title}`}
              >
                <ArrowUpRight size={23} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="journal-empty">
            <h3>No notes found.</h3>
            <p>Try another topic or a broader search.</p>
            <button onClick={clear}>
              Clear filters <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
      <section className="journal-container journal-subscribe">
        <Newsletter />
      </section>
      <JournalFooter locale={locale} />
    </div>
  );
}
