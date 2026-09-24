import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(slug === "new" ? "/studio/posts/new" : `/studio/posts/${encodeURIComponent(slug)}`);
}
