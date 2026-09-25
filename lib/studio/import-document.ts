import matter from "gray-matter";
import mammoth from "mammoth";
import TurndownService from "turndown";
import { articleDocumentSchema, type ArticleDocument } from "./schema";

const allowedExtensions = new Set(["md", "markdown", "txt", "docx"]);

function words(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(items.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
}

function string(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}

export async function importDocument(filename: string, buffer: Buffer): Promise<{ document: ArticleDocument; warnings: string[] }> {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  if (!allowedExtensions.has(extension)) throw new Error("Choose a Markdown, text, or Word (.docx) file.");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("The document must be under 5 MB.");
  const warnings: string[] = [];
  let source: string;
  if (extension === "docx") {
    const converted = await mammoth.convertToHtml({ buffer }, { externalFileAccess: false, convertImage: mammoth.images.imgElement(async () => ({ src: "" })) });
    if (/<img\b/i.test(converted.value)) warnings.push("Embedded images were left out. Upload images separately and add them in the editor.");
    const html = converted.value.replace(/<img\b[^>]*>/gi, "");
    const converter = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
    source = converter.turndown(html);
    if (converted.messages.length) warnings.push("Check formatting after conversion from Word.");
  } else {
    source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  }
  const parsed = matter(source);
  let body = parsed.content.trim();
  const data = parsed.data as Record<string, unknown>;
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = string(data.title) || heading || filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  const slug = slugify(string(data.slug) || title);
  if (!slug) throw new Error("The document needs a title or a valid slug.");
  if (heading && heading === title) body = body.replace(/^#\s+.+\r?\n+/, "").trim();
  if (!body) throw new Error("The document has no article body.");
  const firstParagraph = body.split(/\n\s*\n/).find((part) => part.trim() && !/^\s*(#|>|-|\d+\.|\|)/.test(part)) || "";
  const excerpt = (string(data.excerpt) || string(data.description) || firstParagraph.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "")).slice(0, 500);
  const frontmatter = {
    title, slug, excerpt, author: string(data.author) || "Prashant Choudhary",
    date: string(data.date) || null, tags: words(data.tags), topics: words(data.topics),
    categories: words(data.categories), entities: words(data.entities),
    metaTitle: string(data.metaTitle) || null, metaDescription: string(data.metaDescription) || null,
    status: "draft", publishedAt: null, scheduledAt: null, timezone: "Europe/Berlin",
    published: false,
  };
  if (data.status || data.publishedAt || data.published) warnings.push("Imported as a draft. Review it before saving or publishing.");
  const result = articleDocumentSchema.safeParse({ frontmatter, body });
  if (!result.success) throw new Error(`Document needs review: ${result.error.issues[0]?.message || "invalid metadata"}`);
  return { document: result.data, warnings };
}
