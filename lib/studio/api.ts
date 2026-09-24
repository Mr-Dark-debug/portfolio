import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, isStudioAuthorized, studioUnauthorized } from "./auth";

export async function guardStudio(request: Request, scope = "studio-api", limit = 60, seconds = 60): Promise<Response | null> {
  if (!(await isStudioAuthorized(request))) return studioUnauthorized();
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  return rateLimit(request, scope, limit, seconds);
}

export function errorResponse(error: unknown, fallback = "Studio request failed.") {
  const message = error instanceof Error && !/stack|token|secret|password/i.test(error.message) ? error.message : fallback;
  const status = typeof error === "object" && error && "status" in error && typeof error.status === "number" ? error.status : 500;
  return NextResponse.json({ error: message }, { status: status >= 400 && status < 600 ? status : 500 });
}

export function noStoreJson(value: unknown, init: ResponseInit = {}) {
  const response = NextResponse.json(value, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
