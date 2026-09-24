import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSeoSuggestions, aiAvailability } from "@/lib/studio/ai";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
const schema = z.object({ title: z.string().trim().min(1).max(180), excerpt: z.string().max(1000).default(""), body: z.string().min(1).max(200000), tags: z.array(z.string().max(80)).max(50).default([]) });

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-ai-seo", 8, 600);
  if (denied) return denied;
  try {
    const input = schema.parse(await request.json());
    if (!aiAvailability().available) return NextResponse.json({ available: false, error: "AI API not configured" }, { status: 503 });
    return NextResponse.json({ available: true, suggestions: await generateSeoSuggestions(input.title, input.excerpt, input.body, input.tags) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Article content is invalid for SEO analysis." }, { status: 400 });
    return errorResponse(error, "AI SEO suggestions are unavailable.");
  }
}
