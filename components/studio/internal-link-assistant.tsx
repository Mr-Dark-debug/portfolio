"use client";

import { useState } from "react";
import { ExternalLink, Link2, Sparkles } from "lucide-react";
import { studioFetch } from "./studio-api";

type Suggestion = { slug: string; title: string; url: string; reason: string };

export default function InternalLinkAssistant({ body, onChange, currentSlug }: { body: string; onChange: (value: string) => void; currentSlug: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const find = async () => { setBusy(true); try { const result = await studioFetch<{ suggestions: Suggestion[] }>("/api/studio/ai/links", { method: "POST", body: JSON.stringify({ body, currentSlug }) }); setSuggestions(result.suggestions); } finally { setBusy(false); } };
  const insert = (suggestion: Suggestion) => { onChange(`${body.trim()}\n\n[Read the related Field Note: ${suggestion.title}](${suggestion.url})\n`); setSuggestions((current) => current.filter((item) => item.slug !== suggestion.slug)); };
  return <section className="studio-panel" style={{ marginTop: "1rem" }}><div className="studio-panel-header"><h3>Internal link assistant</h3><Link2 aria-hidden="true" /></div><p>Suggestions are based on public tags, topics, and the text you provide. Nothing is inserted until you choose Insert.</p><button className="studio-button studio-button-ai" type="button" disabled={busy} onClick={() => void find()}><Sparkles aria-hidden="true" /> {busy ? "Finding…" : "Find related notes"}</button>{suggestions.map((suggestion) => <div className="studio-social-item" key={suggestion.slug}><span><strong>{suggestion.title}</strong><small>{suggestion.reason}</small></span><span className="studio-row-actions"><button className="studio-button studio-button-primary" type="button" onClick={() => insert(suggestion)}>Insert</button><a className="studio-icon-button" href={suggestion.url} target="_blank" rel="noreferrer" aria-label={`Open ${suggestion.title}`}><ExternalLink aria-hidden="true" /></a><button className="studio-button studio-button-quiet" type="button" onClick={() => setSuggestions((current) => current.filter((item) => item.slug !== suggestion.slug))}>Ignore</button></span></div>)}</section>;
}
