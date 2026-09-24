import { NextResponse } from "next/server";
import { z } from "zod";
import { getYouTubeMetadata } from "@/lib/studio/social-metadata";
import { providerFromUrl } from "@/lib/studio/embeds";
import { guardStudio, errorResponse } from "@/lib/studio/api";

export const runtime = "nodejs";
const schema = z.object({ url: z.string().url().max(2000) });

export async function POST(request: Request) {
  const denied = await guardStudio(request, "studio-social-metadata", 20, 600);
  if (denied) return denied;
  try {
    const { url } = schema.parse(await request.json());
    const provider = providerFromUrl(url);
    if (provider !== "youtube") return NextResponse.json({ available: false, provider, metadata: null, message: "No approved metadata adapter is configured for this provider." }, { headers: { "Cache-Control": "no-store" } });
    const metadata = await getYouTubeMetadata(url);
    return NextResponse.json({ available: Boolean(metadata), provider, metadata, message: metadata ? undefined : "YouTube metadata was unavailable; a link card will be used." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "The provider URL is invalid." }, { status: 400 });
    return errorResponse(error, "Social metadata is unavailable.");
  }
}
