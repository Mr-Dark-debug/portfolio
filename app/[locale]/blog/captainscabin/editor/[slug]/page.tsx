import { getRawPostContent } from "@/lib/blog/utils";
import { notFound } from "next/navigation";
import EditorPageClient from "../EditorPageClient";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
    title: "Edit Post | Blog Admin",
    description: "Edit an existing blog post",
    robots: "noindex, nofollow",
};

export default async function EditPostPage({ params }: Props) {
    const { slug } = await params;

    // Handle "new" route separately
    if (slug === "new") {
        return <EditorPageClient isNew />;
    }

    // Try to get the post content
    const content = getRawPostContent(slug) || getRawPostContent(slug, true);

    if (!content) {
        notFound();
    }

    return (
        <EditorPageClient
            isNew={false}
            initialContent={content}
            slug={slug}
        />
    );
}
