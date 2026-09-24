import "server-only";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;

export interface ProcessedImage {
  original: Buffer;
  variants: { name: string; data: Buffer; contentType: string }[];
  width: number;
  height: number;
  format: string;
  size: number;
}

const formatMime: Record<string, string> = { jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif" };

export function safeImageFilename(value: string): string {
  const base = path.basename(value).normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const extension = path.extname(base).toLowerCase();
  const stem = path.basename(base, extension).slice(0, 80) || "image";
  return `${stem}${extension}`;
}

export function imageExtension(contentType: string): string {
  return { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif" }[contentType] || ".bin";
}

export async function processImageUpload(input: { data: Buffer; declaredType?: string; filename: string }): Promise<ProcessedImage> {
  if (!input.data.length || input.data.length > MAX_UPLOAD_BYTES) throw new Error("Image must be between 1 byte and 10 MB");
  let metadata: Metadata;
  try {
    metadata = await sharp(input.data, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new Error("The uploaded file is not a readable image");
  }
  const contentType = metadata.format ? formatMime[metadata.format] : undefined;
  if (!contentType || !ACCEPTED_IMAGE_TYPES.includes(contentType as (typeof ACCEPTED_IMAGE_TYPES)[number])) throw new Error("Unsupported image format");
  if (input.declaredType && input.declaredType !== contentType && !(input.declaredType === "image/jpg" && contentType === "image/jpeg")) throw new Error("Image MIME type does not match its contents");
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > 40_000_000) throw new Error("Image dimensions are too large");
  const resizeWidth = Math.min(metadata.width, 2400);
  const pipeline = sharp(input.data, { limitInputPixels: 40_000_000 }).rotate().resize({ width: resizeWidth, withoutEnlargement: true });
  const variants = [{ name: "original", data: input.data, contentType }];
  if (contentType !== "image/gif") {
    variants.push({ name: "webp", data: await pipeline.clone().webp({ quality: 82 }).toBuffer(), contentType: "image/webp" });
    variants.push({ name: "avif", data: await pipeline.clone().avif({ quality: 55, effort: 4 }).toBuffer(), contentType: "image/avif" });
  }
  return { original: input.data, variants, width: metadata.width, height: metadata.height, format: metadata.format, size: input.data.length };
}
