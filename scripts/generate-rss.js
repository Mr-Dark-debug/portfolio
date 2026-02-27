import RSS from 'rss';
import fs from 'fs/promises';
import path from 'path';
import { promises as fsp } from 'fs';
import matter from 'gray-matter';

async function getPosts() {
  const postsDirectory = path.join(process.cwd(), 'data', 'posts');
  const filenames = await fs.readdir(postsDirectory);
  
  const posts = await Promise.all(
    filenames.map(async (filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
      // Extract slug from filename
      const slug = filename.replace(/\.md$/, '');
      
      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        description: data.description || content.substring(0, 200) + '...',
        content
      };
    })
  );

  // Sort posts by date (newest first)
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function generateRSS() {
  const posts = await getPosts();

  const feed = new RSS({
    title: 'Prashant Choudhary - Blog',
    description: 'Insights on AI, ML, Agentic Systems, and Full-stack Development',
    site_url: 'https://prashant.sbs',
    feed_url: 'https://prashant.sbs/rss.xml',
    copyright: `All rights reserved ${new Date().getFullYear()}, Prashant Choudhary`,
    language: 'en',
    pubDate: new Date(),
    ttl: 60
  });

  posts.forEach(post => {
    feed.item({
      title: post.title,
      url: `https://prashant.sbs/blog/posts/${post.slug}`,
      date: post.date,
      description: post.description,
      custom_elements: [
        {'content:encoded': post.content}
      ]
    });
  });

  const rssDir = path.join(process.cwd(), 'public');
  const rssPath = path.join(rssDir, 'rss.xml');
  
  // Ensure the directory exists
  await fsp.mkdir(rssDir, { recursive: true });
  
  await fs.writeFile(rssPath, feed.xml({ indent: true }));
  console.log('RSS feed generated successfully!');
}

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this script is being run directly
const isMainModule = () => {
  return process.argv[1] === __filename;
};

if (isMainModule()) {
  generateRSS().catch(console.error);
}