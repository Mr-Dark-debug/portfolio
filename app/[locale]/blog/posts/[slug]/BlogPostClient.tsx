"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Calendar,
    Clock,
    ArrowLeft,
    ArrowRight,
    Tag,
    User,
    Home
} from "lucide-react";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { ReadingProgress } from "@/components/blog/ui/ReadingProgress";
import { SocialShareButtons } from "@/components/blog/ui/SocialShareButtons";
import { SaveBookmarkButton } from "@/components/blog/features/SaveBookmarkButton";
import { updateReadingProgress } from "@/lib/blog/api";
import { cn } from "@/lib/utils";
import type { BlogPost, BlogPostMeta } from "@/lib/blog/types";
import { useLocale, useTranslations } from "next-intl";

interface BlogPostClientProps {
    post: BlogPost;
    previousPost: BlogPostMeta | null;
    nextPost: BlogPostMeta | null;
}

export default function BlogPostClient({
    post,
    previousPost,
    nextPost
}: BlogPostClientProps) {
    const t = useTranslations("Blog.post");
    const commonT = useTranslations("Blog");
    const locale = useLocale();
    // Track reading progress & highlight code
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            updateReadingProgress(post.slug, progress);
        };

        const highlightCode = async () => {
            const hljs = (await import('highlight.js')).default;
            hljs.highlightAll();
        };

        highlightCode();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [post.slug, post.content]);

    return (
        <div className="min-h-screen bg-white relative">
            <AnimatedGridPattern
                className="fixed inset-0 z-0 text-zinc-200/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
                numSquares={50}
                maxOpacity={0.5}
                duration={5}
            />
            <style jsx global>{`
                /* Highlight.js Theme Overrides */
                .hljs {
                    background: transparent !important;
                    padding: 0 !important;
                }
            `}</style>
            <ReadingProgress />

            {/* Navigation */}
            <nav className="sticky top-1 z-40 bg-white/80 backdrop-blur-lg border-b border-zinc-200/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        <Link
                            href="/blog"
                            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">{t("back")}</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <SaveBookmarkButton slug={post.slug} size="sm" />
                            <Link
                                href="/"
                                className="p-2 text-zinc-600 hover:text-purple-600 transition-colors flex-shrink-0"
                                aria-label={t("home")}
                            >
                                <Home className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero / Header */}
            <header className="relative py-16 sm:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {post.tags.map((tag) => (
                                <Link
                                    key={tag}
                                    href={`/blog?tag=${tag}`}
                                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </Link>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Meta info */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-6 text-sm text-zinc-500 mb-8">
                            <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="truncate max-w-[120px] sm:max-w-none">{post.author}</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="truncate max-w-[150px] sm:max-w-none">
                                    {new Date(post.date).toLocaleDateString(locale, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {commonT("minRead", { minutes: post.readingTime })}
                            </span>
                        </div>

                        {/* Social Share */}
                        <SocialShareButtons
                            url={`/blog/posts/${post.slug}`}
                            title={post.title}
                            description={post.excerpt}
                            content={post.content}
                        />
                    </motion.div>
                </div>

                {/* Featured Image */}
                {post.image && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-5xl mx-auto px-4 sm:px-6 mt-12"
                    >
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100">
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </motion.div>
                )}
            </header>

            {/* Article Content */}
            <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className={cn(
                        "prose prose-lg max-w-none",
                        // Headings
                        "prose-headings:font-bold prose-headings:text-zinc-900",
                        "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
                        "prose-h2:mt-12 prose-h2:mb-6 prose-h3:mt-8 prose-h3:mb-4",
                        // Links
                        "prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline",
                        // Code blocks
                        "prose-pre:bg-zinc-900 prose-pre:rounded-xl prose-pre:shadow-lg",
                        "prose-code:text-sm prose-code:font-mono", // let highlight.js handle colors, just set font
                        // Lists
                        "prose-li:marker:text-purple-500",
                        // Blockquotes
                        "prose-blockquote:border-l-purple-500 prose-blockquote:bg-zinc-50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4",
                        // Images
                        "prose-img:rounded-xl prose-img:shadow-lg",
                        // Paragraphs
                        "prose-p:text-zinc-600 prose-p:leading-relaxed"
                    )}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </article>

            {/* Floating Share Button */}
            <SocialShareButtons
                url={`/blog/posts/${post.slug}`}
                title={post.title}
                variant="floating"
                content={post.content}
            />

            {/* Author Section */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                        {post.author.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500">{t("writtenBy")}</p>
                        <p className="text-lg font-semibold text-zinc-900">{post.author}</p>
                        <p className="text-sm text-zinc-500">{t("authorRole")}</p>
                    </div>
                </div>
            </section>

            {/* Navigation to other posts */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {previousPost && (
                        <Link
                            href={`/blog/posts/${previousPost.slug}`}
                            className="group p-6 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-purple-500 transition-colors"
                        >
                            <p className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                                <ArrowLeft className="w-4 h-4" />
                                {t("previous")}
                            </p>
                            <p className="font-semibold text-zinc-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                {previousPost.title}
                            </p>
                        </Link>
                    )}

                    {nextPost && (
                        <Link
                            href={`/blog/posts/${nextPost.slug}`}
                            className={cn(
                                "group p-6 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-purple-500 transition-colors text-right",
                                !previousPost && "sm:col-start-2"
                            )}
                        >
                            <p className="flex items-center justify-end gap-2 text-sm text-zinc-500 mb-2">
                                {t("next")}
                                <ArrowRight className="w-4 h-4" />
                            </p>
                            <p className="font-semibold text-zinc-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                {nextPost.title}
                            </p>
                        </Link>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-200 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <p className="text-sm text-zinc-500">{t("rights", { year: new Date().getFullYear() })}</p>
                </div>
            </footer>
        </div>
    );
}
