import Link from "next/link";
import { FileSearch, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-8">
                    <FileSearch className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>

                <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                    Post Not Found
                </h1>

                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                    The blog post you&apos;re looking for doesn&apos;t exist or may have been removed.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/blog"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
