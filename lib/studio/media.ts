import "server-only";
import { del, list, put } from "@vercel/blob";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { CmsError, getTextFile, listMediaFiles, putBinaryFile, deleteBinaryFile, publicAssetUrl } from "./github";
import { processImageUpload, safeImageFilename, type ProcessedImage } from "./images";

export interface MediaAsset {
  path: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
  storage: "blob" | "github" | "local";
}

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function mediaPath(slug: string, filename: string, variant: string, contentType: string) {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const safeName = safeImageFilename(filename);
  const stem = safeName.replace(/\.[^.]+$/, "");
  const extension = contentType === "image/webp" ? ".webp" : contentType === "image/avif" ? ".avif" : safeName.match(/\.[^.]+$/)?.[0] || ".jpg";
  return `blog/${safeSlug}/${stem}${variant === "original" ? "" : `-${variant}`}${extension}`;
}

export async function uploadMedia(input: { data: Buffer; filename: string; declaredType?: string; slug: string }): Promise<MediaAsset[]> {
  const processed: ProcessedImage = await processImageUpload(input);
  const assets: MediaAsset[] = [];
  for (const variant of processed.variants) {
    const pathname = mediaPath(input.slug, input.filename, variant.name, variant.contentType);
    if (blobConfigured()) {
      const blob = await put(pathname, variant.data, { access: "public", addRandomSuffix: false, contentType: variant.contentType, token: process.env.BLOB_READ_WRITE_TOKEN });
      assets.push({ path: pathname, url: blob.url, filename: pathname.split("/").pop() || pathname, contentType: variant.contentType, size: variant.data.length, width: processed.width, height: processed.height, uploadedAt: new Date().toISOString(), storage: "blob" });
    } else {
      const filePath = `public/${pathname}`;
      await putBinaryFile(filePath, variant.data, `content(media): add ${pathname}`);
      assets.push({ path: filePath, url: publicAssetUrl(filePath), filename: pathname.split("/").pop() || pathname, contentType: variant.contentType, size: variant.data.length, width: processed.width, height: processed.height, uploadedAt: new Date().toISOString(), storage: "github" });
    }
  }
  return assets;
}

export async function listMedia(): Promise<MediaAsset[]> {
  if (blobConfigured()) {
    const result = await list({ prefix: "blog/", limit: 1000, token: process.env.BLOB_READ_WRITE_TOKEN });
    return result.blobs.filter((blob) => /\.(jpe?g|png|webp|avif|gif)$/i.test(blob.pathname)).map((blob) => ({ path: blob.pathname, url: blob.url, filename: blob.pathname.split("/").pop() || blob.pathname, contentType: blob.pathname.endsWith(".webp") ? "image/webp" : blob.pathname.endsWith(".avif") ? "image/avif" : blob.pathname.endsWith(".gif") ? "image/gif" : "image/jpeg", size: blob.size, uploadedAt: blob.uploadedAt.toISOString(), storage: "blob" }));
  }
  const files = await listMediaFiles("public/blog");
  const assets: MediaAsset[] = [];
  for (const file of files) {
    let width: number | undefined;
    let height: number | undefined;
    if (file.source === "local") {
      try { const metadata = await sharp(Buffer.from(file.content, "base64")).metadata(); width = metadata.width; height = metadata.height; } catch { width = undefined; height = undefined; }
    }
    assets.push({ path: file.path, url: publicAssetUrl(file.path), filename: file.path.split("/").pop() || file.path, contentType: file.path.endsWith(".webp") ? "image/webp" : file.path.endsWith(".avif") ? "image/avif" : file.path.endsWith(".gif") ? "image/gif" : "image/jpeg", size: file.source === "local" ? Buffer.byteLength(file.content, "base64") : 0, width, height, uploadedAt: new Date().toISOString(), storage: file.source });
  }
  return assets;
}

export async function deleteMedia(asset: MediaAsset): Promise<void> {
  if (asset.storage === "blob") {
    let url: URL;
    try { url = new URL(asset.url); } catch { throw new CmsError("Invalid blog media URL.", 400, "INVALID_MEDIA_PATH"); }
    if (!asset.path.startsWith("blog/") || !url.hostname.endsWith(".blob.vercel-storage.com") || !url.pathname.startsWith("/blog/")) throw new CmsError("Invalid blog media path.", 400, "INVALID_MEDIA_PATH");
    await del(asset.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return;
  }
  if (!/^public\/blog\/[a-z0-9-]+\/[a-zA-Z0-9._-]+$/.test(asset.path)) throw new CmsError("Invalid blog media path.", 400, "INVALID_MEDIA_PATH");
  await deleteBinaryFile(asset.path, `content(media): remove ${asset.filename}`);
}

export async function readMediaText(pathname: string): Promise<string | null> {
  const file = await getTextFile(pathname);
  return file?.content || null;
}
