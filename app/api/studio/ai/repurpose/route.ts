import { NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailability, generateRepurposingDrafts } from "@/lib/studio/ai";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
const schema = z.object({ title: z.string().trim().min(1).max(180), excerpt: z.string().max(1000).default(""), body: z.string().min(1).max(200000) });

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-ai-repurpose", 8, 600);
  if (denied) return denied;
  try {
    const input = schema.parse(await request.json());
    if (!aiAvailability().available) return NextResponse.json({ available: false, error: "AI API not configured" }, { status: 503 });
    return NextResponse.json({ available: true, drafts: await generateRepurposingDrafts(input.title, input.excerpt, input.body) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Article content is invalid for repurposing." }, { status: 400 });
    return errorResponse(error, "Content repurposing is unavailable.");
  }
}
