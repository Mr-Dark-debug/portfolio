"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    PenLine,
    AlignLeft,
    Minimize2,
    Search,
    Hash,
    Loader2,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIFeaturesProps {
    content: string;
    onResult: (result: string) => void;
    className?: string;
}

interface AIAction {
    type: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    prompt: string;
}

const aiActions: AIAction[] = [
    {
        type: "improve",
        label: "Improve Writing",
        description: "Enhance clarity and readability",
        icon: <PenLine className="w-4 h-4" />,
        prompt: "Improve the writing quality, clarity, and flow of this content while maintaining the original meaning:",
    },
    {
        type: "summarize",
        label: "Summarize",
        description: "Create a concise summary",
        icon: <AlignLeft className="w-4 h-4" />,
        prompt: "Summarize the following content into a brief, engaging excerpt (2-3 sentences):",
    },
    {
        type: "expand",
        label: "Expand",
        description: "Add more detail and depth",
        icon: <Sparkles className="w-4 h-4" />,
        prompt: "Expand on this content with more details, examples, and insights:",
    },
    {
        type: "simplify",
        label: "Simplify",
        description: "Make easier to understand",
        icon: <Minimize2 className="w-4 h-4" />,
        prompt: "Simplify this content to make it more accessible and easier to understand:",
    },
    {
        type: "seo",
        label: "Optimize SEO",
        description: "Improve search ranking potential",
        icon: <Search className="w-4 h-4" />,
        prompt: "Optimize this content for SEO while keeping it natural and readable. Suggest improvements for headlines, keywords, and structure:",
    },
    {
        type: "hashtags",
        label: "Generate Hashtags",
        description: "Create social media hashtags",
        icon: <Hash className="w-4 h-4" />,
        prompt: "Generate relevant hashtags for this content that would work well on Twitter and LinkedIn:",
    },
];

export function AIFeatures({ content, onResult, className }: AIFeaturesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const [result, setResult] = useState<string>("");

    const handleAction = async (action: AIAction) => {
        if (!content.trim()) {
            setResult("Please provide some content to work with.");
            return;
        }

        setLoading(action.type);
        setResult("");

        try {
            const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem("admin-token") || "" : "";
            const response = await fetch("/api/blog/ai-assist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(adminToken ? { "x-admin-token": adminToken } : {}),
                },
                body: JSON.stringify({
                    action: action.type,
                    content,
                    prompt: action.prompt,
                }),
            });

            if (!response.ok) throw new Error("AI request failed");

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let fullResult = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                fullResult += text;
                setResult(fullResult);
            }

            onResult(fullResult);
        } catch (error) {
            console.error("AI error:", error);
            setResult("Failed to process request. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300",
                    isOpen
                        ? "bg-purple-600 text-white"
                        : "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                )}
            >
                {isOpen ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                AI Writing Assistant
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-zinc-900 dark:text-white">
                                AI Writing Tools
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Select an action to enhance your content
                            </p>
                        </div>

                        <div className="p-2 max-h-80 overflow-y-auto">
                            {aiActions.map((action) => (
                                <button
                                    key={action.type}
                                    onClick={() => handleAction(action)}
                                    disabled={loading !== null}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
                                        loading === action.type
                                            ? "bg-purple-100 dark:bg-purple-900/30"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        loading === action.type
                                            ? "bg-purple-500 text-white"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                    )}>
                                        {loading === action.type ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            action.icon
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-zinc-900 dark:text-white">
                                            {action.label}
                                        </p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {action.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {result && (
                            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Result:
                                </p>
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 max-h-40 overflow-y-auto">
                                    {result}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AIFeatures;
