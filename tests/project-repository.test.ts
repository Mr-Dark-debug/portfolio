import { afterEach, describe, expect, it, vi } from "vitest";
import { repositorySnapshot, resolveProject } from "../lib/project-repository";

afterEach(() => vi.unstubAllGlobals());
describe("project repository boundary", () => {
  it.each([
    "repo:other-user/project",
    "repo:Mr-Dark-debug/..",
    "repo:Mr-Dark-debug/a/b",
    "repo:Mr-Dark-debug/a?token=x",
    "https://example.com",
    "missing",
  ])("rejects unsupported key %s", (key) =>
    expect(resolveProject(key)).toBeNull(),
  );
  it("resolves curated and owned public repository candidates", () => {
    expect(resolveProject("pocketllm")?.repo).toBe("PocketLLM/PocketLLM");
    expect(resolveProject("moltjobs")?.repo).toBeNull();
    expect(resolveProject("repo:Mr-Dark-debug/portfolio")?.title).toBe(
      "portfolio",
    );
  });
  it("rejects private repository metadata before reading its contents", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ private: true }));
    vi.stubGlobal("fetch", fetcher);
    await expect(repositorySnapshot("Mr-Dark-debug/portfolio")).rejects.toThrow(
      "Only public",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("preserves source facts when GitHub returns partial data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/languages"))
          return Response.json({ TypeScript: 75, Python: 25 });
        if (url.includes("/commits?"))
          return Response.json([
            {
              sha: "abcdef12345",
              commit: {
                message: "Fix real bug\nBody",
                committer: { date: "2026-09-19T12:00:00Z" },
              },
              html_url:
                "https://github.com/Mr-Dark-debug/portfolio/commit/abcdef12345",
            },
          ]);
        if (url.endsWith("/readme")) return new Response("", { status: 503 });
        return Response.json({
          full_name: "Mr-Dark-debug/portfolio",
          html_url: "https://github.com/Mr-Dark-debug/portfolio",
          private: false,
          stargazers_count: 12,
          forks_count: 3,
          open_issues_count: 1,
          default_branch: "main",
          pushed_at: "2026-09-19T12:00:00Z",
          homepage: "javascript:alert(1)",
        });
      }),
    );
    const result = await repositorySnapshot("Mr-Dark-debug/portfolio");
    expect(result.stars).toBe(12);
    expect(result.languages).toEqual([
      { name: "TypeScript", percent: 75 },
      { name: "Python", percent: 25 },
    ]);
    expect(result.commits[0].message).toBe("Fix real bug");
    expect(result.commits[0].sha).toBe("abcdef1");
    expect(result.unavailable).toEqual(["README"]);
    expect(result.homepage).toBeNull();
  });
});
