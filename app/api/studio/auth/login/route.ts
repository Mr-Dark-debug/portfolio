import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createStudioSession, isSameOrigin, safeUsernameEqual, studioCookie, verifyAdminPassword } from "@/lib/studio/auth";

const loginSchema = z.object({ username: z.string().trim().min(1).max(120), password: z.string().min(1).max(512) });

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "studio-login", 8, 600);
  if (limited) return limited;
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  let input: z.infer<typeof loginSchema>;
  try {
    input = loginSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid username and password." }, { status: 400 });
  }
  const expectedUsername = process.env.ADMIN_USERNAME;
  if (!expectedUsername || !process.env.ADMIN_PASSWORD_HASH || !process.env.SESSION_SECRET) return NextResponse.json({ error: "Studio authentication is not configured." }, { status: 503 });
  const usernameMatches = safeUsernameEqual(input.username, expectedUsername);
  let passwordMatches = false;
  try {
    passwordMatches = await verifyAdminPassword(input.password);
  } catch {
    passwordMatches = false;
  }
  if (!usernameMatches || !passwordMatches) return NextResponse.json({ error: "The username or password is incorrect." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const response = NextResponse.json({ ok: true });
    response.headers.set("Set-Cookie", studioCookie(await createStudioSession(expectedUsername)));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Studio session configuration is invalid." }, { status: 503 });
  }
}
