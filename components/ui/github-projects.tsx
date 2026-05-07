"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Star, GitFork, ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    topics: string[];
    owner: {
        login: string;
        avatar_url: string;
    };
}

interface GitHubProjectsProps {
    username?: string;
    organizations?: string[];
    maxProjects?: number;
    showPinnedOnly?: boolean;
    className?: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Dart: "#00B4AB",
    Kotlin: "#A97BFF",
    Swift: "#F05138",
    Ruby: "#701516",
};

async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
    try {
        const response = await fetch(
            `https://api.github.com/users/${username}/repos?sort=stars&per_page=100&type=owner`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

async function fetchOrgRepos(org: string): Promise<GitHubRepo[]> {
    try {
        const response = await fetch(
            `https://api.github.com/orgs/${org}/repos?sort=stars&per_page=50`,
            { next: { revalidate: 3600 } }
        );
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export function GitHubProjects({
    username = "Mr-Dark-Debug",
    organizations = ["PocketLLM", "syntaxandsips", "codex-clone"],
    maxProjects = 30,
    showPinnedOnly = false,
    className,
}: GitHubProjectsProps) {
    const t = useTranslations("Projects");
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRepos() {
            setLoading(true);

            // Fetch user repos
            const userRepos = await fetchUserRepos(username);

            // Fetch org repos
            const orgReposPromises = organizations.map((org) => fetchOrgRepos(org));
            const orgReposArrays = await Promise.all(orgReposPromises);
            const orgRepos = orgReposArrays.flat();

            // Combine and sort by stars
            const allRepos = [...userRepos, ...orgRepos]
                .sort((a, b) => b.stargazers_count - a.stargazers_count)
                .slice(0, maxProjects);

            setRepos(allRepos);
            setLoading(false);
        }

        loadRepos();
    }, [username, organizations, maxProjects]);

    if (loading) {
        return (
            <div className={cn("w-full py-20", className)}>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            {t("title")}
                        </h2>
                        <p className="text-muted-foreground">{t("loading")}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const featuredRepos = repos.slice(0, 6);
    const moreRepos = repos.slice(6);

    return (
        <div className={cn("w-full", className)}>
            {/* Featured Projects */}
            <section id="projects" className="py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                {t("title")}
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                {t("description")}
                            </p>
                        </div>
                        <Link
                            href={`https://github.com/${username}`}
                            target="_blank"
                            className="text-sm font-medium text-muted-foreground hover:text-purple-500 inline-flex items-center gap-1 transition-colors"
                        >
                            {t("viewProfile")} <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredRepos.map((repo, index) => (
                            <ProjectCard key={repo.id} repo={repo} index={index} featured noDescription={t("noDescription")} />
                        ))}
                    </div>
                </div>
            </section>

            {/* More Projects */}
            {moreRepos.length > 0 && (
                <section className="py-16 sm:py-20 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                                {t("moreTitle")}
                            </h2>
                            <p className="text-muted-foreground">
                                {t("moreDescription")}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10">
                            {moreRepos.map((repo, index) => (
                                <ProjectFeatureCard key={repo.id} repo={repo} index={index} noDescription={t("noShortDescription")} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

function ProjectCard({
    repo,
    index,
    featured = false,
    noDescription,
}: {
    repo: GitHubRepo;
    index: number;
    featured?: boolean;
    noDescription: string;
}) {
    const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || "#888" : "#888";

    return (
        <Link
            href={repo.html_url}
            target="_blank"
            className={cn(
                "group relative border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-6 bg-zinc-50 dark:bg-zinc-900/50",
                "flex flex-col justify-between min-h-[220px] overflow-hidden",
                "hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300",
                "hover:shadow-lg hover:shadow-purple-500/10"
            )}
        >
            {/* Corner decorations */}
            <div className="absolute -top-3 -left-3 w-6 h-6 text-zinc-300 dark:text-zinc-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 6v12m6-6H6" />
                </svg>
            </div>
            <div className="absolute -top-3 -right-3 w-6 h-6 text-zinc-300 dark:text-zinc-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 6v12m6-6H6" />
                </svg>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{repo.owner.login}</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {repo.name}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2">
                    {repo.description || noDescription}
                </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800/50">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        {repo.forks_count}
                    </span>
                </div>
                {repo.language && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: langColor }}
                        />
                        <span className="text-muted-foreground">{repo.language}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

function ProjectFeatureCard({
    repo,
    index,
    noDescription,
}: {
    repo: GitHubRepo;
    index: number;
    noDescription: string;
}) {
    const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || "#888" : "#888";

    return (
        <Link
            href={repo.html_url}
            target="_blank"
            className={cn(
                "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
                (index === 0 || index % 4 === 0) && "lg:border-l dark:border-neutral-800",
                index < 4 && "lg:border-b dark:border-neutral-800"
            )}
        >
            {index < 4 ? (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-purple-100 dark:from-purple-900/20 to-transparent pointer-events-none" />
            ) : (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-purple-100 dark:from-purple-900/20 to-transparent pointer-events-none" />
            )}

            <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
                <Github className="w-6 h-6" />
            </div>

            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-purple-500 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
                    {repo.name}
                </span>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10 line-clamp-2">
                {repo.description || noDescription}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4 px-10 relative z-10">
                <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {repo.stargazers_count}
                </span>
                <span className="flex items-center gap-1">
                    <GitFork className="w-3 h-3" /> {repo.forks_count}
                </span>
                {repo.language && (
                    <span className="flex items-center gap-1">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: langColor }}
                        />
                        {repo.language}
                    </span>
                )}
            </div>
        </Link>
    );
}

export default GitHubProjects;
