import { NextResponse } from "next/server";
import { studioSessionFromRequest } from "@/lib/studio/auth";
import { guardStudio } from "@/lib/studio/api";

export async function GET(request: Request) {
  const denied = await guardStudio(request, "studio-session", 30, 60);
  if (denied) return denied;
  const session = await studioSessionFromRequest(request);
  return NextResponse.json({ authenticated: Boolean(session), username: session?.sub || null }, { headers: { "Cache-Control": "no-store" } });
}
