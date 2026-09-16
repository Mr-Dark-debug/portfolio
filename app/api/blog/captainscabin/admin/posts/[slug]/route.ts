import { refreshBlog } from '@/lib/blog/revalidate';
import { rateLimit } from '@/lib/rate-limit';
import { database } from '@/lib/db';
import { validSlug } from '@/lib/blog/storage';
import { NextResponse } from 'next/server';
import { getPostBySlug, deletePost, getRawPostContent } from '@/lib/blog/utils';
import { isAdminAuthorized, adminUnauthorized } from '@/lib/admin-auth';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Props) {
    if (!isAdminAuthorized(request)) return adminUnauthorized();
    const limited = await rateLimit(request, 'admin-api', 60, 60); if (limited) return limited;
    try {
        const { slug } = await params;
        const content = (await getRawPostContent(slug)) || (await getRawPostContent(slug, true));

        if (!content) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ slug, content });
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: Props) {
    if (!isAdminAuthorized(request)) return adminUnauthorized();
    const limited = await rateLimit(request, 'admin-api', 60, 60); if (limited) return limited;
    try {
        const { slug } = await params;
        if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && !database()) return NextResponse.json({ error: 'Hosted editing requires database configuration.' }, { status: 503 });
        const success = await deletePost(slug);

        if (success) {
            refreshBlog();
            return NextResponse.json({ success: true });
        } else {
            throw new Error('Failed to delete post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
        );
    }
}
