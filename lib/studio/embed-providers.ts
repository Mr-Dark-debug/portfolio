export type SocialEmbedProvider = "youtube" | "instagram" | "facebook" | "x" | "linkedin" | "github" | "link";

const providerHosts: Record<Exclude<SocialEmbedProvider, "link">, string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "fb.watch"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  github: ["github.com", "www.github.com"],
};

export function providerFromUrl(input: string): SocialEmbedProvider | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    for (const [provider, hosts] of Object.entries(providerHosts) as [Exclude<SocialEmbedProvider, "link">, string[]][]) {
      if (hosts.includes(host)) return provider;
    }
    return "link";
  } catch {
    return null;
  }
}

export function youtubeVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      const value = url.searchParams.get("v");
      if (value && /^[a-zA-Z0-9_-]{6,20}$/.test(value)) return value;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] && /^[a-zA-Z0-9_-]{6,20}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function embedLabel(provider: SocialEmbedProvider): string {
  return { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook", x: "X / Twitter", linkedin: "LinkedIn", github: "GitHub", link: "External link" }[provider];
}

export function embedHref(provider: SocialEmbedProvider, url: string, start?: number): string {
  if (provider === "youtube") {
    const id = youtubeVideoId(url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}` : url;
  }
  return url;
}

export function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
