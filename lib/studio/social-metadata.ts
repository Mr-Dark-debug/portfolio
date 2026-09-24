import "server-only";
import { providerFromUrl, youtubeVideoId } from "./embed-providers";

export interface YouTubeMetadata { videoId: string; title: string; thumbnail: string; author: string; }

export interface GithubMetadata { owner: string; repository: string; title: string; description: string; thumbnail: string; stars: number; language: string; }

export async function getGithubMetadata(url: string): Promise<GithubMetadata | null> {
  if (providerFromUrl(url) !== "github") return null;
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const [owner, repository] = parts;
  if (!owner || !repository || !/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repository)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repository.replace(/\.git$/, "")}`, { signal: controller.signal, headers: { Accept: "application/vnd.github+json", ...(process.env.GITHUB_READ_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_READ_TOKEN}` } : {}) }, next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const value = (await response.json()) as { full_name?: string; description?: string | null; stargazers_count?: number; language?: string | null; owner?: { avatar_url?: string } };
    if (!value.full_name) return null;
    return { owner, repository: value.full_name.split("/")[1] || repository, title: value.full_name, description: value.description || "Public GitHub repository.", thumbnail: value.owner?.avatar_url || "", stars: Number(value.stargazers_count || 0), language: value.language || "" };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const videoId = youtubeVideoId(url);
  if (!videoId) return null;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const value = (await response.json()) as { title?: string; thumbnail_url?: string; author_name?: string };
    return { videoId, title: value.title || "YouTube video", thumbnail: value.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, author: value.author_name || "YouTube" };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
