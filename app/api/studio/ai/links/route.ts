import { NextResponse } from "next/server";
import { z } from "zod";
import { getAllPosts } from "@/lib/blog/utils";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
const schema = z.object({ body: z.string().max(200000).default(""), currentSlug: z.string().max(150).optional() });

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-internal-links", 30, 60);
  if (denied) return denied;
  try {
    const input = schema.parse(await request.json());
    const posts = (await getAllPosts()).filter((post) => post.slug !== input.currentSlug);
    const words = new Set(input.body.toLowerCase().split(/\W+/).filter((word) => word.length > 4));
    const suggestions = posts.map((post) => ({ slug: post.slug, title: post.title, url: `/en/blog/posts/${post.slug}`, reason: post.tags.some((tag) => words.has(tag.toLowerCase())) ? `Shared topic: ${post.tags.find((tag) => words.has(tag.toLowerCase()))}` : post.topics.some((topic) => words.has(topic.toLowerCase())) ? `Shared topic: ${post.topics.find((topic) => words.has(topic.toLowerCase()))}` : "Related Field Note", score: post.tags.filter((tag) => words.has(tag.toLowerCase())).length * 3 + post.topics.filter((topic) => words.has(topic.toLowerCase())).length * 4 })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);
    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Link analysis input is invalid." }, { status: 400 });
    return errorResponse(error, "Internal link suggestions are unavailable.");
  }
}
