import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export const validSlug = (slug: unknown): slug is string => typeof slug === 'string' && slug.length <= 150 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
export type StoredPost = { slug: string; markdown: string; draft: boolean; deleted?: boolean; updated_at?: string };

export async function storedPosts(): Promise<StoredPost[]> {
  const rows = new Map<string, StoredPost>();
  for (const draft of [false, true]) {
    const dir = path.join(process.cwd(), 'data', draft ? 'drafts' : 'posts');
    let files: string[] = [];
    try { files = await fs.readdir(dir); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    for (const file of files.filter((value) => value.endsWith('.md'))) {
      const markdown = await fs.readFile(path.join(dir, file), 'utf8');
      const data = matter(markdown).data as Record<string, unknown>;
      const slug = typeof data.slug === 'string' && validSlug(data.slug) ? data.slug : file.slice(0, -3).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (validSlug(slug)) rows.set(slug, { slug, markdown, draft });
    }
  }
  return [...rows.values()].filter((row) => !row.deleted);
}

export async function persistPost(slug: string, markdown: string, draft: boolean) {
  if (!validSlug(slug)) throw new Error('Invalid slug');
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Use Studio for hosted Git-backed editing');
  const dir = path.join(process.cwd(), 'data', draft ? 'drafts' : 'posts');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${slug}.md`), markdown, 'utf8');
  await fs.rm(path.join(process.cwd(), 'data', draft ? 'posts' : 'drafts', `${slug}.md`), { force: true });
}

export async function removePost(slug: string) {
  if (!validSlug(slug)) throw new Error('Invalid slug');
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Use Studio for hosted Git-backed editing');
  for (const dir of ['posts', 'drafts']) await fs.rm(path.join(process.cwd(), 'data', dir, `${slug}.md`), { force: true });
}
