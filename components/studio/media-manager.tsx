"use client";

import { useRef, useState } from "react";
import { Copy, FileImage, RefreshCw, Replace, Trash2, UploadCloud } from "lucide-react";
import type { MediaAsset } from "@/lib/studio/media";
import { formatBytes, formatDateTime, studioFetch } from "./studio-api";

type DisplayAsset = MediaAsset & { usedBy?: string[] };

export default function MediaManager({ initialAssets }: { initialAssets: DisplayAsset[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [replaceTarget, setReplaceTarget] = useState<DisplayAsset | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = async () => { try { const result = await studioFetch<DisplayAsset[]>("/api/studio/media"); setAssets(result); } catch (error) { setMessage(error instanceof Error ? error.message : "Media could not be refreshed."); } };
  const upload = async (file: File, target?: DisplayAsset) => {
    setBusy(true); setMessage("");
    const form = new FormData(); form.set("file", file); form.set("slug", target?.path.split("/")[2] || "library");
    try {
      const result = await studioFetch<{ assets: MediaAsset[] }>("/api/studio/media", { method: "POST", body: form });
      if (target) {
        await studioFetch("/api/studio/media", { method: "DELETE", body: JSON.stringify({ path: target.path, url: target.url, storage: target.storage }) });
        setAssets((current) => [...result.assets, ...current.filter((item) => item.path !== target.path)]);
        setMessage("Asset replaced.");
      } else {
        setAssets((current) => [...result.assets, ...current]);
        setMessage(`${result.assets.length} optimized asset${result.assets.length === 1 ? "" : "s"} added.`);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); setReplaceTarget(null); }
  };
  const remove = async (asset: MediaAsset) => { if (!window.confirm(`Delete ${asset.filename}?`)) return; setBusy(true); try { await studioFetch("/api/studio/media", { method: "DELETE", body: JSON.stringify({ path: asset.path, url: asset.url, storage: asset.storage }) }); setAssets((current) => current.filter((item) => item.path !== asset.path)); setMessage("Asset deleted."); } catch (error) { setMessage(error instanceof Error ? error.message : "Delete failed."); } finally { setBusy(false); } };
  const copy = async (url: string) => { await navigator.clipboard.writeText(url); setMessage("Public URL copied."); };
  return <><section className="studio-card"><div className={`studio-dropzone${dragging ? " studio-dropzone-dragging" : ""}`} role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void upload(file); }}><UploadCloud aria-hidden="true" /><strong>{busy ? "Processing image…" : "Drop an image here or choose a file"}</strong><span>JPEG, PNG, WebP, AVIF, or GIF · up to 10 MB · WebP and AVIF variants are generated when appropriate</span><input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} /></div><input ref={replaceRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file && replaceTarget) void upload(file, replaceTarget); event.target.value = ""; }} />{message ? <div className="studio-alert" style={{ margin: "0 1rem 1rem" }} role="status">{message}</div> : null}<div className="studio-card-header"><div><h2>Library</h2><p>{assets.length} asset{assets.length === 1 ? "" : "s"} · used-by links are calculated from current articles</p></div><button className="studio-icon-button" type="button" aria-label="Refresh media library" onClick={() => void refresh()}><RefreshCw aria-hidden="true" /></button></div>{assets.length ? <div className="studio-media-grid">{assets.map((asset) => <article className="studio-media-card" key={asset.path}><img className="studio-media-thumb" src={asset.url} alt="" loading="lazy" /><div className="studio-media-info"><strong className="studio-media-name" title={asset.filename}>{asset.filename}</strong><span className="studio-media-meta">{asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}{formatBytes(asset.size)} · {formatDateTime(asset.uploadedAt)}</span><span className="studio-media-meta">Used by: {asset.usedBy?.join(", ") || "No article yet"}</span><div className="studio-media-actions"><button className="studio-button studio-button-quiet" type="button" onClick={() => void copy(asset.url)}><Copy aria-hidden="true" /> Copy URL</button><button className="studio-button studio-button-quiet" type="button" disabled={busy} onClick={() => { setReplaceTarget(asset); replaceRef.current?.click(); }}><Replace aria-hidden="true" /> Replace</button><button className="studio-button studio-button-quiet" type="button" disabled={busy} onClick={() => void remove(asset)}><Trash2 aria-hidden="true" /> Delete</button></div></div></article>)}</div> : <div className="studio-empty"><FileImage aria-hidden="true" /><strong>Your library is empty</strong><p>Upload a cover image or paste a remote URL into the editor.</p></div>}</section></>;
}
