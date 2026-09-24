import { listMedia } from "@/lib/studio/media";
import { getManagedArticles } from "@/lib/studio/content";
import { StudioPageHeader } from "@/components/studio/studio-shell";
import MediaManager from "@/components/studio/media-manager";

export const dynamic = "force-dynamic";

export default async function StudioMediaPage() {
  const [assets, articles] = await Promise.all([listMedia(), getManagedArticles()]);
  const usage = new Map<string, string[]>();
  for (const article of articles) {
    const values = [article.frontmatter.coverImage, article.frontmatter.ogImage, article.frontmatter.socialPreviewImage].filter((value): value is string => Boolean(value));
    for (const value of values) {
      const key = value.startsWith("http") ? new URL(value).pathname : value;
      usage.set(key, [...(usage.get(key) || []), article.frontmatter.title]);
    }
  }
  const withUsage = assets.map((asset) => ({ ...asset, usedBy: usage.get(asset.path) || usage.get(new URL(asset.url, "https://prashant.sbs").pathname) || [] }));
  return <><StudioPageHeader eyebrow="Asset library" title="Media" description="Keep article files in Git and binary assets behind one storage boundary. Vercel Blob is used when configured; local and Git-backed storage remain available for development." /><MediaManager initialAssets={withUsage} /></>;
}
