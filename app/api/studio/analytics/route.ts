import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/studio/analytics";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardStudio(request, "studio-analytics", 30, 60);
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    const days = Math.min(365, Math.max(1, Number(params.get("days") || 30)));
    const path = params.get("path") || undefined;
    return NextResponse.json(await getAnalyticsSnapshot({ days, path }), { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    return errorResponse(error, "Analytics are temporarily unavailable.");
  }
}
