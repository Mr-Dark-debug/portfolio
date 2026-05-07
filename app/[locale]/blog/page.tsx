import { Suspense } from "react";
import { getAllPosts, getAllTags } from "@/lib/blog/utils";
import BlogPageClient from "./BlogPageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Blog.metadata" });

    return {
        title: t("title"),
        description: t("description"),
        openGraph: {
            title: t("title"),
            description: t("description"),
            type: "website",
            url: `/${locale}/blog`,
        },
        twitter: {
            card: "summary_large_image",
            title: t("title"),
            description: t("description"),
        },
    };
}

async function BlogContent() {
    const posts = await getAllPosts();
    const tags = await getAllTags();

    return <BlogPageClient posts={posts} tags={tags} />;
}

export default function BlogPage() {
    return (
        <Suspense fallback={<BlogLoadingSkeleton />}>
            <BlogContent />
        </Suspense>
    );
}

function BlogLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Header skeleton */}
                <div className="text-center mb-16">
                    <div className="h-12 w-48 bg-zinc-200 rounded-lg mx-auto mb-4 animate-pulse" />
                    <div className="h-6 w-96 bg-zinc-200 rounded-lg mx-auto animate-pulse" />
                </div>

                {/* Cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-2xl bg-zinc-100 overflow-hidden animate-pulse">
                            <div className="h-48 bg-zinc-200" />
                            <div className="p-6">
                                <div className="h-4 w-32 bg-zinc-200 rounded mb-3" />
                                <div className="h-6 w-full bg-zinc-200 rounded mb-3" />
                                <div className="h-4 w-full bg-zinc-200 rounded mb-2" />
                                <div className="h-4 w-2/3 bg-zinc-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
