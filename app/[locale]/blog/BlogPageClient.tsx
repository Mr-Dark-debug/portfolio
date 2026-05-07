"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

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

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail("");
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="animate-pulse text-purple-400">{t("loading")}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Header/Navbar */}
            <nav className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">Newsroom</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
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
            <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 py-16 md:py-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
                            Newsroom
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
                            News and resources from the frontiers of life science software and web applications.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Featured Article */}
            {posts.length > 0 && (
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Insight</p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
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
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                        <Rocket className="w-16 h-16 text-white opacity-30" />
                                    </div>
                                )}
                            </div>
                            {/* Content */}
                            <Link href={`/blog/posts/${posts[0].slug}`} className="md:col-span-1 p-6 flex flex-col justify-between">
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

            {/* Newsletter Section */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-y border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Left: Newsletter Signup */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Subscribe to our newsletter for daily industry insights
                        </h2>
                        <form onSubmit={handleSubscribe} className="flex gap-3">
                            <input
                                type="email"
                                placeholder="Enter Your Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                                required
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
                            >
                                Start Free Trial
                            </button>
                        </form>
                        {subscribed && (
                            <p className="text-green-400 text-sm mt-3">Thanks for subscribing!</p>
                        )}
                    </motion.div>

                    {/* Right: Follow Us */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="md:text-right"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Follow us</h3>
                        <p className="text-zinc-400 mb-4">Get the latest news and travel inspiration.</p>
                        <div className="flex gap-4 md:justify-end">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.slice(1).map((post, index) => (
                        <motion.article
                            key={post.slug}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col h-full"
                        >
                            <Link href={`/blog/posts/${post.slug}`} className="flex flex-col h-full">
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
                                    {post.image ? (
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
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
                        initial={{ opacity: 0 }}
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
            <footer className="border-t border-zinc-800 py-12 bg-zinc-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h4 className="font-bold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li><a href="#" className="hover:text-white transition">Home</a></li>
                                <li><a href="#" className="hover:text-white transition">Showcase</a></li>
                                <li><a href="#" className="hover:text-white transition">Our Flows</a></li>
                                <li><a href="#" className="hover:text-white transition">Enterprise</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition">FAQs</a></li>
                                <li><a href="#" className="hover:text-white transition">Email</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Follow us</h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li><a href="#" className="hover:text-white transition">Linked</a></li>
                                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                                <li><a href="#" className="hover:text-white transition">Facebook</a></li>
                                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-zinc-500">© 2026 Azwedo. All rights reserved.</p>
                        <p className="text-sm text-zinc-500">Crafted with ❤ by Azwedo. Powered by Webflow</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
