"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Link2, Loader2, TriangleAlert } from "lucide-react";
import { studioFetch, formatDateTime } from "./studio-api";

type Result = { article: string; slug: string; url: string; status: number; ok: boolean; redirect: string | null; error: string | null };

export default function ToolsWorkspace() {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [checkedAt, setCheckedAt] = useState("");
  const run = async () => { setBusy(true); try { const result = await studioFetch<{ results: Result[]; checkedAt: string }>("/api/studio/tools", { method: "POST", body: JSON.stringify({}) }); setResults(result.results); setCheckedAt(result.checkedAt); } finally { setBusy(false); } };
  return <section className="studio-card"><div className="studio-card-header"><div><h2>Broken link checker</h2><p>Checks article Markdown and explicit references with a small concurrency limit. It never crawls sites or sends identifying data.</p></div><button className="studio-button studio-button-primary" type="button" disabled={busy} onClick={() => void run()}>{busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Link2 aria-hidden="true" />} {busy ? "Checking…" : "Run check"}</button></div>{checkedAt ? <div className="studio-alert" style={{ margin: "1rem" }} role="status">Checked {formatDateTime(checkedAt)}. {results.filter((result) => !result.ok).length} link{results.filter((result) => !result.ok).length === 1 ? "" : "s"} need attention.</div> : null}<div className="studio-table-wrap"><table className="studio-table"><thead><tr><th>Source</th><th>URL</th><th>Status</th><th>Result</th></tr></thead><tbody>{results.map((result) => <tr key={`${result.slug}-${result.url}`}><td>{result.article}</td><td><a className="studio-table-title" href={result.url} target="_blank" rel="noreferrer"><span>{result.url}</span><ExternalLink aria-hidden="true" /></a></td><td>{result.status || "—"}</td><td>{result.ok ? <span className="studio-check studio-check-ok"><CheckCircle2 aria-hidden="true" /> OK</span> : <span className="studio-check studio-check-warning"><TriangleAlert aria-hidden="true" /> {result.error || (result.redirect ? `Redirect ${result.redirect}` : "Needs review")}</span>}</td></tr>)}{!results.length ? <tr><td colSpan={4}><div className="studio-empty"><Link2 aria-hidden="true" /><strong>No link check has run yet.</strong><p>Use the checker after editing references or before a publication push.</p></div></td></tr> : null}</tbody></table></div></section>;
}
