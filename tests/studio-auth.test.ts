import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createPreviewToken, createStudioSession, hashAdminPassword, isSameOrigin, verifyAdminPassword, verifyPreviewToken, verifyStudioSession } from "../lib/studio/auth";

afterEach(() => vi.unstubAllEnvs());

describe("Studio authentication", () => {
  it("hashes and verifies Argon2id passwords without exposing the password", async () => {
    const hash = await hashAdminPassword("a sufficiently long studio password");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain("studio password");
    expect(await verifyAdminPassword("a sufficiently long studio password", hash)).toBe(true);
    expect(await verifyAdminPassword("wrong password", hash)).toBe(false);
  });

  it("issues a signed session with an expiry and rejects tampering", async () => {
    vi.stubEnv("ADMIN_USERNAME", "owner");
    vi.stubEnv("SESSION_SECRET", "a-session-secret-that-is-long-enough-for-tests-123");
    const token = await createStudioSession("owner", Date.now());
    expect(await verifyStudioSession(token)).toMatchObject({ sub: "owner" });
    expect(await verifyStudioSession(`${token}x`)).toBeNull();
    const expired = await createStudioSession("owner", Date.now() - 11 * 60 * 60 * 1000);
    expect(await verifyStudioSession(expired)).toBeNull();
  });

  it("protects preview tokens by slug and expiry", async () => {
    vi.stubEnv("SESSION_SECRET", "a-session-secret-that-is-long-enough-for-tests-123");
    const token = await createPreviewToken("field-note", Date.now());
    expect(await verifyPreviewToken(token, "field-note")).toBe(true);
    expect(await verifyPreviewToken(token, "other-note")).toBe(false);
    const expired = await createPreviewToken("field-note", Date.now() - 16 * 60 * 1000);
    expect(await verifyPreviewToken(expired, "field-note")).toBe(false);
  });

  it("accepts the request origin and rejects a foreign origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prashant.sbs");
    expect(isSameOrigin(new Request("https://prashant.sbs/studio", { headers: { origin: "https://prashant.sbs" } }))).toBe(true);
    expect(isSameOrigin(new Request("https://prashant.sbs/studio", { headers: { origin: "https://evil.example" } }))).toBe(false);
  });
});
