import fs from 'node:fs/promises';
import path from 'node:path';
import { database } from '@/lib/db';
export const validSlug = (slug: unknown): slug is string => typeof slug === 'string' && slug.length <= 150 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
export type StoredPost = { slug: string; markdown: string; draft: boolean; deleted?: boolean; updated_at?: string };
export async function storedPosts(): Promise<StoredPost[]> {
 const rows = new Map<string, StoredPost>();
 for (const draft of [false, true]) {
  const dir = path.join(process.cwd(), 'data', draft ? 'drafts' : 'posts');
  let files: string[] = [];
  try { files = await fs.readdir(dir); } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  for (const file of files.filter(f => f.endsWith('.md'))) {
   const slug = file.slice(0, -3);
   if (validSlug(slug)) rows.set(slug, { slug, markdown: await fs.readFile(path.join(dir, file), 'utf8'), draft });
  }
 }
 const sql = database();
 if (sql) for (const row of await sql<StoredPost[]>`select * from portfolio_posts`) rows.set(row.slug, row);
 return [...rows.values()].filter(row => !row.deleted);
}
export async function persistPost(slug: string, markdown: string, draft: boolean) {
 if (!validSlug(slug)) throw new Error('Invalid slug');
 const sql = database();
 if (sql) {
  await sql`insert into portfolio_posts (slug, markdown, draft) values (${slug}, ${markdown}, ${draft}) on conflict (slug) do update set markdown = excluded.markdown, draft = excluded.draft, deleted = false, updated_at = now()`;
 } else {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Configure DATABASE_URL for hosted editing');
  const dir = path.join(process.cwd(), 'data', draft ? 'drafts' : 'posts');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${slug}.md`), markdown, 'utf8');
  await fs.rm(path.join(process.cwd(), 'data', draft ? 'posts' : 'drafts', `${slug}.md`), { force: true });
 }
}
export async function removePost(slug: string) {
 if (!validSlug(slug)) throw new Error('Invalid slug');
 const sql = database();
 if (sql) await sql`insert into portfolio_posts (slug, markdown, deleted) values (${slug}, '', true) on conflict (slug) do update set deleted = true, updated_at = now()`;
 else {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Configure DATABASE_URL for hosted editing');
  for (const dir of ['posts', 'drafts']) await fs.rm(path.join(process.cwd(), 'data', dir, `${slug}.md`), { force: true });
 }
}
