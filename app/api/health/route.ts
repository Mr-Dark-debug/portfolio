import { database } from '@/lib/db';
import { isGithubConfigured } from '@/lib/studio/github';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = database();
    if (sql) await sql`select 1`;
    return Response.json({ status: 'ok', revision: process.env.VERCEL_GIT_COMMIT_SHA || 'local', services: { storage: sql ? 'postgres' : isGithubConfigured() ? 'github' : 'bundled-read-only', chat: Boolean(process.env.GROQ_API_KEY), newsletter: Boolean(sql && process.env.RESEND_API_KEY && process.env.EMAIL_FROM), images: Boolean(process.env.BLOB_READ_WRITE_TOKEN), studioAuth: Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET), ai: Boolean(process.env.AI_API_KEY || process.env.GROQ_API_KEY), monitoring: Boolean(process.env.SENTRY_DSN) } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ status: 'degraded' }, { status: 503 });
  }
}
