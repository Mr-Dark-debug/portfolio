import { NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, saveSettings } from "@/lib/studio/content";
import { guardStudio, errorResponse } from "@/lib/studio/api";
import { socialSettingsSchema } from "@/lib/studio/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardStudio(request, "studio-settings-read", 30, 60);
  if (denied) return denied;
  try { return NextResponse.json({ settings: await getSettings() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error, "Could not load Studio settings."); }
}

export async function PUT(request: Request) {
  const denied = await guardStudio(request, "studio-settings-write", 15, 60);
  if (denied) return denied;
  try {
    const settings = socialSettingsSchema.parse(await request.json());
    return NextResponse.json({ settings: await saveSettings(settings) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Studio settings are invalid." }, { status: 400 });
    return errorResponse(error, "Could not save Studio settings.");
  }
}
