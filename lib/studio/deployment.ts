import "server-only";

export type DeploymentRequest = "local" | "queued" | "not-configured" | "failed";

/** A Git commit changes the content source; the public Next.js bundle needs a new build. */
export async function requestContentDeployment(): Promise<DeploymentRequest> {
  if (!process.env.VERCEL) return "local";
  const configuredUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!configuredUrl) return "not-configured";

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" || url.hostname !== "api.vercel.com" || !/^\/v1\/integrations\/deploy\/prj_[A-Za-z0-9]+\/[A-Za-z0-9]+$/.test(url.pathname) || url.search || url.hash) {
      return "failed";
    }
    const response = await fetch(url, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(12_000) });
    return response.ok ? "queued" : "failed";
  } catch {
    return "failed";
  }
}
