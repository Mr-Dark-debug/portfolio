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
import { ConsentAwareEmbed, MediaPreferencesLink } from "@/components/blog/consent-aware-embed";
import { track } from "@vercel/analytics/react";
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
    let lastDepth = 0;
    const article = document.getElementById("article-body");
    track("article_open", { slug: post.slug });
    const handleScroll = () => {
      if (!article) return;
      const top = article.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(1, article.offsetHeight - window.innerHeight + 100);
      const progress = Math.min(100, Math.max(0, ((window.scrollY - top + 100) / distance) * 100));
      updateReadingProgress(post.slug, progress);
      const depth = Math.floor(progress / 25) * 25;
      if (depth > lastDepth) {
        lastDepth = depth;
        track("article_open", { slug: post.slug, depth });
      }
    };
    void import("highlight.js").then(({ default: hljs }) => {
      if (cancelled) return;
      article?.querySelectorAll<HTMLElement>("pre code:not([data-highlighted])").forEach((code) => hljs.highlightElement(code));
    });
    const added: HTMLElement[] = [];
    article?.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".reader-code-label")) return;
      const code = pre.querySelector("code");
      const language = [...(code?.classList || [])].find((value) => value.startsWith("language-"))?.replace("language-", "") || "code";
      const label = document.createElement("span");
      label.className = "reader-code-label";
      label.textContent = language;
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "reader-code-copy";
      copy.textContent = "Copy";
      copy.addEventListener("click", async () => {
        await navigator.clipboard.writeText(code?.textContent || "");
        copy.textContent = "Copied";
        track("code_copy", { language });
        window.setTimeout(() => { copy.textContent = "Copy"; }, 1400);
      });
      pre.append(label, copy);
      added.push(label, copy);
    });
    const links: HTMLAnchorElement[] = [];
    article?.querySelectorAll("h2[id],h3[id],h4[id]").forEach((heading) => {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = " #";
      link.className = "heading-anchor";
      link.setAttribute("aria-label", `Link to ${heading.textContent}`);
      link.addEventListener("click", () => track("table_of_contents_click", { slug: post.slug }));
      heading.appendChild(link);
      links.push(link);
    });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("scroll", handleScroll);
      links.forEach((link) => link.remove());
      added.forEach((node) => node.remove());
    };
  }, [post.slug, post.content]);
  const coverVideoEmbed = post.coverVideo ? { provider: "youtube" as const, url: post.coverVideo, title: "Featured video" } : null;
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
            {post.subtitle ? <p className="reader-subtitle">{post.subtitle}</p> : null}
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
                  alt={post.coverImageAlt || post.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 800px) 100vw, 760px"
                  preload
                />
              </figure>
            )}
            {post.tldr ? <aside className="reader-tldr" aria-label="TL;DR"><span className="journal-kicker">TL;DR</span><p>{post.tldr}</p></aside> : null}
            {coverVideoEmbed ? <ConsentAwareEmbed embed={coverVideoEmbed} /> : null}
            {post.socialEmbeds.length ? <div className="reader-embeds">{post.socialEmbeds.map((embed) => <ConsentAwareEmbed embed={embed} key={`${embed.provider}-${embed.url}`} />)}</div> : null}
            <article
              id="article-body"
              aria-label={post.title}
              className="prose reader-prose"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {post.faqs.length ? <section className="reader-faq" aria-labelledby="reader-faq-title"><p className="journal-kicker">Questions</p><h2 id="reader-faq-title">FAQ</h2>{post.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section> : null}
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
               <MediaPreferencesLink />
             </section>
            <PostEngagement slug={post.slug} />
            {relatedPosts.length > 0 && (
              <section className="reader-related">
                <p className="journal-kicker">Stay curious</p>
                <h2>Continue reading</h2>
                {relatedPosts.map((p) => (
                   <Link key={p.slug} href={`/${locale}/blog/posts/${p.slug}`} onClick={() => track("related_article_click", { from: post.slug, to: p.slug })}>
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
