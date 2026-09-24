export async function studioFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Studio request failed.");
  return body as T;
}

export type DeploymentRequest = "local" | "queued" | "not-configured" | "failed";

export function deploymentMessage(status?: DeploymentRequest): string {
  if (status === "queued") return " Production build queued; check the live URL after deployment finishes.";
  if (status === "not-configured") return " Git was updated, but no production deployment was requested. Configure the Vercel deploy hook.";
  if (status === "failed") return " Git was updated, but the production deployment request failed. Retry deployment from Vercel.";
  return "";
}

export function formatBytes(value: number): string {
  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";
}
