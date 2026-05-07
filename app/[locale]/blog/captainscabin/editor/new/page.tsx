import EditorPageClient from "../EditorPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "New Post | Blog Admin",
    description: "Create a new blog post",
    robots: "noindex, nofollow",
};

export default function NewPostPage() {
    return <EditorPageClient isNew />;
}
