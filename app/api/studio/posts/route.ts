import { NextResponse } from "next/server";
import { z } from "zod";
import { articleMutationSchema } from "@/lib/studio/schema";
import { getManagedArticle, getManagedArticles, saveManagedArticle } from "@/lib/studio/content";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = articleMutationSchema.extend({ action: z.enum(["save", "publish", "schedule", "unpublish", "archive"]).default("save") }).refine((value) => value.slug === value.frontmatter.slug, { message: "Slug and frontmatter slug must match", path: ["slug"] });

export async function GET(request: Request) {
  const denied = await guardStudio(request, "studio-posts-list", 60, 60);
  if (denied) return denied;
  try {
    const articles = await getManagedArticles();
    return NextResponse.json(articles.map((article) => ({ slug: article.slug, path: article.path, sha: article.sha, frontmatter: article.frontmatter, body: article.body, invalid: article.invalid })), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Could not load Field Notes.");
  }
}

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-posts-write", 30, 60);
  if (denied) return denied;
  try {
    const input = createSchema.parse(await request.json());
    if (input.action === "schedule" && (!input.frontmatter.scheduledAt || Date.parse(input.frontmatter.scheduledAt) <= Date.now())) return NextResponse.json({ error: "Choose a future date and time before scheduling." }, { status: 400 });
    if (input.action === "publish" && input.frontmatter.scheduledAt && Date.parse(input.frontmatter.scheduledAt) > Date.now()) return NextResponse.json({ error: "A published post cannot have a future schedule." }, { status: 400 });
    if (!input.expectedSha && await getManagedArticle(input.slug)) return NextResponse.json({ error: "This slug already exists. Refresh before creating it." }, { status: 409 });
    const article = await saveManagedArticle({ frontmatter: input.frontmatter, body: input.body }, input.action, input.expectedSha);
    return NextResponse.json({ ok: true, article }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Article metadata is invalid." }, { status: 400 });
    return errorResponse(error, "Could not save the article.");
  }
}
