import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import { slugSchema } from "./schema";

export interface ManagedFile {
  path: string;
  content: string;
  sha?: string;
  source: "github" | "local";
}

export interface ManagedBinary {
  path: string;
  data: Buffer;
  sha?: string;
  source: "github" | "local";
}

export interface GithubCommit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export class CmsError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "CMS_UNAVAILABLE") {
    super(message);
    this.name = "CmsError";
    this.status = status;
    this.code = code;
  }
}

function config() {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  const owner = process.env.GITHUB_CONTENT_OWNER;
  const repo = process.env.GITHUB_CONTENT_REPO;
  const branch = process.env.GITHUB_CONTENT_BRANCH || "main";
  if (!token || !owner || !repo) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) throw new CmsError("GitHub repository configuration is invalid.", 500, "GITHUB_CONFIG");
  return { token, owner, repo, branch };
}

function encodedPath(value: string): string {
  return value.split("/").map((part) => encodeURIComponent(part)).join("/");
}

async function githubRequest<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const github = config();
  if (!github) throw new CmsError("GitHub content storage is not configured.", 503, "GITHUB_NOT_CONFIGURED");
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${github.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const status = response.status === 409 ? 409 : response.status === 404 ? 404 : 502;
    const code = response.status === 409 ? "GITHUB_CONFLICT" : response.status === 404 ? "GITHUB_NOT_FOUND" : "GITHUB_UNAVAILABLE";
    throw new CmsError(status === 409 ? "GitHub reported a content conflict. Reload and try again." : "GitHub content storage is unavailable.", status, code);
  }
  return (await response.json()) as T;
}

function assertContentPath(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\0") || /[\u0000-\u001f]/.test(normalized)) {
    throw new CmsError("Invalid content path.", 400, "INVALID_PATH");
  }
  return normalized;
}

function localPath(value: string): string {
  const normalized = assertContentPath(value);
  const parts = normalized.split("/");
  if (parts[0] === "data" && parts.length > 1) return path.join(process.cwd(), "data", ...parts.slice(1));
  if (parts[0] === "public" && parts.length > 1) return path.join(process.cwd(), "public", ...parts.slice(1));
  throw new CmsError("Invalid content path.", 400, "INVALID_PATH");
}

function localParts(value: string): { root: "data" | "public"; parts: string[] } {
  const normalized = assertContentPath(value);
  const [root, ...parts] = normalized.split("/");
  if ((root !== "data" && root !== "public") || parts.length === 0) throw new CmsError("Invalid content path.", 400, "INVALID_PATH");
  return { root, parts };
}

async function readLocalFile(value: string): Promise<Buffer> {
  const { root, parts } = localParts(value);
  if (root === "data") return fs.readFile(path.join(process.cwd(), "data", ...parts));
  return fs.readFile(path.join(process.cwd(), "public", ...parts));
}

async function readLocalDirectory(value: string) {
  const { root, parts } = localParts(value);
  if (root === "data") return fs.readdir(path.join(process.cwd(), "data", ...parts), { withFileTypes: true });
  return fs.readdir(path.join(process.cwd(), "public", ...parts), { withFileTypes: true });
}

export function isGithubConfigured(): boolean {
  return Boolean(config());
}

export async function getTextFile(filePath: string): Promise<ManagedFile | null> {
  const normalized = assertContentPath(filePath);
  const github = config();
  if (github) {
    try {
      const result = await githubRequest<{ content: string; encoding: string; sha: string; path: string }>(
        `/repos/${github.owner}/${github.repo}/contents/${encodedPath(normalized)}?ref=${encodeURIComponent(github.branch)}`,
      );
      if (result.encoding !== "base64") throw new CmsError("GitHub returned an unsupported content encoding.", 502, "GITHUB_ENCODING");
      return { path: normalized, content: Buffer.from(result.content.replace(/\s/g, ""), "base64").toString("utf8"), sha: result.sha, source: "github" };
    } catch (error) {
      if (error instanceof CmsError && error.code === "GITHUB_NOT_FOUND") return null;
      throw error;
    }
  }
  try {
    return { path: normalized, content: (await readLocalFile(normalized)).toString("utf8"), source: "local" };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function getTextFileAtRef(filePath: string, ref: string): Promise<ManagedFile | null> {
  const normalized = assertContentPath(filePath);
  const github = config();
  if (!github) return getTextFile(normalized);
  try {
    const result = await githubRequest<{ content: string; encoding: string; sha: string; path: string }>(`/repos/${github.owner}/${github.repo}/contents/${encodedPath(normalized)}?ref=${encodeURIComponent(ref)}`);
    if (result.encoding !== "base64") throw new CmsError("GitHub returned an unsupported content encoding.", 502, "GITHUB_ENCODING");
    return { path: normalized, content: Buffer.from(result.content.replace(/\s/g, ""), "base64").toString("utf8"), sha: result.sha, source: "github" };
  } catch (error) {
    if (error instanceof CmsError && error.code === "GITHUB_NOT_FOUND") return null;
    throw error;
  }
}

export async function putTextFile(filePath: string, content: string, message: string, sha?: string): Promise<ManagedFile> {
  const normalized = assertContentPath(filePath);
  if (content.length > 2_000_000) throw new CmsError("Content is too large to commit.", 413, "CONTENT_TOO_LARGE");
  const github = config();
  if (github) {
    const result = await githubRequest<{ content: { sha: string; path: string } }>(`/repos/${github.owner}/${github.repo}/contents/${encodedPath(normalized)}`, {
      method: "PUT",
      body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64"), branch: github.branch, ...(sha ? { sha } : {}) }),
    });
    return { path: normalized, content, sha: result.content.sha, source: "github" };
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) throw new CmsError("GitHub content storage is required for hosted editing.", 503, "GITHUB_NOT_CONFIGURED");
  const target = localPath(normalized);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, "utf8");
  return { path: normalized, content, source: "local" };
}

export async function deleteFile(filePath: string, message: string, sha?: string): Promise<void> {
  const normalized = assertContentPath(filePath);
  const github = config();
  if (github) {
    const current = sha || (await getTextFile(normalized))?.sha;
    if (!current) throw new CmsError("The content no longer exists.", 404, "CONTENT_NOT_FOUND");
    await githubRequest(`/repos/${github.owner}/${github.repo}/contents/${encodedPath(normalized)}`, {
      method: "DELETE",
      body: JSON.stringify({ message, sha: current, branch: github.branch }),
    });
    return;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) throw new CmsError("GitHub content storage is required for hosted editing.", 503, "GITHUB_NOT_CONFIGURED");
  await fs.rm(localPath(normalized), { force: true });
}

export async function putBinaryFile(filePath: string, data: Buffer, message: string, sha?: string): Promise<ManagedBinary> {
  const normalized = assertContentPath(filePath);
  if (data.length > 12_000_000) throw new CmsError("Media file is too large.", 413, "MEDIA_TOO_LARGE");
  const github = config();
  if (github) {
    const result = await githubRequest<{ content: { sha: string; path: string } }>(`/repos/${github.owner}/${github.repo}/contents/${encodedPath(normalized)}`, {
      method: "PUT",
      body: JSON.stringify({ message, content: data.toString("base64"), branch: github.branch, ...(sha ? { sha } : {}) }),
    });
    return { path: normalized, data, sha: result.content.sha, source: "github" };
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) throw new CmsError("GitHub content storage is required for hosted media.", 503, "GITHUB_NOT_CONFIGURED");
  const target = localPath(normalized);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  return { path: normalized, data, source: "local" };
}

export async function deleteBinaryFile(filePath: string, message: string): Promise<void> {
  await deleteFile(filePath, message);
}

interface GithubTreeEntry {
  type: "file" | "dir";
  path: string;
  sha: string;
}

export async function listDirectory(directory: string): Promise<GithubTreeEntry[]> {
  const normalized = assertContentPath(directory);
  const github = config();
  if (github) {
    return githubRequest<GithubTreeEntry[]>(`/repos/${github.owner}/${github.repo}/contents/${encodedPath(normalized)}?ref=${encodeURIComponent(github.branch)}`);
  }
  try {
    const entries = await readLocalDirectory(normalized);
    return entries.map((entry) => ({ type: entry.isDirectory() ? "dir" : "file", path: `${normalized}/${entry.name}`, sha: "" }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function listMarkdownFiles(directory: string): Promise<ManagedFile[]> {
  const entries = await listDirectory(directory);
  const files: ManagedFile[] = [];
  for (const entry of entries) {
    if (entry.type === "dir") files.push(...(await listMarkdownFiles(entry.path)));
    else if (entry.path.endsWith(".md")) {
      const file = await getTextFile(entry.path);
      if (file) files.push(file);
    }
  }
  return files;
}

export async function listMediaFiles(directory = "public/blog"): Promise<ManagedFile[]> {
  const entries = await listDirectory(directory);
  const files: ManagedFile[] = [];
  for (const entry of entries) {
    if (entry.type === "dir") files.push(...(await listMediaFiles(entry.path)));
    else if (/\.(?:jpe?g|png|webp|avif|gif|svg)$/i.test(entry.path)) {
      const github = config();
      if (github) {
        const item = await githubRequest<{ content: string; encoding: string; sha: string; path: string }>(`/repos/${github.owner}/${github.repo}/contents/${encodedPath(entry.path)}?ref=${encodeURIComponent(github.branch)}`);
        files.push({ path: item.path, content: "", sha: item.sha, source: "github" });
      } else {
        const binary = await readLocalFile(entry.path);
        files.push({ path: entry.path, content: binary.toString("base64"), source: "local" });
      }
    }
  }
  return files;
}

export async function getRevisions(filePath: string, limit = 20): Promise<GithubCommit[]> {
  const normalized = assertContentPath(filePath);
  const github = config();
  if (!github) return [];
  type Commit = { sha: string; commit: { message: string; author?: { name?: string; date?: string } }; author?: { login?: string } };
  const commits = await githubRequest<Commit[]>(`/repos/${github.owner}/${github.repo}/commits?path=${encodeURIComponent(normalized)}&sha=${encodeURIComponent(github.branch)}&per_page=${Math.min(100, Math.max(1, limit))}`);
  return commits.map((item) => ({
    sha: item.sha,
    message: item.commit.message.split("\n")[0] || "Content update",
    date: item.commit.author?.date || new Date().toISOString(),
    author: item.author?.login || item.commit.author?.name || "GitHub",
  }));
}

export async function getActivity(limit = 20): Promise<GithubCommit[]> {
  const github = config();
  if (!github) return [];
  type Commit = { sha: string; commit: { message: string; author?: { name?: string; date?: string } }; author?: { login?: string } };
  const commits = await githubRequest<Commit[]>(`/repos/${github.owner}/${github.repo}/commits?sha=${encodeURIComponent(github.branch)}&per_page=${Math.min(100, Math.max(1, limit))}`);
  return commits
    .filter((item) => /^(content|media|feat|fix|docs)\(/.test(item.commit.message))
    .map((item) => ({ sha: item.sha, message: item.commit.message.split("\n")[0] || "Content update", date: item.commit.author?.date || new Date().toISOString(), author: item.author?.login || item.commit.author?.name || "GitHub" }));
}

export function articleContentPath(slug: string, draft: boolean): string {
  const valid = slugSchema.safeParse(slug);
  if (!valid.success) throw new CmsError("Invalid article slug.", 400, "INVALID_SLUG");
  return `data/${draft ? "drafts" : "posts"}/${valid.data}.md`;
}

export function articleDirectory(slug: string): string {
  const valid = slugSchema.safeParse(slug);
  if (!valid.success) throw new CmsError("Invalid article slug.", 400, "INVALID_SLUG");
  return `public/blog/${valid.data}`;
}

export function isCmsConfigured(): boolean {
  return isGithubConfigured();
}

export function publicAssetUrl(filePath: string): string {
  return `/${filePath.replace(/^public\//, "")}`;
}
