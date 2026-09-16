"use client";
import { Newsletter } from "@/components/blog/newsletter";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, ArrowLeft, Mail, Anchor, Rocket, MapPin, Calendar, Clock, ArrowRight, X, Twitter, Linkedin, Facebook } from "lucide-react";
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
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Fix hydration issues + sync ?q= and ?tag= so links/tag pages work
    useEffect(() => {
        setMounted(true);
        const params = new URLSearchParams(window.location.search);
        setSearchQuery(params.get("q") || "");
        setSelectedTag(params.get("tag"));
    }, []);

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const q = searchQuery.trim().toLowerCase();
            const matchesSearch = q === "" ||
                post.title.toLowerCase().includes(q) ||
                post.excerpt.toLowerCase().includes(q) ||
                post.tags.some(tag => tag.toLowerCase().includes(q));

            const matchesTag = !selectedTag || post.tags.includes(selectedTag);

            return matchesSearch && matchesTag;
        });
    }, [posts, searchQuery, selectedTag]);

    // Keep shareable URL in sync (?q=, ?tag=)
    useEffect(() => {
        if (!mounted || typeof window === "undefined") return;
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (selectedTag) params.set("tag", selectedTag);
        const query = params.toString();
        window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    }, [searchQuery, selectedTag, mounted]);


    return (
        <div className="min-h-screen bg-[#080c22] text-zinc-100">
            {/* Header/Navbar */}
            <nav className="sticky top-0 z-50 bg-[#080c22]/95 backdrop-blur border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">Field notes</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/${locale}`}
                                className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-[#15113e] to-[#080c22] py-16 md:py-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
                            Field notes
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
                            Notes on building AI systems, reproducing research and the decisions behind useful software.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Featured Article */}
            {posts.length > 0 && !searchQuery && !selectedTag && (
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Insight</p>
                        <motion.div
                            initial={false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300 group cursor-pointer"
                        >
                            {/* Image */}
                            <div className="md:col-span-2 relative h-64 md:h-72 overflow-hidden">
                                {posts[0].image ? (
                                    <Image
                                        src={posts[0].image}
                                        alt={posts[0].title}
                                        fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                        <Rocket className="w-16 h-16 text-white opacity-30" />
                                    </div>
                                )}
                            </div>
                            {/* Content */}
                            <Link href={`/${locale}/blog/posts/${posts[0].slug}`} className="md:col-span-1 p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-3">
                                        {posts[0].title}
                                    </h3>
                                    <p className="text-zinc-300 text-sm mb-4 line-clamp-2">
                                        {posts[0].excerpt}
                                    </p>
                                </div>
                                <div className="text-xs text-zinc-500 flex gap-3">
                                    <span>{new Date(posts[0].date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                </section>
            )}

            <section className="mx-auto max-w-6xl px-6 py-12"><Newsletter /></section>
            <section className="mx-auto max-w-6xl px-6 pt-12"><div className="flex flex-wrap items-center gap-4"><label htmlFor="blog-search" className="text-lg font-semibold">Explore the archive</label><input id="blog-search" type="search" placeholder="Search articles…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#121834] px-4 py-3"/></div><div className="mt-5 flex flex-wrap gap-2"><button className="tag" aria-pressed={!selectedTag} onClick={()=>setSelectedTag(null)}>All topics</button>{tags.map(tag=><button className="tag" aria-pressed={selectedTag===tag} key={tag} onClick={()=>setSelectedTag(selectedTag===tag?null:tag)}>{tag}</button>)}</div><p className="mt-4 text-sm text-slate-400" role="status">{filteredPosts.length} {filteredPosts.length===1?'article':'articles'}{searchQuery?` matching “${searchQuery}”`:''}</p></section>
            {/* Articles Grid */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.filter(post => searchQuery || selectedTag || post.slug !== posts[0]?.slug).map((post, index) => (
                        <motion.article
                            key={post.slug}
                            initial={false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col h-full"
                        >
                            <Link href={`/${locale}/blog/posts/${post.slug}`} className="flex flex-col h-full">
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
                                    {post.image ? (
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                                            <Rocket className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    {/* Tag */}
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                                            {post.tags[0] || "Insight"}
                                        </p>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="text-sm text-zinc-400 mb-4 flex-1 line-clamp-2">
                                        {post.excerpt}
                                    </p>

                                    {/* Meta */}
                                    <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                                        {new Date(post.date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </Link>
                        </motion.article>
                    ))}
                </div>

                {filteredPosts.length === 0 && (
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Anchor className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <p className="text-lg text-zinc-400 mb-4">No articles found</p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedTag(null);
                            }}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            Clear filters
                        </button>
                    </motion.div>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-10"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6 px-6 text-sm text-slate-400"><p>© {new Date().getFullYear()} Prashant Choudhary</p><div className="flex gap-6"><Link href={`/${locale}/projects`}>Projects</Link><Link href={`/${locale}/resume`}>Résumé</Link><a href="/rss.xml">RSS</a><Link href={`/${locale}/privacy`}>Privacy</Link></div></div></footer>
        </div>
    );
}
