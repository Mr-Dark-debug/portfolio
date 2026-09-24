import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { CmsError, articleContentPath, putTextFile } from "../lib/studio/github";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("GitHub CMS adapter", () => {
  it("maps article slugs to safe content paths", () => {
    expect(articleContentPath("field-note", false)).toBe("data/posts/field-note.md");
    expect(() => articleContentPath("../escape", false)).toThrow(CmsError);
  });

  it("commits Markdown with branch and SHA conflict protection", async () => {
    vi.stubEnv("GITHUB_CONTENT_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_OWNER", "owner");
    vi.stubEnv("GITHUB_CONTENT_REPO", "portfolio");
    vi.stubEnv("GITHUB_CONTENT_BRANCH", "main");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: { sha: "new-sha", path: "data/posts/note.md" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await putTextFile("data/posts/note.md", "# Note", 'content(blog): update "Note"', "old-sha");
    expect(result.sha).toBe("new-sha");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ message: 'content(blog): update "Note"', branch: "main", sha: "old-sha" });
    expect(body.content).toBe(Buffer.from("# Note").toString("base64"));
  });

  it("surfaces a GitHub merge conflict instead of overwriting", async () => {
    vi.stubEnv("GITHUB_CONTENT_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_OWNER", "owner");
    vi.stubEnv("GITHUB_CONTENT_REPO", "portfolio");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 409 })));
    await expect(putTextFile("data/posts/note.md", "# Note", "update", "old-sha")).rejects.toMatchObject({ code: "GITHUB_CONFLICT", status: 409 });
  });
});
