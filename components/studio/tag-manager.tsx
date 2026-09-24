"use client";

import { useState } from "react";
import { Merge, Pencil, Tag } from "lucide-react";
import { studioFetch } from "./studio-api";

export default function TagManager({ tags }: { tags: string[] }) {
  const [message, setMessage] = useState("");
  const operate = async (mode: "rename" | "merge") => {
    const from = window.prompt(`Current ${mode === "rename" ? "tag" : "tag"} to change`);
    if (!from) return;
    const to = window.prompt(`New ${mode === "rename" ? "name" : "tag to merge into"}`);
    if (!to) return;
    try { const result = await studioFetch<{ updated: number }>("/api/studio/seo/tags", { method: "POST", body: JSON.stringify({ from, to }) }); setMessage(`${result.updated} article${result.updated === 1 ? "" : "s"} updated.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Tag operation failed."); }
  };
  return <section className="studio-card" style={{ marginTop: "1rem" }}><div className="studio-card-header"><div><h2>Tag management</h2><p>Every change creates a normal content commit. Names are normalized to lowercase.</p></div><Tag aria-hidden="true" /></div><div className="studio-quick-actions" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>{tags.map((tag) => <div className="studio-quick-action" key={tag}><Tag aria-hidden="true" /><span>#{tag}<small className="studio-media-meta">Rename or merge</small></span></div>)}<button className="studio-quick-action" type="button" onClick={() => void operate("rename")}><Pencil aria-hidden="true" /><span>Rename a tag</span></button><button className="studio-quick-action" type="button" onClick={() => void operate("merge")}><Merge aria-hidden="true" /><span>Merge tags</span></button></div>{message ? <div className="studio-alert" style={{ margin: "0 1rem 1rem" }} role="status">{message}</div> : null}</section>;
}
