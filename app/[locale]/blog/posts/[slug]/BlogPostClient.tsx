"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  JournalDate,
  JournalFooter,
  JournalNav,
} from "@/components/blog/journal-shell";
import { TableOfContents } from "@/components/blog/ui/TableOfContents";
import { ReadingProgress } from "@/components/blog/ui/ReadingProgress";
import { SocialShareButtons } from "@/components/blog/ui/SocialShareButtons";
import { SaveBookmarkButton } from "@/components/blog/features/SaveBookmarkButton";
import { PostEngagement } from "@/components/blog/post-engagement";
import { updateReadingProgress } from "@/lib/blog/api";
import type {
  BlogPost,
  BlogPostMeta,
  TableOfContentsItem,
} from "@/lib/blog/types";

interface Props {
  post: BlogPost;
  previousPost: BlogPostMeta | null;
  nextPost: BlogPostMeta | null;
  relatedPosts: BlogPostMeta[];
  toc: TableOfContentsItem[];
}
export default function BlogPostClient({
  post,
  previousPost,
  nextPost,
  relatedPosts,
  toc,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("Blog.post");
  useEffect(() => {
    let cancelled = false;
    const article = document.getElementById("article-body");
    const handleScroll = () => {
      if (!article) return;
      const top = article.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(
        1,
        article.offsetHeight - window.innerHeight + 100,
      );
      updateReadingProgress(
        post.slug,
        Math.min(
          100,
          Math.max(0, ((window.scrollY - top + 100) / distance) * 100),
        ),
      );
    };
    void import("highlight.js").then(({ default: hljs }) => {
      if (!cancelled)
        article
          ?.querySelectorAll<HTMLElement>("pre code:not([data-highlighted])")
          .forEach((code) => hljs.highlightElement(code));
    });
    const links: HTMLAnchorElement[] = [];
    article?.querySelectorAll("h2[id],h3[id],h4[id]").forEach((heading) => {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = " #";
      link.className = "heading-anchor";
      link.setAttribute("aria-label", `Link to ${heading.textContent}`);
      heading.appendChild(link);
      links.push(link);
    });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("scroll", handleScroll);
      links.forEach((link) => link.remove());
    };
  }, [post.slug, post.content]);
  return (
    <div className="journal-page journal-reader">
      <ReadingProgress />
      <JournalNav locale={locale} article>
        <SaveBookmarkButton slug={post.slug} size="sm" />
      </JournalNav>
      <header className="journal-container reader-header">
        <nav aria-label="Breadcrumb" className="reader-breadcrumb">
          <Link href={`/${locale}`}>Home</Link>
          <span>/</span>
          <Link href={`/${locale}/blog`}>Field notes</Link>
          {post.tags[0] && (
            <>
              <span>/</span>
              <Link
                href={`/${locale}/blog?tag=${encodeURIComponent(post.tags[0])}`}
              >
                {post.tags[0]}
              </Link>
            </>
          )}
        </nav>
        <div className="reader-title-grid">
          <div>
            <div className="reader-tags">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/blog?tag=${encodeURIComponent(tag)}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
            <h1>{post.title}</h1>
            <p className="reader-deck">{post.excerpt}</p>
          </div>
          <dl className="reader-metadata">
            <div>
              <dt>Written by</dt>
              <dd>{post.author}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>
                <JournalDate date={post.date} locale={locale} />
              </dd>
            </div>
            {post.updatedAt && post.updatedAt !== post.date && (
              <div>
                <dt>Updated</dt>
                <dd>
                  <JournalDate date={post.updatedAt} locale={locale} />
                </dd>
              </div>
            )}
            <div>
              <dt>Reading time</dt>
              <dd>{post.readingTime} minutes</dd>
            </div>
          </dl>
        </div>
      </header>
      <div className="reader-surface">
        <div
          className={`journal-container reader-grid${toc.length ? "" : " reader-grid-no-toc"}`}
        >
          {toc.length > 0 && (
            <aside className="reader-contents">
              <TableOfContents items={toc} />
            </aside>
          )}
          <div className="reader-column">
            {post.image && (
              <figure className="reader-cover">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 800px) 100vw, 760px"
                  preload
                />
              </figure>
            )}
            <article
              id="article-body"
              aria-label={post.title}
              className="prose reader-prose"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <div className="reader-author">
              <span className="reader-author-initial" aria-hidden="true">
                {post.author.charAt(0)}
              </span>
              <div>
                <p>{t("writtenBy")}</p>
                <strong>{post.author}</strong>
                <p>{t("authorRole")}</p>
              </div>
            </div>
            <section className="reader-share" aria-label="Share this article">
              <p className="journal-kicker">Share this note</p>
              <SocialShareButtons
                url={`/${locale}/blog/posts/${post.slug}`}
                title={post.title}
                description={post.excerpt}
              />
            </section>
            <PostEngagement slug={post.slug} />
            {relatedPosts.length > 0 && (
              <section className="reader-related">
                <p className="journal-kicker">Stay curious</p>
                <h2>Continue reading</h2>
                {relatedPosts.map((p) => (
                  <Link key={p.slug} href={`/${locale}/blog/posts/${p.slug}`}>
                    <div>
                      <span>
                        {p.tags[0] || "Field notes"} · {p.readingTime} min read
                      </span>
                      <h3>{p.title}</h3>
                    </div>
                    <ArrowRight size={20} aria-hidden="true" />
                  </Link>
                ))}
              </section>
            )}
            <nav className="reader-adjacent" aria-label="Adjacent articles">
              {previousPost && (
                <Link href={`/${locale}/blog/posts/${previousPost.slug}`}>
                  <span>
                    <ArrowLeft size={14} aria-hidden="true" />
                    {t("previous")}
                  </span>
                  <strong>{previousPost.title}</strong>
                </Link>
              )}
              {nextPost && (
                <Link href={`/${locale}/blog/posts/${nextPost.slug}`}>
                  <span>
                    {t("next")}
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                  <strong>{nextPost.title}</strong>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
      <JournalFooter locale={locale} />
    </div>
  );
}
