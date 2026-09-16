import { createHash } from 'node:crypto';
import { database } from './db';
const buckets = new Map<string, { count: number; until: number }>();
export async function rateLimit(req: Request, scope: string, limit = 10, seconds = 600): Promise<Response | null> {
  const ip = req.headers.get('x-vercel-forwarded-for') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const window = Math.floor(Date.now() / (seconds * 1000));
  const key = createHash('sha256').update(`${scope}:${ip}:${window}`).digest('hex');
  const sql = database();
  let count: number;
  try {
    if (sql) {
      const rows = await sql`insert into portfolio_rate_limits (key, count, expires_at) values (${key}, 1, now() + ${seconds} * interval '1 second') on conflict (key) do update set count = portfolio_rate_limits.count + 1 returning count`;
      count = rows[0].count;
    } else {
      for (const [id, value] of buckets) if (value.until < Date.now()) buckets.delete(id);
      if (buckets.size > 10000) return Response.json({ error: 'Please try again later.' }, { status: 503 });
      const bucket = buckets.get(key) || { count: 0, until: Date.now() + seconds * 1000 };
      count = ++bucket.count; buckets.set(key, bucket);
    }
  } catch { return Response.json({ error: 'Service temporarily unavailable.' }, { status: 503 }); }
  return count > limit ? Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(seconds) } }) : null;
}
