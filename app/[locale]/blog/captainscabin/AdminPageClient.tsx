"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Search,
    Calendar,
    Clock,
    Tag,
    ArrowLeft,
    FileText,
    AlertCircle,
    Anchor,
    Compass,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlogPostMeta } from "@/lib/blog/types";

interface AdminPageClientProps {
    initialPosts: BlogPostMeta[];
}

export default function AdminPageClient({ initialPosts }: AdminPageClientProps) {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPostMeta[]>(initialPosts || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "scheduled">("all");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredPosts = posts.filter((post) => {
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const isPublished = post.published;
        const isScheduled = isPublished && new Date(post.date) > new Date();
        const isLive = isPublished && !isScheduled;
        const isDraft = !isPublished;

        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "published" && isLive) ||
            (filterStatus === "scheduled" && isScheduled) ||
            (filterStatus === "draft" && isDraft);

        return matchesSearch && matchesStatus;
    });

    const refreshPosts = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/blog/captainscabin/posts');
            if (res.ok) {
                const data = await res.json();
                setPosts(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch posts:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('Failed to refresh posts:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async (slug: string) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/blog/captainscabin/posts/${slug}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setPosts(prev => prev.filter(p => p.slug !== slug));
                setDeleteConfirm(null);
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error("Failed to delete post:", error);
            alert('Failed to delete post. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const publishedCount = posts.filter(p => p.published && new Date(p.date) <= new Date()).length;
    const scheduledCount = posts.filter(p => p.published && new Date(p.date) > new Date()).length;
    const draftCount = posts.filter(p => !p.published).length;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/blog"
                                className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-purple-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Log</span>
                            </Link>
                            <div className="h-6 w-px bg-zinc-200" />
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-black">
                                    Captain&apos;s Cabin
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={refreshPosts}
                                disabled={isRefreshing}
                                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                            </button>
                            <Link
                                href="/blog/captainscabin/editor/new"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">New Log Entry</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Total Entries</p>
                                <p className="text-2xl font-bold text-zinc-900">{posts.length}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Eye className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Transmitted</p>
                                <p className="text-2xl font-bold text-zinc-900">{publishedCount}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Scheduled</p>
                                <p className="text-2xl font-bold text-zinc-900">{scheduledCount}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <EyeOff className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">In the Vault</p>
                                <p className="text-2xl font-bold text-zinc-900">{draftCount}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="search"
                            placeholder="Search entries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        {(["all", "published", "scheduled", "draft"] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm",
                                    filterStatus === status
                                        ? "bg-purple-600 text-white"
                                        : "bg-white border border-zinc-200 text-zinc-600 hover:border-purple-500 hover:text-purple-600 hover:bg-zinc-50"
                                )}
                            >
                                {status === 'all' ? 'All' : status === 'published' ? 'Live' : status === 'scheduled' ? 'Scheduled' : 'Drafts'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Posts Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden"
                >
                    {filteredPosts.length === 0 ? (
                        <div className="p-12 text-center">
                            <Anchor className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                            <p className="text-zinc-500">No entries found in this sector</p>
                            <Link
                                href="/blog/captainscabin/editor/new"
                                className="inline-flex items-center gap-2 mt-4 text-purple-600 hover:underline"
                            >
                                <Plus className="w-4 h-4" />
                                Write your first log
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {filteredPosts.map((post) => (
                                <div
                                    key={post.slug}
                                    className="p-4 sm:p-6 hover:bg-zinc-50 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-zinc-900 truncate">
                                                    {post.title}
                                                </h3>
                                                <span
                                                    className={cn(
                                                        "px-2 py-0.5 text-xs font-medium rounded-full shrink-0",
                                                        !post.published ? "bg-amber-100 text-amber-700" :
                                                            new Date(post.date) > new Date() ? "bg-blue-100 text-blue-700" :
                                                                "bg-green-100 text-green-700"
                                                    )}
                                                >
                                                    {!post.published ? "Draft" : new Date(post.date) > new Date() ? "Scheduled" : "Live"}
                                                </span>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-zinc-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="truncate max-w-[100px]">
                                                        {new Date(post.date).toLocaleDateString('en-US')}
                                                    </span>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {post.readingTime} min
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="w-4 h-4" />
                                                    <div className="flex gap-1 flex-wrap">
                                                        {post.tags.slice(0, 3).map((tag) => (
                                                            <span key={tag} className="px-2 py-0.5 bg-zinc-100 rounded text-xs text-zinc-600 whitespace-nowrap">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {post.tags.length > 3 && (
                                                            <span className="text-xs">+{post.tags.length - 3}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/blog/posts/${post.slug}`}
                                                className="p-2 text-zinc-400 hover:text-purple-600 transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                            <Link
                                                href={`/blog/captainscabin/editor/${post.slug}`}
                                                className="p-2 text-zinc-400 hover:text-purple-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirm(post.slug)}
                                                className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                            onClick={() => !isDeleting && setDeleteConfirm(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-50 border border-zinc-200"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-zinc-900">
                                        Eject Log Entry?
                                    </h3>
                                    <p className="text-sm text-zinc-500">
                                        This action cannot be reversed.
                                    </p>
                                </div>
                            </div>

                            <p className="text-zinc-600 mb-6">
                                Are you sure you want to eject this log entry into the void?
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Ejecting...
                                        </>
                                    ) : (
                                        'Eject'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
