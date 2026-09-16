import { NextResponse } from "next/server";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import { isAdminAuthorized, adminUnauthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorized();
  let markdown = "";
  try {
    const body = await req.json();
    markdown = typeof body?.markdown === "string" ? body.markdown : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!markdown.trim() || markdown.length > 100000) {
    return NextResponse.json(
      { error: "Markdown is required (max 100k chars)" },
      { status: 400 }
    );
  }
  const rendered = String(
    await remark().use(remarkGfm).use(html, { sanitize: true }).process(markdown)
  )
    .replace(/<h1>/g, "<h2>")
    .replace(/<\/h1>/g, "</h2>");
  return NextResponse.json({ html: rendered });
}
