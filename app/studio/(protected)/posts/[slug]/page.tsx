import { notFound } from "next/navigation";
import { getManagedArticle } from "@/lib/studio/content";
import PostEditor from "@/components/studio/post-editor";
import { StudioPageHeader } from "@/components/studio/studio-shell";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getManagedArticle(slug);
  if (!article) notFound();
  return <><StudioPageHeader eyebrow="Content library / edit" title={article.frontmatter.title || "Edit Field Note"} description="The same safe renderer powers the public article and your protected preview." /><PostEditor article={article} /></>;
}
