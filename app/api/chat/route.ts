import { createGroq } from "@ai-sdk/groq";
import { stepCountIs, streamText } from "ai";
import { createPortfolioTools } from "@/lib/ai/ai-sdk-tools";
import { langChainPortfolioTools } from "@/lib/ai/langchain-tools";
import { createSystemPrompt } from "@/lib/ai/system-prompt";

export const runtime = "nodejs";

const localizedErrors: Record<string, string> = {
  en: "The AI assistant is temporarily unavailable. Please try again soon.",
  de: "Der KI-Assistent ist vorübergehend nicht verfügbar. Bitte versuche es bald erneut.",
  "de-CH": "Der KI-Assistent ist vorübergehend nicht verfügbar. Bitte versuech es später no einisch.",
  "lb-LU": "Den KI-Assistent ass temporär net verfügbar. Probéier et w.e.g. geschwënn nach eng Kéier.",
  es: "El asistente de IA no está disponible temporalmente. Inténtalo de nuevo pronto.",
  "hi-IN": "AI सहायक अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।",
};

function getMessageText(message: any): string {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");
  }
  return "";
}

function normalizeMessages(messages: any[] = []) {
  return messages
    .filter((message) => ["user", "assistant", "system"].includes(message.role))
    .map((message) => ({
      role: message.role as "user" | "assistant" | "system",
      content: getMessageText(message).slice(0, 8000),
    }))
    .filter((message) => message.content.length > 0);
}

export async function POST(req: Request) {
  let locale = "en";

  try {
    const body = await req.json();
    const { messages, model = "openai/gpt-oss-120b" } = body;
    locale = body.locale || req.headers.get("accept-language")?.split(",")[0]?.trim() || "en";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: localizedErrors[locale] || localizedErrors.en, code: "GROQ_API_KEY_MISSING" },
        { status: 503 },
      );
    }

    const groq = createGroq({ apiKey });
    const langChainToolNames = langChainPortfolioTools.map((tool) => tool.name).join(", ");

    const result = streamText({
      model: groq(model),
      system: `${createSystemPrompt(locale)}

Tool orchestration is registered through LangChain.js-compatible tools and exposed to this streaming route. Available LangChain tool names: ${langChainToolNames}.`,
      messages: normalizeMessages(messages),
      tools: createPortfolioTools(),
      stopWhen: stepCountIs(4),
      temperature: 0.35,
      maxRetries: 2,
      onError: ({ error }) => {
        console.error("[Chat stream error]", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Chat API error]", error);
    return Response.json(
      { error: localizedErrors[locale] || localizedErrors.en, code: "CHAT_FAILED" },
      { status: 500 },
    );
  }
}
