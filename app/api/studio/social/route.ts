import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSocialItems, saveSocialItems } from "@/lib/studio/content";
import { guardStudio, errorResponse } from "@/lib/studio/api";
import { socialItemSchema } from "@/lib/studio/schema";
import { isGithubConfigured } from "@/lib/studio/github";
import { requestContentDeployment } from "@/lib/studio/deployment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const itemsSchema = z.object({ items: z.array(socialItemSchema).max(200) });

export async function GET(request: Request) {
  const denied = await guardStudio(request, "studio-social-list", 60, 60);
  if (denied) return denied;
  try { return NextResponse.json({ items: await getSocialItems() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error, "Could not load the social hub."); }
}

export async function PUT(request: Request) {
  const denied = await guardStudio(request, "studio-social-write", 20, 60);
  if (denied) return denied;
  try {
    const input = itemsSchema.parse(await request.json());
    const items = input.items.map((item) => ({ ...item, id: item.id || randomUUID() }));
    const saved = await saveSocialItems(items);
    return NextResponse.json({ items: saved, deployment: isGithubConfigured() ? await requestContentDeployment() : "local" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Social item data is invalid." }, { status: 400 });
    return errorResponse(error, "Could not save the social hub.");
  }
}
