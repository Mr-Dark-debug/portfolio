import { Suspense } from "react";
import { getAllPosts, getAllTags } from "@/lib/blog/utils";
import BlogPageClient from "./BlogPageClient";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL } from "@/lib/site";

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
        alternates: {
            canonical: `${SITE_URL}/${locale}/blog`,
        },
        openGraph: {
            title: t("title"),
            description: t("description"),
            type: "website",
            url: `${SITE_URL}/${locale}/blog`,
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
    return <div className="journal-page"><div className="journal-container" style={{ paddingBlock: "96px" }}><div className="journal-intro"><div><p className="journal-kicker">The engineering journal</p><div className="h-16 w-80 max-w-full rounded bg-[#c4b5fd1a] animate-pulse" /></div><div className="journal-intro-side"><div className="h-5 w-full max-w-sm rounded bg-[#c4b5fd12] animate-pulse" /><div className="mt-10 h-12 w-full max-w-sm rounded border border-[#c4b5fd25] animate-pulse" /></div></div><div className="journal-library" style={{ paddingBlock: "56px" }}><div className="journal-entries">{[1, 2, 3].map((item) => <div className="journal-entry" key={item}><span className="journal-entry-number">0{item}</span><div><div className="h-4 w-28 rounded bg-[#c4b5fd15] animate-pulse" /><div className="mt-4 h-8 w-4/5 rounded bg-[#c4b5fd12] animate-pulse" /><div className="mt-3 h-4 w-3/5 rounded bg-[#c4b5fd0d] animate-pulse" /></div></div>)}</div></div></div></div>;
}
