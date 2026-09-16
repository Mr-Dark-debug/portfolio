import { promises as fs } from "fs";
import path from "path";
import { allowedProfileHosts, publicProfile } from "./profile";

const MAX_TEXT = 4000;

function compactText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
}

async function fetchWithTimeout(url: string, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: {
        "User-Agent": "PrashantPortfolioBot/1.0",
        Accept: "text/html,application/json,text/plain",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getVerifiedProfileInfo(input: { topic?: string }) {
  return {
    ok: true,
    topic: input.topic || "general",
    profile: publicProfile,
    instruction: "Use these as verified public facts. Do not infer private details that are not present.",
  };
}

export async function searchWeb(input: { query: string }) {
  if (process.env.AI_WEB_SEARCH_ENABLED === "false") {
    return {
      ok: false,
      reason: "Web search is disabled by configuration.",
      query: input.query,
    };
  }

  try {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", input.query);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("skip_disambig", "1");

    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
    const data = await response.json();

    const related = Array.isArray(data.RelatedTopics)
      ? data.RelatedTopics.flatMap((topic: any) => ("Topics" in topic ? topic.Topics : topic)).slice(0, 5)
      : [];

    return {
      ok: Boolean(data.AbstractText || related.length),
      query: input.query,
      abstract: data.AbstractText || null,
      source: data.AbstractSource || "DuckDuckGo",
      results: related
        .map((topic: any) => ({
          title: topic.Text,
          url: topic.FirstURL,
        }))
        .filter((item: any) => item.title && item.url),
    };
  } catch (error) {
    return {
      ok: false,
      query: input.query,
      reason: error instanceof Error ? error.message : "Web search failed.",
    };
  }
}

export async function fetchPublicProfilePage(input: { url: string }) {
  try {
    const url = new URL(input.url);
    if (url.protocol !== "https:" || url.port || url.username || url.password || !allowedProfileHosts.has(url.hostname)) {
      return {
        ok: false,
        reason: "URL is not an approved public profile source.",
        allowedHosts: Array.from(allowedProfileHosts),
      };
    }

    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    return {
      ok: true,
      url: url.toString(),
      contentType,
      text: compactText(body),
    };
  } catch (error) {
    return {
      ok: false,
      url: input.url,
      reason: error instanceof Error ? error.message : "Profile fetch failed.",
    };
  }
}

export async function readLocalPortfolioContent(input: { query: string }) {
 try { const { searchKnowledge } = await import('./knowledge'); return { ok:true, matches:await searchKnowledge(input.query) }; }
 catch { return { ok:false, reason:'Portfolio search is temporarily unavailable.' }; }
}
