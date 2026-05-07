"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Compass, Anchor, Rocket, MapPin, Calendar, Clock, ArrowRight, X, LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import type { BlogPostMeta } from "@/lib/blog/types";
import { useLocale, useTranslations } from "next-intl";

interface BlogPageClientProps {
    posts: BlogPostMeta[];
    tags: string[];
}

export default function BlogPageClient({ posts, tags }: BlogPageClientProps) {
    const t = useTranslations("Blog");
    const locale = useLocale();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Fix hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const matchesSearch = searchQuery === "" ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesTag = !selectedTag || post.tags.includes(selectedTag);

            return matchesSearch && matchesTag;
        });
    }, [posts, searchQuery, selectedTag]);

    const handleCardClick = (slug: string) => {
        router.push(`/blog/posts/${slug}`);
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-pulse text-purple-600">{t("loading")}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white relative">
            <AnimatedGridPattern
                className="fixed inset-0 z-0 text-zinc-200/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
                numSquares={50}
                maxOpacity={0.5}
                duration={5}
            />

            {/* Navigation Bar - Fixed at top */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Branding */}
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-black">
                                {t("brand")}
                            </span>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isSearchOpen
                                        ? "bg-purple-100 text-purple-600"
                                        : "text-zinc-500 hover:text-purple-600 hover:bg-zinc-100"
                                )}
                                aria-label={t("toggleSearch")}
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            <Link
                                href="/"
                                className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("backHome")}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Expandable Search Panel */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-zinc-200/50 bg-white/95 backdrop-blur-xl"
                        >
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                                {/* Search Input */}
                                <div className="relative max-w-2xl mx-auto">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                    <input
                                        type="search"
                                        placeholder={t("searchPlaceholder")}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Tag Filters */}
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                                        {t("filterLabel")}
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button
                                            onClick={() => setSelectedTag(null)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                                !selectedTag
                                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                                                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-purple-200 hover:text-purple-600"
                                            )}
                                        >
                                            {t("allSignals")}
                                        </button>
                                        {tags.map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                                    selectedTag === tag
                                                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                                                        : "bg-white border border-zinc-200 text-zinc-600 hover:border-purple-200 hover:text-purple-600"
                                                )}
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>





            {/* View Toggle & Filters Toolbar */}
            <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-zinc-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-zinc-500">
                            {t("logsFound", { count: filteredPosts.length })}
                        </p>

                        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === "grid"
                                        ? "bg-white text-purple-600 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700"
                                )}
                                title={t("gridView")}
                                aria-label={t("gridView")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === "list"
                                        ? "bg-white text-purple-600 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700"
                                )}
                                title={t("listView")}
                                aria-label={t("listView")}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Section */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Results count (Moved to toolbar, keeping conditional message if needed or removing) */}
                {(searchQuery || selectedTag) && (
                    <p className="text-zinc-500 mb-6 text-center">
                        {t("filteringBy")} {selectedTag && <span className="text-purple-600 font-medium">#{selectedTag}</span>}
                        {searchQuery && selectedTag && " & "}
                        {searchQuery && <span>"{searchQuery}"</span>}
                    </p>
                )}

                {filteredPosts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Anchor className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                        <p className="text-xl text-zinc-500 mb-4">
                            {t("noResults")}
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedTag(null);
                            }}
                            className="text-purple-600 hover:underline"
                        >
                            {t("clearFilters")}
                        </button>
                    </motion.div>
                ) : (
                    <div className={cn(
                        viewMode === "grid"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            : "space-y-6 max-w-4xl mx-auto"
                    )}>
                        {filteredPosts.map((post, index) => (
                            <Link
                                key={post.slug}
                                href={`/blog/posts/${post.slug}`}
                                className={cn(
                                    "group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-xl transition-all cursor-pointer flex",
                                    viewMode === "grid"
                                        ? "flex-col h-full"
                                        : "flex-col sm:flex-row"
                                )}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="contents"
                                >
                                    {/* Image Section */}
                                    <div className={cn(
                                        "relative overflow-hidden bg-zinc-100",
                                        viewMode === "grid"
                                            ? "w-full aspect-video"
                                            : "w-full sm:w-64 aspect-video sm:aspect-auto sm:h-auto"
                                    )}>
                                        {post.image ? (
                                            <Image
                                                src={post.image}
                                                alt={post.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                                                <Rocket className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-1 p-6 flex flex-col">
                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {post.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-full border border-purple-100"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Title */}
                                        <h2 className={cn(
                                            "font-bold text-zinc-900 group-hover:text-purple-600 transition-colors mb-2 line-clamp-2",
                                            viewMode === "grid" ? "text-xl" : "text-2xl"
                                        )}>
                                            {post.title}
                                        </h2>

                                        {/* Excerpt */}
                                        <p className="text-zinc-600 line-clamp-2 mb-4 flex-1">
                                            {post.excerpt}
                                        </p>

                                        {/* Meta */}
                                                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500 mt-auto pt-4 border-t border-zinc-100">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[80px] sm:max-w-none">
                                                    {new Date(post.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {t("minShort", { minutes: post.readingTime })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-200 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-zinc-600 text-sm">{t("footer", { year: new Date().getFullYear() })}</p>
                </div>
            </footer>
        </div >
    );
}
