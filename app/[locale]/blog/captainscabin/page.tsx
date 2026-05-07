import { Suspense } from "react";
import { getAllPostsWithDrafts } from "@/lib/blog/utils";
import AdminPageClient from "./AdminPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Captain's Cabin | Prashant Choudhary",
    description: "Manage blog posts and content",
    robots: "noindex, nofollow",
};

export const dynamic = 'force-dynamic';

async function AdminContent() {
    try {
        const posts = await getAllPostsWithDrafts();
        return <AdminPageClient initialPosts={posts} />;
    } catch (error) {
        console.error('Error loading admin content:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">Error Loading Captain's Cabin</h2>
                    <p className="text-zinc-600">Failed to load blog posts. Please try again later.</p>
                </div>
            </div>
        );
    }
}

export default function CaptainsCabinPage() {
    return (
        <Suspense fallback={<AdminLoadingSkeleton />}>
            <AdminContent />
        </Suspense>
    );
}

function AdminLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="h-10 w-48 bg-zinc-200 rounded-lg mb-8 animate-pulse" />
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 border-b border-zinc-200 animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="h-5 w-64 bg-zinc-200 rounded mb-2" />
                                    <div className="h-4 w-32 bg-zinc-200 rounded" />
                                </div>
                                <div className="h-8 w-20 bg-zinc-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
