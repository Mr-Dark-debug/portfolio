import { NextResponse } from "next/server";
import { z } from "zod";
import { articleRevisions, getManagedArticle, saveManagedArticle } from "@/lib/studio/content";
import { getTextFileAtRef } from "@/lib/studio/github";
import { parseArticleMarkdown } from "@/lib/studio/markdown";
import { guardStudio, errorResponse } from "@/lib/studio/api";
import { requestContentDeployment } from "@/lib/studio/deployment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };
const querySchema = z.object({ sha: z.string().trim().regex(/^[a-f0-9]{7,64}$/i).optional() });

export async function GET(request: Request, { params }: Context) {
  const denied = await guardStudio(request, "studio-revisions", 30, 60);
  if (denied) return denied;
  const { slug } = await params;
  try {
    const url = new URL(request.url);
    const query = querySchema.parse({ sha: url.searchParams.get("sha") || undefined });
    if (query.sha) {
      const article = await getManagedArticle(slug);
      if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });
      const file = await getTextFileAtRef(article.path, query.sha);
      if (!file) return NextResponse.json({ error: "Revision not found." }, { status: 404 });
      return NextResponse.json({ sha: query.sha, content: file.content }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ revisions: await articleRevisions(slug) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Revision identifier is invalid." }, { status: 400 });
    return errorResponse(error, "Could not load revision history.");
  }
}

export async function POST(request: Request, { params }: Context) {
  const denied = await guardStudio(request, "studio-revision-restore", 10, 60);
  if (denied) return denied;
  const { slug } = await params;
  try {
    const body = z.object({ sha: z.string().trim().regex(/^[a-f0-9]{7,64}$/i) }).parse(await request.json());
    const current = await getManagedArticle(slug);
    if (!current) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    const file = await getTextFileAtRef(current.path, body.sha);
    if (!file) return NextResponse.json({ error: "Revision not found." }, { status: 404 });
    const document = parseArticleMarkdown(file.content, current.slug);
    const restored = await saveManagedArticle(document, document.frontmatter.status === "published" ? "publish" : "save", current.sha);
    const deployment = restored.source === "github" ? await requestContentDeployment() : "local";
    return NextResponse.json({ ok: true, article: restored, deployment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Revision restore input is invalid." }, { status: 400 });
    return errorResponse(error, "Could not restore the revision.");
  }
}
