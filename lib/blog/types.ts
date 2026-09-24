import type { SocialEmbed } from "@/lib/studio/schema";

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  publishedAt?: string;
  updatedAt?: string;
  scheduledAt?: string;
  timezone: string;
  status: "local-draft" | "draft" | "scheduled" | "published" | "archived";
  author: string;
  subtitle?: string;
  excerpt: string;
  tldr?: string;
  tldrSource?: "manual" | "ai";
  tags: string[];
  topics: string[];
  categories: string[];
  featured: boolean;
  published: boolean;
  coverImage?: string;
  coverImageAlt?: string;
  coverVideo?: string;
  image?: string;
  readingTime: number;
  content: string;
  body: string;
  searchText: string;
  socialEmbeds: SocialEmbed[];
  metaTitle?: string;
  metaDescription?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  seoKeywords: string[];
  keywords: string[];
  entities: string[];
  faqs: { question: string; answer: string }[];
  externalReferences: string[];
  references: string[];
  relatedPosts: string[];
  series?: { name: string; order: number } | null;
  discussionUrl?: string;
  archivedAt?: string;
  archivePublic: boolean;
}

export interface BlogPostMeta extends Omit<BlogPost, "content" | "body"> {
  views?: number;
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
  type: "improve" | "summarize" | "expand" | "simplify" | "seo" | "hashtags";
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
