import { NextResponse } from "next/server";
import { z } from "zod";
import { getManagedArticles, saveManagedArticle } from "@/lib/studio/content";
import { guardStudio, errorResponse } from "@/lib/studio/api";
import { requestContentDeployment } from "@/lib/studio/deployment";

export const runtime = "nodejs";
const schema = z.object({ from: z.string().trim().min(1).max(80), to: z.string().trim().min(1).max(80) });

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-tags", 15, 60);
  if (denied) return denied;
  try {
    const input = schema.parse(await request.json());
    const from = input.from.toLowerCase();
    const to = input.to.toLowerCase();
    const articles = await getManagedArticles();
    const changed = [];
    for (const article of articles) {
      const tags = [...new Set(article.frontmatter.tags.map((tag) => tag.toLowerCase() === from ? to : tag.toLowerCase()))];
      const topics = [...new Set(article.frontmatter.topics.map((topic) => topic.toLowerCase() === from ? to : topic.toLowerCase()))];
      if (tags.join("\n") === article.frontmatter.tags.join("\n") && topics.join("\n") === article.frontmatter.topics.join("\n")) continue;
      changed.push(await saveManagedArticle({ frontmatter: { ...article.frontmatter, tags, topics }, body: article.body }, "save", article.sha));
    }
    const deployment = changed.some((article) => article.source === "github") ? await requestContentDeployment() : "local";
    return NextResponse.json({ updated: changed.length, from, to, deployment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Tag names are invalid." }, { status: 400 });
    return errorResponse(error, "Tag operation failed.");
  }
}
