"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Save,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Tag,
    Calendar,
    Clock,
    Sparkles,
    X,
    Check,
    Loader2,
    FileText
} from "lucide-react";
import { AIFeatures } from "@/components/blog/features/AIFeatures";
import { cn } from "@/lib/utils";

interface EditorPageClientProps {
    isNew?: boolean;
    initialContent?: string;
    slug?: string;
}

interface PostData {
    title: string;
    excerpt: string;
    tags: string[];
    published: boolean;
    image: string;
    date: string;
    content: string;
}

export default function EditorPageClient({
    isNew = false,
    initialContent = "",
    slug = ""
}: EditorPageClientProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [aiResult, setAiResult] = useState("");

    const [postData, setPostData] = useState<PostData>({
        title: "",
        excerpt: "",
        tags: [],
        published: false,
        image: "",
        date: new Date().toISOString().split("T")[0],
        content: "",
    });

    // Parse initial content if editing
    useEffect(() => {
        if (initialContent) {
            const frontmatterMatch = initialContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1];
                const content = frontmatterMatch[2];

                // Parse frontmatter
                const titleMatch = frontmatter.match(/title:\s*"(.+?)"/);
                const excerptMatch = frontmatter.match(/excerpt:\s*"(.+?)"/);
                const tagsMatch = frontmatter.match(/tags:\s*\[(.+?)\]/);
                const publishedMatch = frontmatter.match(/published:\s*(true|false)/);
                const imageMatch = frontmatter.match(/image:\s*"(.+?)"/);
                const dateMatch = frontmatter.match(/date:\s*"(.+?)"/);

                setPostData({
                    title: titleMatch ? titleMatch[1] : "",
                    excerpt: excerptMatch ? excerptMatch[1] : "",
                    tags: tagsMatch ? tagsMatch[1].split(",").map(t => t.trim().replace(/"/g, "")) : [],
                    published: publishedMatch ? publishedMatch[1] === "true" : false,
                    image: imageMatch ? imageMatch[1] : "",
                    date: dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0],
                    content: content.trim(),
                });
            }
        }
    }, [initialContent]);

    const handleAddTag = useCallback(() => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !postData.tags.includes(tag)) {
            setPostData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
            setTagInput("");
        }
    }, [tagInput, postData.tags]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        setPostData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagToRemove)
        }));
    }, []);

    const generateMarkdown = useCallback(() => {
        const tagsString = postData.tags.map(t => `"${t}"`).join(", ");
        const readingTime = Math.ceil(postData.content.split(/\s+/).length / 200);

        return `---
title: "${postData.title}"
date: "${postData.date}"
author: "Prashant Choudhary"
excerpt: "${postData.excerpt}"
tags: [${tagsString}]
published: ${postData.published}
image: "${postData.image}"
readingTime: ${readingTime}
---

${postData.content}`;
    }, [postData]);

    const handleSave = async (publish = false) => {
        if (!postData.title.trim()) {
            alert("Please enter a title");
            return;
        }

        setSaving(true);

        try {
            const dataToSave = { ...postData, published: publish };
            setPostData(dataToSave);

            const markdown = generateMarkdown();
            const postSlug = slug || postData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            const res = await fetch('/api/blog/captainscabin/posts', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: postSlug,
                    content: markdown,
                    isDraft: !publish,
                }),
            });

            if (res.ok) {
                router.push("/blog/captainscabin");
            } else {
                throw new Error("Failed to save post");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save post. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleAIResult = useCallback((result: string) => {
        setAiResult(result);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/blog/captainscabin"
                                className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-purple-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Admin
                            </Link>
                            <div className="h-6 w-px bg-zinc-200" />
                            <h1 className="text-lg font-semibold text-zinc-900">
                                {isNew ? "New Post" : "Edit Post"}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                    showPreview
                                        ? "bg-purple-100 text-purple-600"
                                        : "text-zinc-600 hover:text-purple-600"
                                )}
                            >
                                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                Preview
                            </button>

                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Draft
                            </button>

                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Publish
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Editor */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
                        >
                            {/* Title Input */}
                            <div className="p-6 border-b border-zinc-200">
                                <input
                                    type="text"
                                    placeholder="Post title..."
                                    value={postData.title}
                                    onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full text-3xl font-bold text-zinc-900 placeholder-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0"
                                />
                            </div>

                            {/* Excerpt Input */}
                            <div className="p-6 border-b border-zinc-200">
                                <textarea
                                    placeholder="Write a brief excerpt..."
                                    value={postData.excerpt}
                                    onChange={(e) => setPostData(prev => ({ ...prev, excerpt: e.target.value }))}
                                    rows={2}
                                    className="w-full text-zinc-600 placeholder-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 resize-none"
                                />
                            </div>

                            {/* Content Editor / Preview */}
                            <div className="p-6">
                                {showPreview ? (
                                    <div
                                        className="prose prose-lg max-w-none min-h-[400px]"
                                        dangerouslySetInnerHTML={{ __html: postData.content.replace(/\n/g, '<br>') }}
                                    />
                                ) : (
                                    <textarea
                                        placeholder="Write your post content in Markdown..."
                                        value={postData.content}
                                        onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                                        className="w-full min-h-[400px] font-mono text-sm text-zinc-700 placeholder-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 resize-none"
                                    />
                                )}
                            </div>
                        </motion.div>

                        {/* AI Result Panel */}
                        {aiResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 bg-purple-50 rounded-2xl border border-purple-200 p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-purple-700 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        AI Suggestions
                                    </h3>
                                    <button
                                        onClick={() => setAiResult("")}
                                        className="text-purple-500 hover:text-purple-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-purple-800 whitespace-pre-wrap">
                                    {aiResult}
                                </p>
                                <button
                                    onClick={() => {
                                        setPostData(prev => ({ ...prev, content: prev.content + "\n\n" + aiResult }));
                                        setAiResult("");
                                    }}
                                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                >
                                    Add to Content
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* AI Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <AIFeatures
                                content={postData.content}
                                onResult={handleAIResult}
                            />
                        </motion.div>

                        {/* Post Settings */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl border border-zinc-200 p-6"
                        >
                            <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Post Settings
                            </h3>

                            {/* Date */}
                            <div className="mb-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Publication Date
                                </label>
                                <input
                                    type="date"
                                    value={postData.date}
                                    onChange={(e) => setPostData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>

                            {/* Featured Image */}
                            <div className="mb-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Featured Image URL
                                </label>
                                <input
                                    type="text"
                                    placeholder="/images/blog/..."
                                    value={postData.image}
                                    onChange={(e) => setPostData(prev => ({ ...prev, image: e.target.value }))}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                    <Tag className="w-4 h-4" />
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {postData.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-sm"
                                        >
                                            {tag}
                                            <button onClick={() => handleRemoveTag(tag)} className="hover:text-purple-800">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a tag..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                                        className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Reading Time Estimate */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl border border-zinc-200 p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500">Estimated Reading Time</p>
                                    <p className="text-xl font-bold text-zinc-900">
                                        {Math.max(1, Math.ceil(postData.content.split(/\s+/).length / 200))} min
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
