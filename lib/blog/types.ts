// Blog types and interfaces

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    author: string;
    excerpt: string;
    tags: string[];
    published: boolean;
    image?: string;
    updatedAt?: string;
    readingTime: number;
    content: string;
}

export interface BlogPostMeta {
    slug: string;
    title: string;
    date: string;
    author: string;
    excerpt: string;
    tags: string[];
    published: boolean;
    image?: string;
    updatedAt?: string;
    readingTime: number;
}

export interface BlogFrontmatter {
    title: string;
    date: string;
    author: string;
    excerpt: string;
    tags: string[];
    published: boolean;
    image?: string;
    updatedAt?: string;
    readingTime?: number;
}

export interface TableOfContentsItem {
    id: string;
    text: string;
    level: number;
}

export interface SocialSharePlatform {
    name: string;
    icon: React.ReactNode;
    shareUrl: (url: string, title: string) => string;
    color: string;
}

export interface AIAction {
    type: 'improve' | 'summarize' | 'expand' | 'simplify' | 'seo' | 'hashtags';
    label: string;
    description: string;
    icon: React.ReactNode;
}

export interface SavedPost {
    slug: string;
    savedAt: string;
    readProgress: number;
}

export interface ReadingProgress {
    slug: string;
    progress: number;
    lastRead: string;
}
