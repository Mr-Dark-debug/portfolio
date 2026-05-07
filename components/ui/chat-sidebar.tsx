"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { X, Sparkles, Send, Link2, Keyboard, Brain, ChevronDown, ChevronUp, Copy, RotateCcw, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale, useTranslations } from "next-intl";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  { key: "projects", icon: "🚀" },
  { key: "stack", icon: "💻" },
  { key: "experience", icon: "🤖" },
  { key: "availability", icon: "📅" },
  { key: "education", icon: "🎓" },
  { key: "studio", icon: "🎨" },
];

const SparkleIcon = () => (
  <svg fill="none" height="40" viewBox="0 0 48 48" width="40" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <defs>
      <linearGradient id="sparkle-gradient" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#a855f7" stopOpacity="0.8" />
        <stop offset="1" stopColor="#7c3aed" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect fill="url(#sparkle-gradient)" height="48" rx="12" width="48" />
    <path
      clipRule="evenodd"
      d="m6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z"
      fill="white"
      fillOpacity="0.9"
      fillRule="evenodd"
    />
  </svg>
);

function getMessageText(message: any): string {
  if (typeof message.content === "string" && message.content.length > 0) return message.content;
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");
  }
  return "";
}

function hasReasoningParts(message: any): boolean {
  return Boolean(message.parts?.some((part: any) => part.type === "reasoning"));
}

function getReasoningText(message: any): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "reasoning")
      .map((part: any) => part.reasoning || part.text)
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

const ReasoningContent = ({ 
  reasoningText, 
  isLoading, 
  t 
}: { 
  reasoningText: string; 
  isLoading: boolean; 
  t: any 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(isLoading);

  // Auto-expand while reasoning is in progress
  React.useEffect(() => {
    if (isLoading) {
      setIsExpanded(true);
    }
  }, [isLoading]);

  return (
    <div className={cn("mb-2 border-b border-purple-200 pb-2 dark:border-purple-800", !isLoading && "opacity-80")}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 mb-1 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
      >
        <Brain className="h-3 w-3" />
        <span className="font-medium underline-offset-2 group-hover:underline">
          {isLoading ? t("reasoning") : t("reasoningDone")}
        </span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {isExpanded && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 italic whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200">
          {reasoningText}
        </div>
      )}
    </div>
  );
};

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const t = useTranslations("Chat");
  const locale = useLocale();
  const { messages, append, reload, status, error } = useChat({ id: "portfolio-chat" });
  const isLoading = status === "streaming" || status === "submitted";
  const [inputValue, setInputValue] = React.useState("");
  const [selectedModel, setSelectedModel] = React.useState("openai/gpt-oss-120b");
  const [isModelMenuOpen, setIsModelMenuOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Answer from Prashant's Portfolio",
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy(text, "share");
    }
  };

  const MessageActions = ({ message, text }: { message: any; text: string }) => {
    if (message.role !== "assistant" || !text) return null;

    return (
      <div className="mt-2 flex items-center gap-1 transition-opacity">
        <button
          onClick={() => handleCopy(text, message.id)}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
          title="Copy"
        >
          {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => handleShare(text)}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
          title="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => reload()}
          className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
          title="Retry"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const models = [
    { id: "qwen/qwen3-32b", name: "Qwen 3 32B" },
    { id: "openai/gpt-oss-120b", name: "GPT OSS 120B" },
  ];

  const currentModelName = models.find((model) => model.id === selectedModel)?.name || "GPT OSS 120B";

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [isOpen]);

  React.useEffect(() => {
    if (error && !error.message?.includes("Type validation failed")) {
      console.error("[Chat] Error:", error.message);
    }
  }, [error]);

  const handleSend = async (text = inputValue.trim()) => {
    if (!text || isLoading) return;
    setInputValue("");

    try {
      await append(
        { role: "user", content: text },
        { body: { model: selectedModel, locale } },
      );
    } catch (sendError) {
      console.error("Failed to send message:", sendError);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 150)}px`;
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />}

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-[100svh] w-full flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 sm:w-[420px]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <SparkleIcon />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("title")}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("poweredBy", { model: currentModelName })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:hover:bg-zinc-800"
            aria-label={t("close")}
          >
            <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-6 p-6 text-center">
              <SparkleIcon />
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-zinc-500 dark:text-zinc-400">{t("greeting")}</h3>
                <h4 className="text-lg font-medium text-zinc-900 dark:text-white">{t("emptyTitle")}</h4>
                <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{t("emptyDescription")}</p>
              </div>
              <div className="flex max-w-sm flex-wrap items-center justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => {
                  const label = t(`suggestions.${prompt.key}`);
                  return (
                    <button
                      key={prompt.key}
                      onClick={() => handleSend(label)}
                      disabled={isLoading}
                      className="min-h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-300"
                    >
                      <span className="mr-1" aria-hidden>{prompt.icon}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {messages.map((message: any) => {
                const messageText = getMessageText(message);
                const reasoningText = getReasoningText(message);
                const isThinking = message.role === "assistant" && !messageText && !reasoningText && !message.toolInvocations?.length && isLoading;
                const showReasoning = reasoningText.length > 0;

                return (
                  <div key={message.id} className={cn("flex gap-3 group", message.role === "user" ? "justify-end" : "justify-start")}>
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        {isThinking ? <Brain className="h-4 w-4 animate-pulse text-purple-600 dark:text-purple-400" /> : <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] overflow-hidden rounded-2xl px-4 py-3 text-sm",
                        message.role === "user"
                          ? "rounded-br-md bg-purple-600 text-white"
                          : "rounded-bl-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white",
                      )}
                    >
                      {isThinking && (
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <Brain className="h-4 w-4 animate-pulse" />
                          <span className="text-sm font-medium">{t("thinking")}</span>
                        </div>
                      )}

                      {/* Tool Invocations */}
                      {message.toolInvocations?.map((toolInvocation: any) => {
                        const { toolName, toolCallId, state } = toolInvocation;
                        if (state === 'call') {
                          return (
                            <div key={toolCallId} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                              <Link2 className="h-3 w-3 animate-pulse" />
                              <span>{t("usingTool", { tool: toolName })}</span>
                            </div>
                          );
                        }
                        return null;
                      })}

                      {showReasoning && (
                        <ReasoningContent 
                          reasoningText={reasoningText} 
                          isLoading={isLoading && !messageText} 
                          t={t} 
                        />
                      )}
                      {messageText && (
                        <div
                          className={cn(
                            "prose prose-sm max-w-none",
                            message.role === "user" ? "prose-invert" : "prose-zinc dark:prose-invert",
                            "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-a:text-purple-600 prose-a:underline dark:prose-a:text-purple-400",
                          )}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
                        </div>
                      )}
                      <MessageActions message={message} text={messageText} />
                    </div>
                  </div>
                );
              })}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Brain className="h-4 w-4 animate-pulse text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{t("thinking")}</span>
                  </div>
                </div>
              )}
              {error && !error.message?.includes("Type validation failed") && !error.message?.includes('"type":"finish"') && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {t("errorPrefix")}: {error.message || t("fallbackError")}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative border-b border-zinc-200 dark:border-zinc-700">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t("inputPlaceholder")}
              aria-label={t("inputPlaceholder")}
              className="max-h-[150px] min-h-[56px] w-full resize-none bg-transparent px-4 py-4 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              aria-label={t("send")}
              className={cn(
                "absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500",
                inputValue.trim()
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/25 hover:bg-purple-700"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500",
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 bg-zinc-50 px-4 py-2 dark:bg-zinc-800/50">
            <div className="relative">
              <button
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                aria-label={t("modelMenu")}
                className="flex min-h-8 items-center gap-1.5 rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                {currentModelName}
              </button>
              {isModelMenuOpen && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setIsModelMenuOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-purple-500 dark:hover:bg-zinc-700",
                        selectedModel === model.id ? "font-medium text-purple-600 dark:text-purple-400" : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button className="flex min-h-8 items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-300">
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t("attach")}</span>
              </button>
              <button className="flex min-h-8 items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-300">
                <Keyboard className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t("shortcuts")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
