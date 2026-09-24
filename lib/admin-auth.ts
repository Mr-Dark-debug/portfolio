import { createHash, timingSafeEqual } from "node:crypto";

export function isAdminAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_TOKEN;
  if (!secret) return false;
  const authorization = request.headers.get("authorization") || "";
  let supplied = request.headers.get("x-admin-token") || "";
  if (authorization.startsWith("Bearer ")) supplied = authorization.slice(7);
  if (authorization.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authorization.slice(6), "base64").toString();
      supplied = decoded.slice(decoded.indexOf(":") + 1);
    } catch {
      supplied = "";
    }
  }
  const expected = createHash("sha256").update(secret).digest();
  const actual = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expected, actual);
}

export function adminUnauthorized() {
  return Response.json(
    { error: "Administrator sign-in required." },
    { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Portfolio Admin", charset="UTF-8"', "Cache-Control": "no-store" } },
  );
}
