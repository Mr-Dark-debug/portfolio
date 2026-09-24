import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadMedia, listMedia, deleteMedia, type MediaAsset } from "@/lib/studio/media";
import { getManagedArticles } from "@/lib/studio/content";
import { guardStudio, errorResponse } from "@/lib/studio/api";
import { MAX_UPLOAD_BYTES } from "@/lib/studio/images";
import { slugSchema } from "@/lib/studio/schema";
import { requestContentDeployment } from "@/lib/studio/deployment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardStudio(request, "studio-media-list", 60, 60);
  if (denied) return denied;
  try {
    const [assets, articles] = await Promise.all([listMedia(), getManagedArticles()]);
    const usedBy = new Map<string, string[]>();
    for (const article of articles) {
      const values = [article.frontmatter.coverImage, article.frontmatter.ogImage, article.frontmatter.socialPreviewImage, ...article.frontmatter.socialEmbeds.map((embed) => embed.thumbnail || "")].filter((value): value is string => Boolean(value));
      for (const value of values) {
        const key = value.startsWith("http") ? new URL(value).pathname : value;
        usedBy.set(key, [...(usedBy.get(key) || []), article.frontmatter.title]);
      }
    }
    return NextResponse.json(assets.map((asset) => ({ ...asset, usedBy: usedBy.get(asset.path) || usedBy.get(new URL(asset.url, "https://prashant.sbs").pathname) || [] })), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Could not load the media library.");
  }
}

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-media-upload", 20, 600);
  if (denied) return denied;
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_UPLOAD_BYTES + 1_000_000) return NextResponse.json({ error: "Image is larger than the 10 MB limit." }, { status: 413 });
    const form = await request.formData();
    const file = form.get("file");
    const slug = slugSchema.parse(form.get("slug") || "misc");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image is larger than the 10 MB limit." }, { status: 413 });
    const assets = await uploadMedia({ data: Buffer.from(await file.arrayBuffer()), filename: file.name, declaredType: file.type, slug });
    const deployment = assets.some((asset) => asset.storage === "github") ? await requestContentDeployment() : "local";
    return NextResponse.json({ assets, deployment }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "The media folder slug is invalid." }, { status: 400 });
    return errorResponse(error, "Image upload failed.");
  }
}

export async function DELETE(request: Request) {
  const denied = await guardStudio(request, "studio-media-delete", 20, 60);
  if (denied) return denied;
  try {
    const input = z.object({ path: z.string().min(1).max(500), url: z.string().url().optional(), storage: z.enum(["blob", "github", "local"]) }).parse(await request.json());
    const asset: MediaAsset = { path: input.path, url: input.url || input.path, filename: input.path.split("/").pop() || input.path, contentType: "image/jpeg", size: 0, uploadedAt: new Date().toISOString(), storage: input.storage };
    await deleteMedia(asset);
    const deployment = asset.storage === "github" ? await requestContentDeployment() : "local";
    return NextResponse.json({ ok: true, deployment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Media deletion input is invalid." }, { status: 400 });
    return errorResponse(error, "Media deletion failed.");
  }
}
