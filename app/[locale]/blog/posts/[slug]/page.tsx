import { pageMetadata, jsonLd as serializeJsonLd } from '@/lib/metadata';
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts, getAdjacentPosts, getRelatedPosts, extractTableOfContents } from "@/lib/blog/utils";
import BlogPostClient from "./BlogPostClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL, SITE_NAME } from "@/lib/site";

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

    const absoluteImage = post.image
        ? new URL(post.image, SITE_URL).href
        : `${SITE_URL}/opengraph-image`;

    return {
        ...pageMetadata(locale, `/blog/posts/${slug}`, post.title, post.excerpt),
        title: `${post.title} | Prashant Choudhary`,
        description: post.excerpt,
        authors: [{ name: post.author }],
        keywords: post.tags,

        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: "article",
            url: `${SITE_URL}/${locale}/blog/posts/${slug}`,
            publishedTime: post.date,
            authors: [post.author],
            images: [{ url: absoluteImage }],
            tags: post.tags,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt,
            images: [absoluteImage],
        },
    };
}

export async function generateStaticParams() {
    const posts = await getAllPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
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
        author: { "@type": "Person", name: post.author || SITE_NAME },
        datePublished: post.date,
        dateModified: post.updatedAt || post.date,
        image: post.image ? new URL(post.image, SITE_URL).href : `${SITE_URL}/${locale}/blog/posts/${slug}/opengraph-image`,
        keywords: post.tags?.join(", "),
        mainEntityOfPage: `${SITE_URL}/${locale}/blog/posts/${slug}`,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
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
