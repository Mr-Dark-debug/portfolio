import "server-only";
import { z } from "zod";

const seoSuggestionSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  topic: z.string().optional(),
  tags: z.array(z.string()).optional(),
  entities: z.array(z.string()).optional(),
  headings: z.array(z.string()).optional(),
  internalLinks: z.array(z.string()).optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  tldr: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  socialCaption: z.string().optional(),
  searchIntent: z.string().optional(),
  primaryTopic: z.string().optional(),
  secondaryTopics: z.array(z.string()).optional(),
  contentGaps: z.array(z.string()).optional(),
});

export type SeoSuggestions = z.infer<typeof seoSuggestionSchema>;

const repurposingSchema = z.object({
  linkedin: z.string(),
  xThread: z.array(z.string()),
  instagram: z.string(),
  youtubeDescription: z.string(),
  youtubeOutline: z.array(z.string()),
  shortFormHooks: z.array(z.string()),
  newsletter: z.string(),
  githubAnnouncement: z.string(),
});

export type RepurposingDrafts = z.infer<typeof repurposingSchema>;

function providerConfig() {
  const provider = (process.env.AI_PROVIDER || (process.env.GROQ_API_KEY ? "groq" : "")).toLowerCase();
  const apiKey = process.env.AI_API_KEY || (provider === "groq" ? process.env.GROQ_API_KEY : undefined);
  const model = process.env.AI_MODEL || process.env.GROQ_MODEL || (provider === "openai" ? "gpt-4o-mini" : provider === "anthropic" ? "claude-3-5-haiku-latest" : provider === "gemini" ? "gemini-1.5-flash" : "openai/gpt-oss-120b");
  return apiKey ? { provider, apiKey, model } : null;
}

export function aiAvailability() {
  const config = providerConfig();
  return config ? { available: true as const, provider: config.provider, model: config.model } : { available: false as const, message: "AI API not configured" };
}

async function complete(prompt: string): Promise<string> {
  const config = providerConfig();
  if (!config) throw new Error("AI API not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    if (config.provider === "anthropic") {
      const response = await fetch(process.env.AI_API_URL || "https://api.anthropic.com/v1/messages", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", "x-api-key": config.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: config.model, max_tokens: 1400, messages: [{ role: "user", content: prompt }] }) });
      if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
      const body = (await response.json()) as { content?: { type: string; text?: string }[] };
      return body.content?.filter((item) => item.type === "text").map((item) => item.text || "").join("\n") || "";
    }
    if (config.provider === "gemini") {
      const response = await fetch(process.env.AI_API_URL || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1400 } }) });
      if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
      const body = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      return body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
    }
    const baseUrl = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
    const response = await fetch(baseUrl, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify({ model: config.model, temperature: 0.3, max_tokens: 1400, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return only valid JSON. Never invent facts that are not supported by the supplied article." }, { role: "user", content: prompt }] }) });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return body.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateTldr(title: string, body: string, style = "concise"): Promise<string> {
  const result = await complete(`Write a ${style} TL;DR for the article below. Return 2–4 sentences, preserve uncertainty, and do not add facts. Use plain text only.\n\nTitle: ${title}\n\nArticle:\n${body.slice(0, 40000)}`);
  return result.trim().slice(0, 1200);
}

export async function generateSeoSuggestions(title: string, excerpt: string, body: string, existingTags: string[] = []): Promise<SeoSuggestions> {
  const prompt = `Analyze this article for classic SEO and answer-engine discovery. Return JSON with these optional keys: metaTitle, metaDescription, excerpt, slug, topic, tags, entities, headings, internalLinks, faq, tldr, ogTitle, ogDescription, socialCaption, searchIntent, primaryTopic, secondaryTopics, contentGaps. Suggestions only; do not rewrite the article. Keep claims grounded in the supplied text. Existing tags: ${existingTags.join(", ")}.\n\nTitle: ${title}\nExcerpt: ${excerpt}\n\nArticle:\n${body.slice(0, 50000)}`;
  const result = await complete(prompt);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned an invalid suggestion format");
  const parsed = seoSuggestionSchema.safeParse(JSON.parse(jsonMatch[0]));
  if (!parsed.success) throw new Error("AI returned incomplete SEO suggestions");
  return parsed.data;
}

export async function generateRepurposingDrafts(title: string, excerpt: string, body: string): Promise<RepurposingDrafts> {
  const prompt = `Turn the article below into editable drafts, never publish automatically. Return JSON with linkedin, xThread (array of posts), instagram, youtubeDescription, youtubeOutline (array), shortFormHooks (array), newsletter, and githubAnnouncement. Keep the author's voice and factual claims. Do not invent metrics.\n\nTitle: ${title}\nExcerpt: ${excerpt}\n\nArticle:\n${body.slice(0, 50000)}`;
  const result = await complete(prompt);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned an invalid repurposing format");
  const parsed = repurposingSchema.safeParse(JSON.parse(jsonMatch[0]));
  if (!parsed.success) throw new Error("AI returned incomplete repurposing drafts");
  return parsed.data;
}
