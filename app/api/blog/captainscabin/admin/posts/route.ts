import { refreshBlog } from '@/lib/blog/revalidate';
import { rateLimit } from '@/lib/rate-limit';
import { database } from '@/lib/db';
import { validSlug } from '@/lib/blog/storage';
import { NextResponse } from 'next/server';
import { savePost, getAllPostsWithDrafts } from '@/lib/blog/utils';
import { isAdminAuthorized, adminUnauthorized } from '@/lib/admin-auth';

export async function GET(req: Request) {
    if (!isAdminAuthorized(req)) return adminUnauthorized();
    const limited = await rateLimit(req, 'admin-api', 60, 60); if (limited) return limited;
    try {
        const posts = await getAllPostsWithDrafts();
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    if (!isAdminAuthorized(req)) return adminUnauthorized();
    const limited = await rateLimit(req, 'admin-api', 60, 60); if (limited) return limited;
    try {
        const { slug, content, isDraft } = await req.json();

        if (!validSlug(slug) || typeof content !== 'string' || content.length > 200000 || (isDraft !== undefined && typeof isDraft !== 'boolean')) {
            return NextResponse.json(
                { error: 'Slug and content are required' },
                { status: 400 }
            );
        }

        if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && !database()) return NextResponse.json({ error: 'Hosted editing requires database configuration.' }, { status: 503 });
        const success = await savePost(slug, content, isDraft);

        if (success) {
            refreshBlog();
            return NextResponse.json({ success: true, slug });
        } else {
            throw new Error('Failed to save post');
        }
    } catch (error) {
        console.error('Error saving post:', error);
        return NextResponse.json(
            { error: 'Failed to save post' },
            { status: 500 }
        );
    }
}
