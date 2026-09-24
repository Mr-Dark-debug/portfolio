import { NextResponse } from "next/server";
import { z } from "zod";
import { articleMutationSchema } from "@/lib/studio/schema";
import { getManagedArticle, removeManagedArticle, renameManagedArticle, saveManagedArticle } from "@/lib/studio/content";
import { createPreviewToken } from "@/lib/studio/auth";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSchema = articleMutationSchema.extend({ action: z.enum(["save", "publish", "schedule", "unpublish", "archive", "rename"]).default("save"), newSlug: z.string().trim().max(150).optional() }).refine((value) => value.action === "rename" ? value.newSlug === value.frontmatter.slug : value.slug === value.frontmatter.slug, { message: "Slug and frontmatter slug must match", path: ["slug"] });

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Context) {
  const denied = await guardStudio(request, "studio-post-read", 60, 60);
  if (denied) return denied;
  const { slug } = await params;
  try {
    const article = await getManagedArticle(slug);
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    return NextResponse.json({ article, previewToken: await createPreviewToken(article.slug) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Could not load the article.");
  }
}

async function update(request: Request, context: Context) {
  const denied = await guardStudio(request, "studio-post-write", 30, 60);
  if (denied) return denied;
  const { slug } = await context.params;
  try {
    const input = updateSchema.parse(await request.json());
    if (input.action !== "rename" && input.slug !== slug) return NextResponse.json({ error: "The article slug cannot be changed through this route." }, { status: 400 });
    const current = await getManagedArticle(slug);
    if (!current) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    if (current.sha ? input.expectedSha !== current.sha : input.expectedSha) return NextResponse.json({ error: "This article changed in GitHub. Reload before saving." }, { status: 409 });
    if (input.action === "schedule" && (!input.frontmatter.scheduledAt || Date.parse(input.frontmatter.scheduledAt) <= Date.now())) return NextResponse.json({ error: "Choose a future date and time before scheduling." }, { status: 400 });
    const article = input.action === "rename" ? await renameManagedArticle(slug, input.newSlug || input.frontmatter.slug, { frontmatter: input.frontmatter, body: input.body }, input.expectedSha) : await saveManagedArticle({ frontmatter: input.frontmatter, body: input.body }, input.action, input.expectedSha);
    return NextResponse.json({ ok: true, article, previewToken: await createPreviewToken(article.slug) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Article metadata is invalid." }, { status: 400 });
    return errorResponse(error, "Could not update the article.");
  }
}

export async function PATCH(request: Request, context: Context) { return update(request, context); }
export async function PUT(request: Request, context: Context) { return update(request, context); }

export async function DELETE(request: Request, { params }: Context) {
  const denied = await guardStudio(request, "studio-post-delete", 15, 60);
  if (denied) return denied;
  const { slug } = await params;
  try {
    await removeManagedArticle(slug);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Could not delete the article.");
  }
}
