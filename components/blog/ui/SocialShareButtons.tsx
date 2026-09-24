"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Twitter,
    Linkedin,
    Facebook,
    Link2,
    Share2,
    Check,
    X,
    MessageCircle
} from "lucide-react";
import { track } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";
import { getShareUrl, copyToClipboard } from "@/lib/blog/api";import { Sparkles, Copy, Loader2, ArrowRight } from "lucide-react";

interface SocialShareButtonsProps {
    url: string;
    title: string;
    description?: string;
    content?: string;
    className?: string;
    variant?: "horizontal" | "vertical" | "floating";
}

const platforms = [
    {
        name: "twitter",
        icon: Twitter,
        label: "Share on Twitter",
        color: "hover:bg-sky-500 hover:border-sky-500",
        action: "twitter"
    },
    {
        name: "linkedin",
        icon: Linkedin,
        label: "Share on LinkedIn",
        color: "hover:bg-blue-600 hover:border-blue-600",
        action: "linkedin"
    },
    {
        name: "facebook",
        icon: Facebook,
        label: "Share on Facebook",
        color: "hover:bg-blue-500 hover:border-blue-500",
        action: "facebook"
    },
    {
        name: "reddit",
        icon: MessageCircle,
        label: "Share on Reddit",
        color: "hover:bg-orange-500 hover:border-orange-500",
        action: "social"
    },
];

export function SocialShareButtons({
    url,
    title,
    description,
    content,
    className,
    variant = "horizontal"
}: SocialShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [fullUrl, setFullUrl] = useState(url);

    // AI Modal State
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiContent, setAiContent] = useState("");

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setFullUrl(window.location.origin + url);
        }
    }, [url]);

    const handleCopy = useCallback(async () => {
        const success = await copyToClipboard(fullUrl);
        if (success) {
            track("blog_share", { method: "copy" });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [fullUrl]);

    const handleShareClick = async (platform: string) => {
        track("blog_share", { platform });
        if (!content) {
            // Fallback to direct share if no content provided
            const shareUrl = getShareUrl(platform, fullUrl, title);
            window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
            return;
        }

        setSelectedPlatform(platform);
        setAiModalOpen(true);
        setAiLoading(true);
        setAiContent("");

        try {
            const response = await fetch("/api/blog/ai-assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: platform,
                    content,
                    prompt: null // Use default prompt for platform
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
                setAiContent(fullResult);
            }
        } catch (error) {
            console.error("AI Share error:", error);
            setAiContent("Failed to generate caption. Please write your own!");
        } finally {
            setAiLoading(false);
        }
    };

    const handleNativeShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url: fullUrl,
                });
            } catch {
                // User cancelled or error
            }
        } else {
            setIsOpen(!isOpen);
        }
    }, [title, description, fullUrl, isOpen]);

    return (
        <>
            <div className={cn(
                variant === "floating" ? "fixed right-6 bottom-24 z-50" : "flex gap-2",
                variant === "vertical" && "flex-col",
                className
            )}>
                {variant === "floating" ? (
                    <>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                    className="absolute bottom-16 right-0 flex flex-col gap-3 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700"
                                >
                                    {platforms.map((platform) => (
                                        <button
                                            key={platform.name}
                                            onClick={() => handleShareClick(platform.name)}
                                            className={cn(
                                                "p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-90 caption-top text-zinc-700 dark:text-zinc-300 transition-all duration-200 hover:text-white",
                                                platform.color
                                            )}
                                            aria-label={platform.label}
                                        >
                                            <platform.icon className="w-5 h-5" />
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleCopy}
                                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-all duration-200 hover:bg-purple-500 hover:border-purple-500 hover:text-white"
                                        aria-label="Copy link"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNativeShare}
                            className={cn(
                                "p-4 rounded-full shadow-lg transition-all duration-300",
                                isOpen
                                    ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                                    : "bg-gradient-to-r from-purple-500 to-violet-600 text-white"
                            )}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                        </motion.button>
                    </>
                ) : (
                    <>
                        <span className={cn("text-sm font-medium text-zinc-500 dark:text-zinc-400 mr-2 self-center", variant === 'vertical' && "hidden")}>
                            Share:
                        </span>
                        {platforms.map((platform) => (
                            <motion.button
                                key={platform.name}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleShareClick(platform.name)}
                                className={cn(
                                    "p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-all duration-200 hover:text-white",
                                    platform.color
                                )}
                                aria-label={platform.label}
                            >
                                <platform.icon className="w-4 h-4" />
                            </motion.button>
                        ))}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleCopy}
                            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-all duration-200 hover:bg-purple-500 hover:border-purple-500 hover:text-white"
                            aria-label="Copy link"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        </motion.button>
                    </>
                )}
            </div>

            {/* AI Generator Modal */}
            <AnimatePresence>
                {aiModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setAiModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    AI Caption Generator
                                </h3>
                                <button
                                    onClick={() => setAiModalOpen(false)}
                                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                                    Generating an optimized caption for <span className="capitalize font-medium text-purple-400">{selectedPlatform}</span>.
                                </p>

                                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 min-h-[150px] relative border border-zinc-200 dark:border-zinc-800">
                                    {aiLoading && !aiContent ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500">
                                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                            <span className="text-sm">Consulting the ship's computer...</span>
                                        </div>
                                    ) : (
                                        <textarea
                                            value={aiContent}
                                            onChange={(e) => setAiContent(e.target.value)}
                                            className="w-full h-full min-h-[150px] bg-transparent resize-none focus:outline-none text-zinc-700 dark:text-zinc-300 text-sm font-mono whitespace-pre-wrap"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        copyToClipboard(aiContent);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="px-4 py-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium text-sm"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    Copy
                                </button>
                                <button
                                    onClick={() => {
                                        const shareUrl = getShareUrl(selectedPlatform!, fullUrl, title);
                                        // Some platforms accept text in url sharing, others don't easily.
                                        // For Twitter we can inject text.
                                        if (selectedPlatform === 'twitter') {
                                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(aiContent)}&url=${encodeURIComponent(fullUrl)}`, '_blank');
                                        } else {
                                            // Fallback
                                            window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
                                        }
                                        setAiModalOpen(false);
                                    }}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium text-sm flex items-center gap-2"
                                >
                                    Share Now
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default SocialShareButtons;
