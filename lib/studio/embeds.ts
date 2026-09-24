import { z } from "zod";
import { socialEmbedSchema, type SocialEmbed } from "./schema";
import { providerFromUrl, youtubeVideoId } from "./embed-providers";

export { providerFromUrl, youtubeVideoId, embedLabel, embedHref, safeExternalUrl } from "./embed-providers";
export type { SocialEmbedProvider } from "./embed-providers";

export function normalizeSocialEmbed(input: unknown): SocialEmbed | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url.trim() : "";
  const provider = typeof record.provider === "string" ? record.provider : providerFromUrl(url);
  if (!url || !provider) return null;
  const parsed = socialEmbedSchema.safeParse({
    provider,
    url,
    title: typeof record.title === "string" ? record.title : undefined,
    description: typeof record.description === "string" ? record.description : undefined,
    thumbnail: typeof record.thumbnail === "string" ? record.thumbnail : undefined,
    stars: typeof record.stars === "number" ? record.stars : undefined,
    language: typeof record.language === "string" ? record.language : undefined,
    start: typeof record.start === "number" ? record.start : undefined,
  });
  if (!parsed.success) return null;
  if (parsed.data.provider === "youtube" && !youtubeVideoId(parsed.data.url)) return null;
  return parsed.data;
}

export function normalizeSocialEmbeds(values: unknown): SocialEmbed[] {
  const source = Array.isArray(values) ? values : [];
  const result: SocialEmbed[] = [];
  const seen = new Set<string>();
  for (const value of source) {
    const embed = normalizeSocialEmbed(value);
    if (!embed) continue;
    const key = `${embed.provider}:${embed.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(embed);
    }
  }
  return result;
}

export function embedsFromFrontmatter(data: Record<string, unknown>): SocialEmbed[] {
  return normalizeSocialEmbeds([
    ...(Array.isArray(data.socialEmbeds) ? data.socialEmbeds : []),
    ...["youtube", "instagram", "facebook", "twitter", "linkedin", "github"].flatMap((key) => {
      const values = Array.isArray(data[key]) ? data[key] : [];
      return values.map((url) => ({ provider: key === "twitter" ? "x" : key, url }));
    }),
  ]);
}

export function extractEmbedDirectives(markdown: string): { markdown: string; embeds: SocialEmbed[] } {
  const embeds: SocialEmbed[] = [];
  const cleaned = markdown.replace(/^:::\s*(?:embed|video|social)\s+(https?:\/\/[^\s]+)(?:\s+.*)?$/gim, (_match, url: string) => {
    const embed = normalizeSocialEmbed({ url });
    if (embed) embeds.push(embed);
    return "";
  });
  return { markdown: cleaned, embeds: normalizeSocialEmbeds(embeds) };
}

export function parseEmbedRequest(value: unknown): z.infer<typeof socialEmbedSchema> | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  try {
    const checked = new URL(trimmed);
    if (checked.protocol !== "https:" && checked.protocol !== "http:") return null;
  } catch {
    return null;
  }
  const provider = providerFromUrl(trimmed);
  return provider ? normalizeSocialEmbed({ url: trimmed, provider }) : null;
}
