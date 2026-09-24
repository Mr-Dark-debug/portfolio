import { NextResponse } from "next/server";
import { clearStudioCookie } from "@/lib/studio/auth";
import { guardStudio } from "@/lib/studio/api";

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-logout", 20, 60);
  if (denied) return denied;
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearStudioCookie());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
