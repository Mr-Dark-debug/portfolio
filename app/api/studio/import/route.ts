import { NextResponse } from "next/server";
import { guardStudio, errorResponse } from "@/lib/studio/api";
import { importDocument } from "@/lib/studio/import-document";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-import", 12, 60);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Select a document to import." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "The document must be under 5 MB." }, { status: 413 });
    const result = await importDocument(file.name, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /document|file|title|slug|metadata|body|Word|Markdown|text|MB/i.test(error.message))
      return NextResponse.json({ error: error.message }, { status: 400 });
    return errorResponse(error, "The document could not be imported.");
  }
}
