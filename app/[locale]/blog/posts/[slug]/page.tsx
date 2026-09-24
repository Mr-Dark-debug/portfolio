import { pageMetadata, jsonLd as serializeJsonLd } from '@/lib/metadata';
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts, getAdjacentPosts, getRelatedPosts, extractTableOfContents } from "@/lib/blog/utils";
import BlogPostClient from "./BlogPostClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { youtubeVideoId } from "@/lib/studio/embeds";
import { locales } from '@/navigation';

interface Props {
    params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params;
    const t = await getTranslations({ locale, namespace: "Blog" });
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: t("noResults"),
        };
    }

    const absoluteImage = post.ogImage || post.coverImage
        ? new URL(post.ogImage || post.coverImage || "", SITE_URL).href
        : `${SITE_URL}/${locale}/blog/posts/${slug}/opengraph-image`;
    // Article bodies are English in every locale shell until translated posts exist.
    const canonical = post.canonical || `${SITE_URL}/en/blog/posts/${slug}`;
    const metaTitle = post.metaTitle || post.title;
    const metaDescription = post.metaDescription || post.excerpt;

    const baseMetadata = pageMetadata(locale, `/blog/posts/${slug}`, metaTitle, metaDescription);
    return {
        ...baseMetadata,
        title: `${metaTitle} | Prashant Choudhary`,
        description: metaDescription,
        authors: [{ name: post.author }],
        keywords: [...post.tags, ...post.topics, ...post.keywords, ...post.entities],
        robots: post.status === "archived" ? { index: false, follow: false } : undefined,
        alternates: { canonical },
        openGraph: {
            title: post.ogTitle || metaTitle,
            description: post.ogDescription || metaDescription,
            type: "article",
            url: canonical,
            publishedTime: post.publishedAt || post.date,
            modifiedTime: post.updatedAt,
            authors: [post.author],
            images: [{ url: absoluteImage, alt: post.coverImageAlt || post.title }],
            tags: [...post.tags, ...post.topics],
        },
        twitter: {
            card: "summary_large_image",
            title: post.ogTitle || metaTitle,
            description: post.ogDescription || metaDescription,
            images: [absoluteImage],
        },
    };
}

export async function generateStaticParams() {
    const posts = await getAllPosts();
    return locales.flatMap(locale => posts.map(post => ({locale, slug: post.slug})));
}

export default async function BlogPostPage({ params }: Props) {
    const { locale, slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post || !post.published) {
        notFound();
    }

    const adjacentPosts = await getAdjacentPosts(slug);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        author: { "@type": "Person", name: post.author || SITE_NAME, url: `${SITE_URL}/${locale}` },
        publisher: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
        datePublished: post.publishedAt || post.date,
        dateModified: post.updatedAt || post.publishedAt || post.date,
        image: post.ogImage || post.coverImage ? new URL(post.ogImage || post.coverImage || "", SITE_URL).href : `${SITE_URL}/${locale}/blog/posts/${slug}/opengraph-image`,
        keywords: [...post.tags, ...post.topics, ...post.entities].join(", "),
        articleSection: post.topics[0] || post.tags[0],
        isAccessibleForFree: true,
        mainEntityOfPage: post.canonical || `${SITE_URL}/en/blog/posts/${slug}`,
    };
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${locale}` },
            { "@type": "ListItem", position: 2, name: "Field notes", item: `${SITE_URL}/${locale}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/${locale}/blog/posts/${slug}` },
        ],
    };
    const faqJsonLd = post.faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: post.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) } : null;
    const videoUrl = post.socialEmbeds.find((embed) => embed.provider === "youtube")?.url || post.coverVideo;
    const videoId = videoUrl ? youtubeVideoId(videoUrl) : null;
    const videoJsonLd = videoId ? { "@context": "https://schema.org", "@type": "VideoObject", name: post.title, description: post.excerpt, embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}` } : null;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
            />
            {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }} /> : null}
            {videoJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(videoJsonLd) }} /> : null}
            <BlogPostClient
                relatedPosts={await getRelatedPosts(slug)}
                toc={extractTableOfContents(post.content)}
                post={post}
                previousPost={adjacentPosts.previous}
                nextPost={adjacentPosts.next}
            />
        </>
    );
}
