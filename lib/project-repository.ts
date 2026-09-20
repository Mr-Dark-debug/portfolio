import { caseStudies } from "./case-studies";

const owners = new Set([
  "mr-dark-debug",
  "pocketllm",
  "syntaxandsips",
  "codex-clone",
  "pschoudhary-dot",
]);
export function resolveProject(key: string) {
  const study = caseStudies.find((project) => project.slug === key);
  const repo =
    study?.repo?.replace("https://github.com/", "") ||
    (key.startsWith("repo:") ? key.slice(5) : null);
  if (!study && !repo) return null;
  if (
    repo &&
    (!/^[\w-]+\/[\w.-]+$/.test(repo) ||
      [".", ".."].includes(repo.split("/")[1]) ||
      !owners.has(repo.split("/")[0].toLowerCase()))
  )
    return null;
  return { key, study, repo, title: study?.title || repo!.split("/")[1] };
}

export type RepositorySnapshot = {
  name: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  branch: string;
  pushedAt: string;
  license: string | null;
  archived: boolean;
  homepage: string | null;
  languages: { name: string; percent: number }[];
  commits: { sha: string; message: string; date: string; url: string }[];
  readme: string;
  readmeUrl: string;
  fetchedAt: string;
  unavailable: string[];
};

async function github(endpoint: string) {
  const response = await fetch(`https://api.github.com/repos/${endpoint}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(process.env.GITHUB_READ_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_READ_TOKEN}` }
        : {}),
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "Repository data not found."
        : "GitHub is temporarily unavailable or rate limited.",
    );
  return response.json();
}

export async function repositorySnapshot(
  repo: string,
): Promise<RepositorySnapshot> {
  if (!resolveProject(`repo:${repo}`))
    throw new Error("Unsupported repository.");
  const metadata = await github(repo);
  if (metadata.private || metadata.visibility === "private")
    throw new Error("Only public repositories can be displayed.");
  const [languagesResult, commitsResult, readmeResult] =
    await Promise.allSettled([
      github(`${repo}/languages`),
      github(`${repo}/commits?per_page=6`),
      github(`${repo}/readme`),
    ]);
  const unavailable: string[] = [];
  const languages =
    languagesResult.status === "fulfilled"
      ? (languagesResult.value as Record<string, number>)
      : {};
  if (languagesResult.status === "rejected") unavailable.push("Languages");
  if (commitsResult.status === "rejected") unavailable.push("Recent commits");
  if (readmeResult.status === "rejected") unavailable.push("README");
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const readme =
    readmeResult.status === "fulfilled" ? readmeResult.value : null;
  return {
    name: metadata.full_name,
    url: metadata.html_url,
    description: metadata.description,
    stars: metadata.stargazers_count,
    forks: metadata.forks_count,
    openIssues: metadata.open_issues_count,
    branch: metadata.default_branch,
    pushedAt: metadata.pushed_at,
    license: metadata.license?.name || null,
    archived: metadata.archived,
    homepage: /^https:\/\//.test(metadata.homepage || "")
      ? metadata.homepage
      : null,
    languages: Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, bytes]) => ({
        name,
        percent: Math.round((bytes / total) * 1000) / 10,
      })),
    commits:
      commitsResult.status === "fulfilled"
        ? commitsResult.value.map((commit: any) => ({
            sha: commit.sha.slice(0, 7),
            message: commit.commit.message.split("\n")[0].slice(0, 180),
            date: commit.commit.committer?.date || commit.commit.author?.date,
            url: commit.html_url,
          }))
        : [],
    readme:
      readme?.encoding === "base64"
        ? Buffer.from(readme.content, "base64").toString("utf8").slice(0, 18000)
        : "",
    readmeUrl: readme?.html_url || metadata.html_url,
    fetchedAt: new Date().toISOString(),
    unavailable,
  };
}
