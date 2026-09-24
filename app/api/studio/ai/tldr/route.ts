import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTldr, aiAvailability } from "@/lib/studio/ai";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
const schema = z.object({ title: z.string().trim().min(1).max(180), body: z.string().min(1).max(200000), style: z.string().trim().max(80).default("concise") });

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-ai-tldr", 10, 600);
  if (denied) return denied;
  try {
    const input = schema.parse(await request.json());
    if (!aiAvailability().available) return NextResponse.json({ available: false, error: "AI API not configured" }, { status: 503 });
    return NextResponse.json({ available: true, tldr: await generateTldr(input.title, input.body, input.style) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Article content is invalid for TL;DR generation." }, { status: 400 });
    return errorResponse(error, "TL;DR generation is unavailable.");
  }
}
