"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Archive, Bold, Check, Code2, Eye, FileText, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Maximize2, Minus, PanelRight, Quote, Redo2, Save, Send, Sparkles, Strikethrough, Table2, Undo2, Upload, Video } from "lucide-react";
import type { ArticleFrontmatter, ArticleStatus } from "@/lib/studio/schema";
import type { ManagedArticle } from "@/lib/studio/content";
import type { SeoSuggestions } from "@/lib/studio/ai";
import { applySeoSuggestion, editableSeoKeys, type EditableSeoKey } from "@/lib/studio/seo-apply";
import { calculateReadingTime, countCharacters, countWords } from "@/lib/studio/markdown";
import DiscoveryFields from "./discovery-fields";
import { clientQualityChecks } from "./quality-checks";
import { deploymentMessage, formatDateTime, studioFetch, type DeploymentRequest } from "./studio-api";

type SaveAction = "save" | "publish" | "schedule" | "unpublish" | "archive";
type Repurposing = {
  linkedin: string;
  xThread: string[];
  instagram: string;
  youtubeDescription: string;
  youtubeOutline: string[];
  shortFormHooks: string[];
  newsletter: string;
  githubAnnouncement: string;
};

type EditorProps = { article?: ManagedArticle };

function initialFrontmatter(article?: ManagedArticle): ArticleFrontmatter {
  return article?.frontmatter || {
    title: "", slug: "", subtitle: null, excerpt: null, author: "Prashant Choudhary", status: "draft", publishedAt: null, updatedAt: null, scheduledAt: null, timezone: "Europe/Berlin", tags: [], topics: [], categories: [], featured: false, coverImage: null, coverImageAlt: null, coverVideo: null, readingTime: 1, tldr: null, tldrSource: "manual", metaTitle: null, metaDescription: null, canonical: null, ogTitle: null, ogDescription: null, ogImage: null, socialPreviewImage: null, seoKeywords: [], keywords: [], entities: [], faqs: [], youtube: [], instagram: [], facebook: [], twitter: [], linkedin: [], github: [], externalReferences: [], references: [], relatedPosts: [], socialEmbeds: [], series: null, discussionUrl: null, archivedAt: null, archivePublic: false, published: false,
  };
}

function listValue(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

function displayValue(value?: string | null): string {
  return value || "";
}

function statusValue(value: string): ArticleStatus {
  return ["local-draft", "draft", "scheduled", "published", "archived"].includes(value) ? value as ArticleStatus : "draft";
}

export default function PostEditor({ article }: EditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [frontmatter, setFrontmatter] = useState<ArticleFrontmatter>(() => initialFrontmatter(article));
  const [body, setBody] = useState(article?.body || "");
  const [sha, setSha] = useState(article?.sha);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [localSavedAt, setLocalSavedAt] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(article?.frontmatter.updatedAt || null);
  const [recovery, setRecovery] = useState<{ body: string; frontmatter: ArticleFrontmatter; savedAt: string } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<SaveAction | "ai" | "revisions" | null>(null);
  const [seoSuggestions, setSeoSuggestions] = useState<SeoSuggestions | null>(null);
  const [repurposing, setRepurposing] = useState<Repurposing | null>(null);
  const [revisions, setRevisions] = useState<{ sha: string; message: string; date: string; author: string }[]>([]);
  const [revisionContent, setRevisionContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [qualityOpen, setQualityOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"write" | "details">("write");
  const [importing, setImporting] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const storageKey = `prashant-studio-local:${article?.slug || "new"}`;
  const quality = useMemo(() => clientQualityChecks(frontmatter, body), [frontmatter, body]);
  const words = useMemo(() => countWords(body), [body]);
  const characters = useMemo(() => countCharacters(body), [body]);
  const readingTime = useMemo(() => calculateReadingTime(body), [body]);

  const setField = useCallback(<K extends keyof ArticleFrontmatter>(key: K, value: ArticleFrontmatter[K]) => {
    setFrontmatter((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }, []);

  const setBodyValue = (value: string) => {
    setBody(value);
    setDirty(true);
  };

  const insert = (before: string, after = "", placeholder = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    setBodyValue(`${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const addTag = (value: string, key: "tags" | "topics" | "entities") => {
    const clean = value.trim().toLowerCase();
    if (!clean) return;
    const current = frontmatter[key];
    setField(key, [...new Set([...current, clean])]);
  };

  const removeTag = (key: "tags" | "topics" | "entities", value: string) => {
    setField(key, frontmatter[key].filter((item) => item !== value));
  };

  const addEmbed = async () => {
    const url = window.prompt("Paste a YouTube, Instagram, Facebook, X, LinkedIn, or GitHub URL");
    if (!url) return;
    try {
      const result = await studioFetch<{ message?: string }>("/api/studio/social/metadata", { method: "POST", body: JSON.stringify({ url: url.trim() }) });
      if (result.message) setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Provider metadata is unavailable; the link card will still work.");
    }
    insert(`:::embed ${url.trim()}\n`);
  };

  const addImage = () => {
    const url = window.prompt("Paste an image URL or /blog/... path");
    if (url) insert(`![Describe the image](${url.trim()})\n`);
  };

  const addCallout = () => insert("> **Note:** ", "", "Add a useful note");
  const addTable = () => insert("| Column | Value |\n| --- | --- |\n| ", " |  |", "Item");

  const saveLocal = useCallback((notify = false) => {
    const savedAt = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify({ body, frontmatter, savedAt }));
    setLocalSavedAt(savedAt);
    if (notify) setMessage("Saved locally in this browser.");
  }, [body, frontmatter, storageKey]);

  const loadRevisions = useCallback(async () => {
    if (!article) return;
    setBusy("revisions");
    try {
      const result = await studioFetch<{ revisions: typeof revisions }>(`/api/studio/revisions/${article.slug}`);
      setRevisions(result.revisions);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Revisions could not be loaded.");
    } finally {
      setBusy(null);
    }
  }, [article]);

  const save = async (action: SaveAction, override?: ArticleFrontmatter) => {
    setBusy(action);
    setMessage("");
    const current = override || frontmatter;
    const slug = current.slug || current.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setMessage("Add a valid lowercase slug before saving.");
      setBusy(null);
      return;
    }
    const nextFrontmatter: ArticleFrontmatter = {
      ...current,
      slug,
      readingTime,
      updatedAt: new Date().toISOString(),
      status: action === "publish" ? "published" : action === "schedule" ? "scheduled" : action === "unpublish" ? "draft" : action === "archive" ? "archived" : current.status,
    };
    if (action === "publish") {
      nextFrontmatter.publishedAt = current.publishedAt || new Date().toISOString();
      nextFrontmatter.scheduledAt = null;
    }
    if (action === "schedule") {
      if (!current.scheduledAt || Date.parse(current.scheduledAt) <= Date.now()) {
        setMessage("Choose a future date and time before scheduling.");
        setBusy(null);
        return;
      }
      nextFrontmatter.publishedAt = null;
    }
    if (action === "unpublish") {
      nextFrontmatter.publishedAt = null;
      nextFrontmatter.scheduledAt = null;
    }
    try {
      const payload = { slug, frontmatter: nextFrontmatter, body, action, expectedSha: sha };
      const result = article
        ? await studioFetch<{ article: ManagedArticle; deployment: DeploymentRequest }>(`/api/studio/posts/${article.slug}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await studioFetch<{ article: ManagedArticle; deployment: DeploymentRequest }>("/api/studio/posts", { method: "POST", body: JSON.stringify(payload) });
      setSha(result.article.sha);
      setFrontmatter(result.article.frontmatter);
      setLastSavedAt(result.article.frontmatter.updatedAt || new Date().toISOString());
      setDirty(false);
      localStorage.removeItem(storageKey);
      setMessage((action === "publish" ? "Publication committed." : action === "schedule" ? "Schedule committed." : action === "unpublish" ? "Moved to draft in the content store." : action === "archive" ? "Archived in the content store." : "Saved to the content store.") + deploymentMessage(result.deployment));
      if (!article) router.replace(`/studio/posts/${result.article.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The article could not be saved.");
    } finally {
      setBusy(null);
    }
  };

  const renameArticle = async () => {
    if (!article) return;
    const nextSlug = window.prompt("New stable slug", frontmatter.slug);
    if (!nextSlug || nextSlug === article.slug) return;
    setBusy("save");
    try {
      const result = await studioFetch<{ article: ManagedArticle }>(`/api/studio/posts/${article.slug}`, { method: "PATCH", body: JSON.stringify({ slug: article.slug, newSlug: nextSlug, frontmatter: { ...frontmatter, slug: nextSlug }, body, action: "rename", expectedSha: sha }) });
      setFrontmatter(result.article.frontmatter);
      setSha(result.article.sha);
      setMessage("Article renamed with a new commit.");
      router.replace(`/studio/posts/${result.article.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The article could not be renamed.");
    } finally {
      setBusy(null);
    }
  };

  const generateTldr = async () => {
    setBusy("ai");
    setMessage("");
    try {
      const result = await studioFetch<{ tldr: string }>("/api/studio/ai/tldr", { method: "POST", body: JSON.stringify({ title: frontmatter.title, body, style: "concise" }) });
      setField("tldr", result.tldr);
      setField("tldrSource", "ai");
      setMessage("TL;DR generated. Review and edit it before saving.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "TL;DR generation is unavailable.");
    } finally {
      setBusy(null);
    }
  };

  const generateSeo = async () => {
    setBusy("ai");
    setMessage("");
    try {
      const result = await studioFetch<{ suggestions: SeoSuggestions }>("/api/studio/ai/seo", { method: "POST", body: JSON.stringify({ title: frontmatter.title, excerpt: frontmatter.excerpt || "", body, tags: frontmatter.tags }) });
      setSeoSuggestions(result.suggestions);
      setMessage("SEO suggestions are ready. Apply only what you want to keep.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI SEO is unavailable.");
    } finally {
      setBusy(null);
    }
  };

  const repurpose = async () => {
    setBusy("ai");
    setMessage("");
    try {
      const result = await studioFetch<{ drafts: Repurposing }>("/api/studio/ai/repurpose", { method: "POST", body: JSON.stringify({ title: frontmatter.title, excerpt: frontmatter.excerpt || "", body }) });
      setRepurposing(result.drafts);
      setMessage("Repurposing drafts are ready for review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Content repurposing is unavailable.");
    } finally {
      setBusy(null);
    }
  };

  const applySeo = async (key: EditableSeoKey) => {
    if (!seoSuggestions || busy) return;
    const next = applySeoSuggestion(frontmatter, seoSuggestions, key);
    if (next === frontmatter) return;
    setFrontmatter(next);
    setDirty(true);
    localStorage.setItem(storageKey, JSON.stringify({ body, frontmatter: next, savedAt: new Date().toISOString() }));
    if (article) await save("save", next);
    else setMessage("Suggestion applied and saved in this browser. Save the draft to the repository when ready.");
  };

  const importFile = async (file: File) => {
    if ((frontmatter.title || body) && !window.confirm("Replace the current editor contents with this document? Your local copy will be updated.")) return;
    setImporting(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await studioFetch<{ document: { frontmatter: ArticleFrontmatter; body: string }; warnings: string[] }>("/api/studio/import", { method: "POST", body: form });
      const next = { ...initialFrontmatter(), ...result.document.frontmatter };
      setFrontmatter(next);
      setBody(result.document.body);
      setSeoSuggestions(null);
      setImportWarnings(result.warnings);
      setDirty(true);
      const savedAt = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify({ body: result.document.body, frontmatter: next, savedAt }));
      setLocalSavedAt(savedAt);
      setMessage(`Imported ${file.name} into a local draft. Review the fields and save it to the repository when ready.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document import failed.");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw || dirty) return;
    try {
      const local = JSON.parse(raw) as { body: string; frontmatter: ArticleFrontmatter; savedAt: string };
      if (!article || Date.parse(local.savedAt) > Date.parse(article.frontmatter.updatedAt || "0")) setRecovery(local);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [article, storageKey, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => saveLocal(), 900);
    return () => window.clearTimeout(timer);
  }, [body, dirty, saveLocal]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (mode !== "preview") return;
    const controller = new AbortController();
    setPreviewLoading(true);
    fetch("/api/studio/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markdown: body, title: frontmatter.title || "Article preview" }), signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Preview unavailable.");
        setPreviewHtml(result.html || "");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setMessage(error instanceof Error ? error.message : "Preview unavailable.");
      })
      .finally(() => setPreviewLoading(false));
    return () => controller.abort();
  }, [mode, body, frontmatter.title]);

  useEffect(() => {
    if (article) void loadRevisions();
  }, [article, loadRevisions]);

  const previewUrl = article ? `/studio/preview/${article.slug}` : "/studio/posts";
  const qualityErrors = quality.filter((check) => check.level === "error").length;

  return (
    <div className={fullscreen ? "studio-fullscreen" : ""}>
      {!article ? <section className="studio-panel studio-import-panel"><div><h2>Import a document</h2><p>Upload Markdown, text, or a Word .docx exported from Google Docs. The title, slug, excerpt, tags, and article body fill in automatically. Import stays a draft.</p></div><label className="studio-button studio-button-secondary studio-import-button"><Upload aria-hidden="true" /> {importing ? "Importing…" : "Choose document"}<input type="file" accept=".md,.markdown,.txt,.docx" disabled={importing} onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ""; }} /></label>{importWarnings.length ? <ul className="studio-import-warnings">{importWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}</section> : null}
      <div className="studio-mobile-tabs" role="group" aria-label="Editor panels"><button className="studio-button" type="button" aria-pressed={mobilePanel === "write"} onClick={() => setMobilePanel("write")}>Write & save</button><button className="studio-button" type="button" aria-pressed={mobilePanel === "details"} onClick={() => setMobilePanel("details")}>Details & AI</button></div>
      <div className="studio-editor-layout" data-mobile-panel={mobilePanel}>
        <div className="studio-editor-main">
          <section className="studio-card studio-editor-card">
            <input className="studio-editor-title" value={frontmatter.title} onChange={(event) => setField("title", event.target.value)} placeholder="Article title" aria-label="Article title" />
            <textarea className="studio-editor-deck" value={displayValue(frontmatter.subtitle)} onChange={(event) => setField("subtitle", event.target.value || null)} placeholder="Add a clear deck" aria-label="Article subtitle" />
            <div className="studio-toolbar" role="toolbar" aria-label="Markdown formatting">
              <button className="studio-tool" type="button" onClick={() => insert("## ", "", "Heading")} aria-label="Heading"><Heading2 aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("**", "**", "bold text")} aria-label="Bold"><Bold aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("*", "*", "italic text")} aria-label="Italic"><Italic aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("~~", "~~", "strikethrough")} aria-label="Strikethrough"><Strikethrough aria-hidden="true" /></button>
              <span className="studio-tool-separator" />
              <button className="studio-tool" type="button" onClick={() => insert("[", "](https://)", "link text")} aria-label="Link"><Link2 aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("- ", "", "list item")} aria-label="Bullet list"><List aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("1. ", "", "list item")} aria-label="Numbered list"><ListOrdered aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("> ", "", "quote")} aria-label="Blockquote"><Quote aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("`", "`", "code")} aria-label="Inline code"><Code2 aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("```ts\n", "\n```", "code")} aria-label="Code block"><FileText aria-hidden="true" /></button>
              <span className="studio-tool-separator" />
              <button className="studio-tool" type="button" onClick={addTable} aria-label="Table"><Table2 aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => insert("\n---\n")} aria-label="Horizontal rule"><Minus aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={addImage} aria-label="Image"><ImagePlus aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => void addEmbed()} aria-label="Social or video embed"><Video aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={addCallout} aria-label="Callout"><Quote aria-hidden="true" /></button>
              <span className="studio-tool-separator" />
              <button className="studio-tool" type="button" onClick={() => document.execCommand("undo")} aria-label="Undo"><Undo2 aria-hidden="true" /></button>
              <button className="studio-tool" type="button" onClick={() => document.execCommand("redo")} aria-label="Redo"><Redo2 aria-hidden="true" /></button>
              <span className="studio-tool-separator" />
              <button className="studio-tool" type="button" aria-pressed={mode === "write"} onClick={() => setMode("write")}>Source</button>
              <button className="studio-tool" type="button" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}>Preview</button>
              <button className="studio-tool" type="button" onClick={() => setFullscreen((value) => !value)} aria-label={fullscreen ? "Exit fullscreen writing" : "Fullscreen writing"}><Maximize2 aria-hidden="true" /></button>
            </div>
            {mode === "write" ? <textarea ref={textareaRef} className="studio-markdown" value={body} onChange={(event) => setBodyValue(event.target.value)} placeholder="Write in safe Markdown…" spellCheck="true" /> : <div className="studio-editor-preview" aria-live="polite">{previewLoading ? <div className="studio-loading">Rendering public-safe preview</div> : <div dangerouslySetInnerHTML={{ __html: previewHtml }} />}</div>}
            <footer className="studio-editor-status"><div className="studio-counts"><span><strong>{words}</strong> words</span><span><strong>{characters}</strong> characters</span><span><strong>{readingTime}</strong> min read</span></div><span>{dirty ? <strong>Unsaved changes</strong> : lastSavedAt ? `Saved ${formatDateTime(lastSavedAt)}` : "Ready to write"}{localSavedAt ? ` · local ${formatDateTime(localSavedAt)}` : ""}</span></footer>
          </section>
          <div className="studio-actions" style={{ marginTop: ".8rem" }}>
            <button className="studio-button studio-button-secondary" type="button" onClick={() => saveLocal(true)}><Save aria-hidden="true" /> Save locally</button>
            {article ? <button className="studio-button studio-button-quiet" type="button" disabled={Boolean(busy)} onClick={() => void renameArticle()}>Rename slug</button> : null}
            <button className="studio-button studio-button-secondary" type="button" disabled={Boolean(busy)} onClick={() => void save("save")}><Upload aria-hidden="true" /> {busy === "save" ? "Saving…" : "Save draft to repository"}</button>
            <button className="studio-button studio-button-ai" type="button" disabled={Boolean(busy)} onClick={() => void save("schedule")}><Send aria-hidden="true" /> Schedule</button>
            <button className="studio-button studio-button-primary" type="button" disabled={Boolean(busy)} onClick={() => void save("publish")}><Check aria-hidden="true" /> {busy === "publish" ? "Publishing…" : "Publish"}</button>
            {article && frontmatter.status === "published" ? <button className="studio-button studio-button-secondary" type="button" disabled={Boolean(busy)} onClick={() => void save("unpublish")}><Archive aria-hidden="true" /> Unpublish</button> : null}
            {article && frontmatter.status !== "archived" ? <button className="studio-button studio-button-quiet" type="button" disabled={Boolean(busy)} onClick={() => void save("archive")}><Archive aria-hidden="true" /> Archive</button> : null}
            {article ? <><a className="studio-button studio-button-quiet" href={previewUrl} target="_blank" rel="noreferrer"><Eye aria-hidden="true" /> Desktop preview</a><a className="studio-button studio-button-quiet" href={`${previewUrl}?viewport=mobile`} target="_blank" rel="noreferrer"><Eye aria-hidden="true" /> Mobile preview</a></> : null}
          </div>
          {recovery ? <div className="studio-alert studio-alert-warning" style={{ marginTop: ".8rem" }}><AlertCircle aria-hidden="true" /><span>Local recovery found from {formatDateTime(recovery.savedAt)}. <button className="studio-button studio-button-quiet" type="button" onClick={() => { setFrontmatter(recovery.frontmatter); setBody(recovery.body); setRecovery(null); setDirty(true); }}>Restore</button><button className="studio-button studio-button-quiet" type="button" onClick={() => { localStorage.removeItem(storageKey); setRecovery(null); }}>Discard</button></span></div> : null}
          {message ? <div className="studio-alert" style={{ marginTop: ".8rem" }} role="status">{message}</div> : null}
        </div>
        <aside className="studio-inspector">
          <section className="studio-panel">
            <div className="studio-panel-header"><h3>Publication</h3><span className={`studio-badge studio-badge-${frontmatter.status}`}>{frontmatter.status}</span></div>
            <label className="studio-field"><span>Status</span><select className="studio-select" value={frontmatter.status} onChange={(event) => setField("status", statusValue(event.target.value))}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
            <div className="studio-form-grid"><label className="studio-field"><span>Publication date</span><input className="studio-input" type="datetime-local" value={frontmatter.publishedAt ? new Date(frontmatter.publishedAt).toISOString().slice(0, 16) : ""} onChange={(event) => setField("publishedAt", event.target.value ? new Date(event.target.value).toISOString() : null)} /></label><label className="studio-field"><span>Schedule</span><input className="studio-input" type="datetime-local" value={frontmatter.scheduledAt ? new Date(frontmatter.scheduledAt).toISOString().slice(0, 16) : ""} onChange={(event) => setField("scheduledAt", event.target.value ? new Date(event.target.value).toISOString() : null)} /></label></div>
            <label className="studio-field"><span>Slug</span><input className="studio-input" value={frontmatter.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="stable-url-slug" /></label>
            <label className="studio-field"><span>Timezone</span><input className="studio-input" value={frontmatter.timezone} onChange={(event) => setField("timezone", event.target.value)} /><small className="studio-help">Studio stores the selected timestamp as ISO. Use an IANA timezone.</small></label>
            <label className="studio-checkbox"><input type="checkbox" checked={frontmatter.featured} onChange={(event) => setField("featured", event.target.checked)} /> Featured post</label>
            <label className="studio-checkbox"><input type="checkbox" checked={frontmatter.archivePublic} onChange={(event) => setField("archivePublic", event.target.checked)} /> Keep archived URL accessible</label>
          </section>
          <section className="studio-panel">
            <div className="studio-panel-header"><h3>Story metadata</h3><PanelRight aria-hidden="true" /></div>
            <label className="studio-field"><span>Excerpt</span><textarea className="studio-textarea" value={displayValue(frontmatter.excerpt)} onChange={(event) => setField("excerpt", event.target.value)} /></label>
            <label className="studio-field"><span>Author</span><input className="studio-input" value={frontmatter.author} onChange={(event) => setField("author", event.target.value)} /></label>
            <label className="studio-field"><span>TL;DR</span><textarea className="studio-textarea" value={displayValue(frontmatter.tldr)} onChange={(event) => setField("tldr", event.target.value)} placeholder="Add or edit a concise summary" /></label>
            <button className="studio-button studio-button-ai" type="button" disabled={busy === "ai"} onClick={() => void generateTldr()}><Sparkles aria-hidden="true" /> {busy === "ai" ? "Thinking…" : "Generate TL;DR"}</button>
            <label className="studio-field"><span>Tags</span><div className="studio-tag-list">{frontmatter.tags.map((tag) => <button className="studio-badge" type="button" key={tag} onClick={() => removeTag("tags", tag)}>#{tag} ×</button>)}</div><input className="studio-input" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(tagInput, "tags"); setTagInput(""); } }} placeholder="Add a tag and press Enter" /></label>
            <label className="studio-field"><span>Topics</span><div className="studio-tag-list">{frontmatter.topics.map((topic) => <button className="studio-badge" type="button" key={topic} onClick={() => removeTag("topics", topic)}>{topic} ×</button>)}</div><input className="studio-input" value={topicInput} onChange={(event) => setTopicInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(topicInput, "topics"); setTopicInput(""); } }} placeholder="Add a topic" /></label>
            <label className="studio-field"><span>Series</span><input className="studio-input" value={frontmatter.series?.name || ""} onChange={(event) => setField("series", event.target.value ? { name: event.target.value, order: frontmatter.series?.order || 1 } : null)} placeholder="Optional series name" /></label>
          </section>
          <section className="studio-panel">
            <div className="studio-panel-header"><h3>Media and SEO</h3><ImagePlus aria-hidden="true" /></div>
            <label className="studio-field"><span>Cover image URL</span><input className="studio-input" value={displayValue(frontmatter.coverImage)} onChange={(event) => setField("coverImage", event.target.value)} placeholder="/blog/slug/cover.webp" /></label>
            <label className="studio-field"><span>Cover image alt</span><input className="studio-input" value={displayValue(frontmatter.coverImageAlt)} onChange={(event) => setField("coverImageAlt", event.target.value)} placeholder="Describe the image" /></label>
            <label className="studio-field"><span>Hero video URL</span><input className="studio-input" value={displayValue(frontmatter.coverVideo)} onChange={(event) => setField("coverVideo", event.target.value)} placeholder="YouTube or another safe video URL" /></label>
            <label className="studio-field"><span>Upload cover</span><input className="studio-input" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const form = new FormData(); form.set("file", file); form.set("slug", frontmatter.slug || "misc"); try { const result = await studioFetch<{ assets: { url: string }[] }>("/api/studio/media", { method: "POST", body: form }); if (result.assets[0]) setField("coverImage", result.assets[0].url); } catch (error) { setMessage(error instanceof Error ? error.message : "Image upload failed."); } }} /></label>
            <label className="studio-field"><span>Meta title</span><input className="studio-input" value={displayValue(frontmatter.metaTitle)} onChange={(event) => setField("metaTitle", event.target.value)} /></label>
            <label className="studio-field"><span>Meta description</span><textarea className="studio-textarea" value={displayValue(frontmatter.metaDescription)} onChange={(event) => setField("metaDescription", event.target.value)} /></label>
            <label className="studio-field"><span>Canonical URL</span><input className="studio-input" value={displayValue(frontmatter.canonical)} onChange={(event) => setField("canonical", event.target.value)} placeholder="Leave blank for the stable Field Notes URL" /></label>
            <button className="studio-button studio-button-ai" type="button" disabled={busy === "ai"} onClick={() => void generateSeo()}><Sparkles aria-hidden="true" /> AI SEO optimize</button>
          </section>
          <DiscoveryFields frontmatter={frontmatter} onUpdate={(patch) => { setFrontmatter((current) => ({ ...current, ...patch })); setDirty(true); }} />
          <section className="studio-panel">
            <button className="studio-panel-header" type="button" onClick={() => setQualityOpen((value) => !value)}><h3>Publication checklist</h3><span>{qualityErrors ? `${qualityErrors} to fix` : "Ready"}</span></button>
            {qualityOpen ? <ul className="studio-check-list">{quality.map((check, index) => <li className={`studio-check studio-check-${check.level}`} key={`${check.message}-${index}`}><span aria-hidden="true">{check.level === "ok" ? "✓" : check.level === "error" ? "!" : "·"}</span><span>{check.message}</span></li>)}</ul> : null}
          </section>
          <section className="studio-panel">
            <div className="studio-panel-header"><h3>SEO suggestions</h3><Sparkles aria-hidden="true" /></div>
            {seoSuggestions && message ? <div className="studio-alert" role="status">{message}</div> : null}
            {seoSuggestions ? <div className="studio-form">{Object.entries(seoSuggestions).map(([key, value]) => { const editable = editableSeoKeys.includes(key as EditableSeoKey) && !(article && key === "slug"); return <div className="studio-field" key={key}><div className="studio-seo-preview"><strong>{key.replace(/([A-Z])/g, " $1")}</strong><p>{typeof value === "string" ? value : JSON.stringify(value)}</p>{editable ? <button className="studio-button studio-button-quiet" type="button" disabled={Boolean(busy)} onClick={() => void applySeo(key as EditableSeoKey)}>{article ? "Apply & save" : "Apply locally"}</button> : <small>{key === "slug" && article ? "Use Rename slug for an existing post." : "Review suggestion; no direct field to apply."}</small>}</div></div>; })}</div> : <><div className="studio-seo-preview"><strong>{frontmatter.metaTitle || frontmatter.title || "Your meta title"}</strong><span>/en/blog/posts/{frontmatter.slug || "your-slug"}</span><p>{frontmatter.metaDescription || frontmatter.excerpt || "Add a meta description to make the search preview useful."}</p></div><p>Run AI SEO optimize for editable suggestions. Nothing is applied automatically.</p></>}
          </section>
          <section className="studio-panel">
            <div className="studio-panel-header"><h3>Repurpose content</h3><Sparkles aria-hidden="true" /></div><p>Generate reviewable drafts for social, video, newsletter, and GitHub. Nothing posts automatically.</p><button className="studio-button studio-button-secondary" type="button" disabled={busy === "ai"} onClick={() => void repurpose()}><Sparkles aria-hidden="true" /> Create drafts</button>
            {repurposing ? <div className="studio-form">{Object.entries(repurposing).map(([key, value]) => <details key={key}><summary>{key}</summary><pre className="studio-markdown" style={{ minHeight: "5rem" }}>{Array.isArray(value) ? value.join("\n\n") : value}</pre></details>)}</div> : null}
          </section>
          {article ? <section className="studio-panel"><div className="studio-panel-header"><h3>Revision history</h3><button className="studio-icon-button" type="button" aria-label="Refresh revisions" onClick={() => void loadRevisions()}><Undo2 aria-hidden="true" /></button></div>{!revisions.length ? <p>GitHub revisions appear here when content storage is connected.</p> : <div className="studio-form">{revisions.map((revision) => <div className="studio-social-item" key={revision.sha}><span><strong>{revision.message}</strong><small>{revision.author} · {formatDateTime(revision.date)}</small></span><span className="studio-row-actions"><button className="studio-button studio-button-quiet" type="button" onClick={() => void studioFetch(`/api/studio/revisions/${article.slug}?sha=${revision.sha}`).then((result) => setRevisionContent((result as { content: string }).content))}>Inspect</button><button className="studio-button studio-button-quiet" type="button" onClick={() => { if (window.confirm("Restore this revision as a new commit?")) void studioFetch(`/api/studio/revisions/${article.slug}`, { method: "POST", body: JSON.stringify({ sha: revision.sha }) }).then(() => setMessage("Revision restored as a new commit.")); }}>Restore</button></span></div>)}{revisionContent ? <pre className="studio-markdown" style={{ minHeight: "10rem" }}>{revisionContent}</pre> : null}</div>}</section> : null}
        </aside>
      </div>
    </div>
  );
}
