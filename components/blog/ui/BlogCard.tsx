"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlogPostMeta } from "@/lib/blog/types";
import { useLocale, useTranslations } from "next-intl";

interface BlogCardProps {
    post: BlogPostMeta;
    index?: number;
    featured?: boolean;
}

export function BlogCard({ post, index = 0, featured = false }: BlogCardProps) {
    const t = useTranslations("Blog");
    const locale = useLocale();
    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-xl transition-all duration-500",
                featured && "md:col-span-2 md:row-span-2"
            )}
        >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <Link href={`/blog/posts/${post.slug}`} className="block h-full">
                {/* Image Container */}
                <div className={cn(
                    "relative overflow-hidden bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20",
                    featured ? "h-64 md:h-80" : "h-48"
                )}>
                    {post.image ? (
                        <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                <span className="text-white text-3xl font-bold">
                                    {post.title.charAt(0)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Tags overlay */}
                    <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 text-xs font-medium bg-white/90 dark:bg-zinc-900/90 text-purple-600 dark:text-purple-400 rounded-full backdrop-blur-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString(locale, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                timeZone: 'Europe/Berlin'
                            })}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {t("minRead", { minutes: post.readingTime })}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className={cn(
                        "font-bold text-zinc-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2",
                        featured ? "text-2xl md:text-3xl" : "text-xl"
                    )}>
                        {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className={cn(
                        "text-zinc-600 dark:text-zinc-300 mb-4 line-clamp-2",
                        featured && "md:line-clamp-3"
                    )}>
                        {post.excerpt}
                    </p>

                    {/* Author and Read more */}
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <User className="w-4 h-4" />
                            {post.author}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:gap-2 transition-all">
                            {t("readMore")}
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </Link>
        </motion.article>
    );
}

export default BlogCard;
