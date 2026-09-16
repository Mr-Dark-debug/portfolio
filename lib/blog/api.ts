// Client-side API helpers for blog functionality

import type { BlogPostMeta, SavedPost, ReadingProgress } from './types';

const SAVED_POSTS_KEY = 'blog_saved_posts';
const READING_PROGRESS_KEY = 'blog_reading_progress';

// ============ Saved Posts / Favorites ============

export function getSavedPosts(): SavedPost[] {
    if (typeof window === 'undefined') return [];

    try {
        const saved = localStorage.getItem(SAVED_POSTS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export function savePost(slug: string): void {
    if (typeof window === 'undefined') return;

    const saved = getSavedPosts();
    if (!saved.find(p => p.slug === slug)) {
        saved.push({
            slug,
            savedAt: new Date().toISOString(),
            readProgress: 0,
        });
        localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(saved));
    }
}

export function unsavePost(slug: string): void {
    if (typeof window === 'undefined') return;

    const saved = getSavedPosts().filter(p => p.slug !== slug);
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(saved));
}

export function isPostSaved(slug: string): boolean {
    return getSavedPosts().some(p => p.slug === slug);
}

// ============ Reading Progress ============

export function getReadingProgress(slug: string): number {
    if (typeof window === 'undefined') return 0;

    try {
        const progress = localStorage.getItem(READING_PROGRESS_KEY);
        const allProgress: ReadingProgress[] = progress ? JSON.parse(progress) : [];
        const postProgress = allProgress.find(p => p.slug === slug);
        return postProgress?.progress || 0;
    } catch {
        return 0;
    }
}

export function updateReadingProgress(slug: string, progress: number): void {
    if (typeof window === 'undefined') return;

    try {
        const stored = localStorage.getItem(READING_PROGRESS_KEY);
        const allProgress: ReadingProgress[] = stored ? JSON.parse(stored) : [];

        const existingIndex = allProgress.findIndex(p => p.slug === slug);
        const newProgress: ReadingProgress = {
            slug,
            progress: Math.min(100, Math.max(0, progress)),
            lastRead: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            allProgress[existingIndex] = newProgress;
        } else {
            allProgress.push(newProgress);
        }

        localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(allProgress));
    } catch {
        // Ignore errors
    }
}

// ============ Social Sharing ============

export function getShareUrl(platform: string, url: string, title: string): string {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
        case 'twitter':
            return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        case 'reddit':
            return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        case 'hackernews':
            return `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`;
        default:
            return '';
    }
}

export function copyToClipboard(text: string): Promise<boolean> {
    return navigator.clipboard.writeText(text)
        .then(() => true)
        .catch(() => false);
}

// ============ AI Features API ============

export async function aiAssist(action: string, content: string, context?: string): Promise<ReadableStream | null> {
    try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem("admin-token") || "" : "";
        const response = await fetch('/api/blog/ai-assist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'x-admin-token': token } : {}),
            },
            body: JSON.stringify({ action, content, context }),
        });

        if (!response.ok) throw new Error('AI assist failed');
        return response.body;
    } catch (error) {
        console.error('AI assist error:', error);
        return null;
    }
}

// ============ Blog Posts API ============

export async function fetchPosts(): Promise<BlogPostMeta[]> {
    const response = await fetch('/api/blog/posts');
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
}

export async function fetchPost(slug: string): Promise<any> {
    const response = await fetch(`/api/blog/posts/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
}
