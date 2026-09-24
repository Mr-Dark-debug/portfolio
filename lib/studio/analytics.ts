import "server-only";

export interface AnalyticsSnapshot {
  configured: boolean;
  message?: string;
  range: { since: string; until: string };
  totals?: { pageviews: number; visitors: number };
  pathTotals?: { pageviews: number; visitors: number };
  topPages: Record<string, unknown>[];
  referrers: Record<string, unknown>[];
  devices: Record<string, unknown>[];
  browsers: Record<string, unknown>[];
  operatingSystems: Record<string, unknown>[];
  countries: Record<string, unknown>[];
  timeline: Record<string, unknown>[];
  events: Record<string, unknown>[];
  eventsError?: string;
}

function credentials() {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID };
}

function dateRange(days: number) {
  const until = new Date();
  const since = new Date(until.getTime() - days * 86400000);
  return { since: since.toISOString().slice(0, 10), until: until.toISOString().slice(0, 10) };
}

async function query(endpoint: string, values: Record<string, string | undefined>, days: number): Promise<Record<string, unknown> | null> {
  const config = credentials();
  if (!config) return null;
  const params = new URLSearchParams({ projectId: config.projectId, since: dateRange(days).since, until: dateRange(days).until });
  if (config.teamId) params.set("teamId", config.teamId);
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  try {
    const response = await fetch(`https://api.vercel.com/v1/query/web-analytics/${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${config.token}`, Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: unknown };
    return (body.data && typeof body.data === "object" ? body.data : {}) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
}

function countFields(value: Record<string, unknown> | null) {
  if (!value || typeof value.pageviews !== "number" || typeof value.visitors !== "number") return undefined;
  return { pageviews: value.pageviews, visitors: value.visitors };
}

export async function getAnalyticsSnapshot(options: { days?: number; path?: string } = {}): Promise<AnalyticsSnapshot> {
  const days = Math.min(365, Math.max(1, options.days || 30));
  const range = dateRange(days);
  if (!credentials()) {
    return { configured: false, message: "Analytics API not configured", range, topPages: [], referrers: [], devices: [], browsers: [], operatingSystems: [], countries: [], timeline: [], events: [] };
  }
  const requestedPath = options.path;
  const pathFilter = requestedPath ? `requestPath eq '${requestedPath.replaceAll("'", "''")}'` : undefined;
  const [total, pathTotal, pages, referrers, devices, browsers, operatingSystems, countries, timeline, events] = await Promise.all([
    query("visits/count", {}, days),
    requestedPath ? query("visits/count", { filter: pathFilter }, days) : Promise.resolve(null),
    query("visits/aggregate", { by: "requestPath", limit: "100", filter: pathFilter }, days),
    query("visits/aggregate", { by: "referrerHostname", limit: "20", filter: pathFilter }, days),
    query("visits/aggregate", { by: "deviceType", limit: "10", filter: pathFilter }, days),
    query("visits/aggregate", { by: "browserName", limit: "10", filter: pathFilter }, days),
    query("visits/aggregate", { by: "osName", limit: "10", filter: pathFilter }, days),
    query("visits/aggregate", { by: "country", limit: "10", filter: pathFilter }, days),
    query("visits/aggregate", { by: "day", filter: pathFilter }, days),
    query("events/aggregate", { by: "eventName", limit: "50", filter: pathFilter }, days),
  ]);
  return {
    configured: true,
    message: countFields(total) ? undefined : "The Vercel Analytics API did not return traffic totals. Check the token, project, team, and Analytics access.",
    range,
    totals: countFields(total),
    pathTotals: countFields(pathTotal),
    topPages: rows(pages),
    referrers: rows(referrers),
    devices: rows(devices),
    browsers: rows(browsers),
    operatingSystems: rows(operatingSystems),
    countries: rows(countries),
    timeline: rows(timeline),
    events: rows(events),
    eventsError: events ? undefined : "Custom events are unavailable for this Vercel plan or query.",
  };
}
