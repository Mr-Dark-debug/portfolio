"use client";
import React from "react";
import Link from "next/link";
import {
    NotepadTextDashed,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface FooterLink {
    label: string;
    href: string;
}

interface SocialLink {
    icon: React.ReactNode;
    href: string;
    label: string;
}

interface FooterProps {
    brandName?: string;
    brandDescription?: string;
    backgroundText?: string;
    socialLinks?: SocialLink[];
    navLinks?: FooterLink[];
    creatorName?: string;
    creatorUrl?: string;
    brandIcon?: React.ReactNode;
    className?: string;
}

const AI_TOOLS = [
    { name: "ChatGPT", url: "https://chatgpt.com/?q=", color: "hover:text-[#10A37F]" },
    { name: "Gemini", url: "https://gemini.google.com/app", color: "hover:text-[#4E88D4]" },
    { name: "Claude", url: "https://claude.ai/new?q=", color: "hover:text-[#D97757]" },
    { name: "Grok", url: "https://x.com/i/grok?text=", color: "hover:text-white" },
    { name: "Perplexity", url: "https://www.perplexity.ai/search?q=", color: "hover:text-[#22B8CD]" },
    { name: "Qwen", url: "https://chat.qwen.lm/max?q=", color: "hover:text-[#6A5ACD]" },
    { name: "Z AI", url: "https://www.z.ai/", color: "hover:text-yellow-500" },
    { name: "Kimi", url: "https://kimi.moonshot.cn/", color: "hover:text-blue-400" },
    { name: "Genspark", url: "https://www.genspark.ai/", color: "hover:text-purple-500" },
    { name: "Manus", url: "https://manus.ai/", color: "hover:text-green-500" }
];

export const Footer: React.FC<FooterProps> = ({
    brandName = "YourBrand",
    brandDescription = "Your description here",
    backgroundText,
    socialLinks = [],
    navLinks = [],
    creatorName,
    creatorUrl,
    brandIcon,
    className,
}) => {
    const t = useTranslations("HomePage.footer");

    const handleAIClick = (e: React.MouseEvent, tool: typeof AI_TOOLS[0]) => {
        e.preventDefault();
        const currentUrl = window.location.origin;
        const prompt = t("externalPrompt", { url: currentUrl });
        const encodedPrompt = encodeURIComponent(prompt);

        // Construct URL based on tool capabilities
        let finalUrl = tool.url;
        if (tool.name === "ChatGPT" || tool.name === "Perplexity" || tool.name === "Claude") {
            finalUrl = `${tool.url}${encodedPrompt}`;
        } else if (tool.name === "Grok") {
            finalUrl = `${tool.url}${encodedPrompt}`;
        }

        // Fallback for others: Copy to clipboard and open
        if (!finalUrl.includes(encodedPrompt) && finalUrl !== tool.url) {
            // if we didn't append prompt, we might want to copy it
            navigator.clipboard.writeText(prompt);
            // alert("Prompt copied to clipboard! Pasting in AI tool...");
        } else if (tool.name === "Gemini" || tool.name === "Z AI" || tool.name === "Kimi" || tool.name === "Genspark" || tool.name === "Manus" || tool.name === "Qwen") {
            navigator.clipboard.writeText(prompt);
            // Use a toast or simple feedback in a real app, strict mode might block alert in some envs
        }

        window.open(finalUrl, '_blank');
    };

    return (
        <section className={cn("relative w-full mt-0 overflow-hidden", className)}>
            <footer className="border-t bg-background mt-20 relative">
                <div className="max-w-7xl flex flex-col justify-between mx-auto min-h-[30rem] sm:min-h-[35rem] md:min-h-[40rem] relative p-4 py-10">

                    {/* Main Footer Content */}
                    <div className="flex flex-col mb-12 sm:mb-20 md:mb-0 w-full z-20">
                        <div className="w-full flex flex-col items-center">
                            <div className="space-y-2 flex flex-col items-center flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-foreground text-3xl font-bold">
                                        {brandName}
                                    </span>
                                </div>
                                <p className="text-muted-foreground font-semibold text-center w-full max-w-sm sm:w-96 px-4 sm:px-0">
                                    {brandDescription}
                                </p>
                            </div>

                            {socialLinks.length > 0 && (
                                <div className="flex mb-8 mt-3 gap-4">
                                    {socialLinks.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <div className="w-6 h-6 hover:scale-110 duration-300">
                                                {link.icon}
                                            </div>
                                            <span className="sr-only">{link.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* AI Summarizer Section */}
                            <div className="w-full max-w-4xl mx-auto my-8 flex flex-col items-center gap-4 text-center">
                                <div className="flex items-center gap-2 text-foreground font-semibold">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <span>{t("aiPrompt")}</span>
                                </div>

                                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2">
                                    {AI_TOOLS.map((tool) => (
                                        <button
                                            key={tool.name}
                                            onClick={(e) => handleAIClick(e, tool)}
                                            className={cn(
                                                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                                                tool.color
                                            )}
                                        >
                                            {tool.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {navLinks.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-muted-foreground max-w-full px-4 mt-4">
                                    {navLinks.map((link, index) => (
                                        <Link
                                            key={index}
                                            className="hover:text-foreground duration-300 hover:font-semibold"
                                            href={link.href}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-20 md:mt-24 flex flex-col gap-2 md:gap-1 items-center justify-center md:flex-row md:items-center md:justify-between px-4 md:px-0 z-20">
                        <p className="text-base text-muted-foreground text-center md:text-left">
                            ©{new Date().getFullYear()} {brandName}. {t("rights")}
                        </p>
                        {creatorName && creatorUrl && (
                            <nav className="flex gap-4">
                                <Link
                                    href={creatorUrl}
                                    target="_blank"
                                    className="text-base text-muted-foreground hover:text-foreground transition-colors duration-300 hover:font-medium"
                                >
                                    {t("craftedBy", { name: creatorName })}
                                </Link>
                            </nav>
                        )}
                    </div>
                </div>

                {/* Large background text */}
                <div
                    className="bg-gradient-to-b from-foreground/20 via-foreground/10 to-transparent bg-clip-text text-transparent leading-none absolute left-1/2 -translate-x-1/2 bottom-40 md:bottom-32 font-extrabold tracking-tighter pointer-events-none select-none text-center px-4"
                    style={{
                        fontSize: 'clamp(3rem, 12vw, 10rem)',
                        maxWidth: '95vw'
                    }}
                >
                    {(backgroundText || brandName.split(' ')[0]).toUpperCase()}
                </div>

                {/* Bottom logo */}
                <div className="absolute hover:border-foreground duration-400 drop-shadow-[0_0px_20px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_0px_20px_rgba(255,255,255,0.3)] bottom-24 md:bottom-20 backdrop-blur-sm rounded-3xl bg-background/60 left-1/2 border-2 border-border flex items-center justify-center p-3 -translate-x-1/2 z-10">
                    <div className="w-12 sm:w-16 md:w-24 h-12 sm:h-16 md:h-24 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                        {brandIcon || (
                            <NotepadTextDashed className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 text-background drop-shadow-lg" />
                        )}
                    </div>
                </div>

                {/* Bottom line */}
                <div className="absolute bottom-32 sm:bottom-34 backdrop-blur-sm h-1 bg-gradient-to-r from-transparent via-border to-transparent w-full left-1/2 -translate-x-1/2"></div>

                {/* Bottom shadow */}
                <div className="bg-gradient-to-t from-background via-background/80 blur-[1em] to-background/40 absolute bottom-28 w-full h-24"></div>
            </footer>
        </section>
    );
};
