import { NextResponse } from "next/server";
import { z } from "zod";
import { getManagedArticles } from "@/lib/studio/content";
import { extractLinks } from "@/lib/studio/markdown";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
const schema = z.object({ articleSlugs: z.array(z.string().max(150)).max(50).optional() });

async function checkUrl(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "manual", signal: controller.signal, headers: { "User-Agent": "PrashantPortfolioStudio/1.0" } });
    return { url, status: response.status, ok: response.ok, redirect: response.status >= 300 && response.status < 400 ? response.headers.get("location") : null, error: null };
  } catch (error) {
    return { url, status: 0, ok: false, redirect: null, error: error instanceof Error && error.name === "AbortError" ? "Timed out" : "Could not reach URL" };
  } finally { clearTimeout(timeout); }
}

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-link-checker", 5, 300);
  if (denied) return denied;
  try {
    const input = schema.parse(await request.json());
    const articles = await getManagedArticles();
    const selected = input.articleSlugs?.length ? articles.filter((article) => input.articleSlugs?.includes(article.slug)) : articles;
    const links = selected.flatMap((article) => [...extractLinks(article.body), ...article.frontmatter.externalReferences].map((url) => ({ article: article.frontmatter.title, slug: article.slug, url })));
    const unique = [...new Map(links.map((item) => [`${item.slug}:${item.url}`, item])).values()].slice(0, 30);
    const results: Record<string, unknown>[] = [];
    for (let index = 0; index < unique.length; index += 4) results.push(...(await Promise.all(unique.slice(index, index + 4).map(async (item) => ({ ...item, ...(await checkUrl(item.url)) })))));
    return NextResponse.json({ checkedAt: new Date().toISOString(), results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Link checker input is invalid." }, { status: 400 });
    return errorResponse(error, "Link checking is unavailable.");
  }
}
