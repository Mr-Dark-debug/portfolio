"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  GitCommitHorizontal,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { RepositorySnapshot } from "@/lib/project-repository";

export function ProjectInsights({
  projectKey,
  locale,
}: {
  projectKey: string;
  locale: string;
}) {
  const [snapshot, setSnapshot] = useState<RepositorySnapshot | null>(null);
  const [repositoryMessage, setRepositoryMessage] = useState(
    "Loading repository details…",
  );
  const [overview, setOverview] = useState("");
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setOverview("");
    setError("");
    setSnapshot(null);
    setGeneratedAt("");
    setRepositoryMessage("Loading repository details…");
    fetch(`/api/projects/overview?key=${encodeURIComponent(projectKey)}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Repository unavailable.");
        setSnapshot(data.snapshot);
        setRepositoryMessage(
          data.repositoryError ||
            (!data.hasRepository
              ? "A public repository has not been linked for this project."
              : ""),
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") setRepositoryMessage(e.message);
      });
    fetch("/api/projects/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: projectKey, locale }),
      signal: controller.signal,
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Overview unavailable.");
        setOverview(data.overview);
        setGeneratedAt(data.generatedAt);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [projectKey, locale, attempt]);
  return (
    <section className="project-insights" aria-label="Project intelligence">
      <div className="insights-main">
        <div className="insights-label">
          <span>
            <Sparkles size={15} aria-hidden="true" /> AI project overview
          </span>
          <span>
            {loading
              ? "Preparing your overview…"
              : error
                ? "Overview unavailable"
                : "Generated on this visit"}
          </span>
        </div>
        <div aria-live="polite" aria-busy={loading}>
          {loading && (
            <div className="overview-loading">
              <div />
              <div />
              <div />
              <p>Reading the project context and repository evidence.</p>
            </div>
          )}
          {overview && (
            <div className="project-overview-markdown">
              <ReactMarkdown
                skipHtml
                components={{
                  img: () => null,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {overview}
              </ReactMarkdown>
              <p className="overview-disclosure">
                AI-generated from project documentation; implementation is not
                independently verified. Check the linked sources.{" "}
                {generatedAt && (
                  <time dateTime={generatedAt}>
                    {new Date(generatedAt).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                )}
              </p>
            </div>
          )}
          {error && (
            <div className="overview-error">
              <p role="status">{error}</p>
              <button
                className="outline-button mt-4"
                onClick={() => setAttempt((n) => n + 1)}
              >
                <RefreshCw size={15} /> Try again
              </button>
            </div>
          )}
        </div>
      </div>
      <aside className="repository-panel" aria-label="Repository facts">
        <p className="eyebrow">From the repository</p>
        {snapshot ? (
          <>
            <a
              className="repository-name"
              href={snapshot.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {snapshot.name}
              <ArrowUpRight size={17} />
            </a>
            <dl className="repository-stats">
              <div>
                <dt>Stars</dt>
                <dd>{snapshot.stars}</dd>
              </div>
              <div>
                <dt>Forks</dt>
                <dd>{snapshot.forks}</dd>
              </div>
              <div>
                <dt>Open issues & PRs</dt>
                <dd>{snapshot.openIssues}</dd>
              </div>
            </dl>
            <h3>Languages</h3>
            <div className="language-bar" aria-hidden="true">
              {snapshot.languages.map((l, i) => (
                <span
                  key={l.name}
                  style={{
                    flex: l.percent,
                    background: [
                      "#c4b5fd",
                      "#d4f994",
                      "#76d4d0",
                      "#f6bc9e",
                      "#8caaff",
                    ][i % 5],
                  }}
                />
              ))}
            </div>
            <ul className="language-list">
              {snapshot.languages.map((l) => (
                <li key={l.name}>
                  <span>{l.name}</span>
                  <span>{l.percent}%</span>
                </li>
              ))}
            </ul>
            <dl className="repository-meta">
              <div>
                <dt>Default branch</dt>
                <dd>{snapshot.branch}</dd>
              </div>
              <div>
                <dt>License</dt>
                <dd>{snapshot.license || "Not specified"}</dd>
              </div>
              <div>
                <dt>Last pushed</dt>
                <dd>
                  {new Date(snapshot.pushedAt).toLocaleDateString(locale)}
                </dd>
              </div>
            </dl>
            {snapshot.archived && (
              <p className="text-amber-200 text-sm">
                This repository is archived.
              </p>
            )}
            {snapshot.homepage && (
              <a
                className="outline-button mt-4"
                data-track="demo_click"
                href={snapshot.homepage}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit project <ArrowUpRight size={16} />
              </a>
            )}
            <p className="repository-freshness">
              GitHub data refreshed within five minutes.{" "}
              {snapshot.unavailable.length > 0 &&
                `Unavailable: ${snapshot.unavailable.join(", ")}.`}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400" role="status">
            {repositoryMessage}
          </p>
        )}
      </aside>
      {snapshot && (
        <div className="project-commits">
          <div className="flex items-center justify-between gap-4">
            <h3>
              <GitCommitHorizontal size={19} /> Recent commits
            </h3>
            <a
              href={`${snapshot.url}/commits`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View history ↗
            </a>
          </div>
          <ul>
            {snapshot.commits.map((c) => (
              <li key={c.sha}>
                <code>{c.sha}</code>
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.message}
                </a>
                <time dateTime={c.date}>
                  {new Date(c.date).toLocaleDateString(locale)}
                </time>
              </li>
            ))}
          </ul>
          {!snapshot.commits.length && (
            <p className="mt-4 text-sm text-slate-400">
              No recent commit data is available.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
