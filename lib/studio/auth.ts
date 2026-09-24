import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { SignJWT, jwtVerify } from "jose";

export const STUDIO_SESSION_COOKIE = "prashant_studio_session";
export const STUDIO_SESSION_MAX_AGE = 10 * 60 * 60;
export const STUDIO_PREVIEW_MAX_AGE = 15 * 60;

export interface StudioSession {
  sub: string;
  iat: number;
  exp: number;
  nonce: string;
}

function secretKey(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(value);
}

export function safeUsernameEqual(left: string, right: string): boolean {
  return timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest());
}

export async function hashAdminPassword(password: string): Promise<string> {
  if (password.length < 12) throw new Error("Use a password with at least 12 characters");
  return hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
}

export async function verifyAdminPassword(password: string, encodedHash = process.env.ADMIN_PASSWORD_HASH): Promise<boolean> {
  if (!encodedHash || password.length > 512) return false;
  try {
    if (encodedHash.startsWith("argon2id$")) return await verify(encodedHash.replace(/^argon2id\$/, "$argon2id$"), password);
    if (encodedHash.startsWith("scrypt$")) {
      const [, salt, digest] = encodedHash.split("$");
      if (!salt || !digest) return false;
      const expected = Buffer.from(digest, "hex");
      const actual = scryptSync(password, salt, expected.length);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    }
    return await verify(encodedHash, password);
  } catch {
    return false;
  }
}

export async function createStudioSession(username = process.env.ADMIN_USERNAME, now = Date.now()): Promise<string> {
  if (!username) throw new Error("ADMIN_USERNAME is not configured");
  return new SignJWT({ nonce: randomBytes(12).toString("base64url") })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(username)
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000) + STUDIO_SESSION_MAX_AGE)
    .sign(secretKey());
}

export async function verifyStudioSession(token: string | undefined, now = Date.now()): Promise<StudioSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const expectedUser = process.env.ADMIN_USERNAME;
    if (!expectedUser || payload.sub !== expectedUser || typeof payload.iat !== "number" || typeof payload.exp !== "number" || payload.exp <= Math.floor(now / 1000) || typeof payload.nonce !== "string") return null;
    return { sub: payload.sub, iat: payload.iat, exp: payload.exp, nonce: payload.nonce };
  } catch {
    return null;
  }
}

export async function createPreviewToken(slug: string, now = Date.now()): Promise<string> {
  return new SignJWT({ slug, kind: "preview" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000) + STUDIO_PREVIEW_MAX_AGE)
    .sign(secretKey());
}

export async function verifyPreviewToken(token: string | undefined, slug: string, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.kind === "preview" && payload.slug === slug && typeof payload.exp === "number" && payload.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function studioSessionFromRequest(request: Request): Promise<StudioSession | null> {
  return verifyStudioSession(cookieValue(request, STUDIO_SESSION_COOKIE));
}

export async function isStudioAuthorized(request: Request): Promise<boolean> {
  return Boolean(await studioSessionFromRequest(request));
}

export function studioCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return `${STUDIO_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${STUDIO_SESSION_MAX_AGE}; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}

export function clearStudioCookie(): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return `${STUDIO_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}

export function studioUnauthorized() {
  return Response.json({ error: "Studio sign-in required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : requestUrl.origin;
    const loopback = (value: string) => value === "localhost" || value === "127.0.0.1" || value === "[::1]";
    return origin === requestUrl.origin || origin === configuredOrigin || (loopback(requestUrl.hostname) && loopback(originUrl.hostname) && requestUrl.port === originUrl.port);
  } catch {
    return false;
  }
}
