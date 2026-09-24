import { NextResponse } from "next/server";
import { z } from "zod";
import { renderSafeMarkdown } from "@/lib/studio/markdown";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
const schema = z.object({ markdown: z.string().min(1).max(200000), title: z.string().trim().max(180).default("Article preview") });

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-preview", 60, 60);
  if (denied) return denied;
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json({ html: await renderSafeMarkdown(input.markdown, input.title) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Markdown preview input is invalid." }, { status: 400 });
    return errorResponse(error, "Preview could not be rendered.");
  }
}
