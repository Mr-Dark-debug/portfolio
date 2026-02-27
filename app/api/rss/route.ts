import path from 'path';
import { promises as fsPromises } from 'fs';

// Force static generation for Vercel deployment
export const dynamic = 'force-static';

export async function GET() {
  try {
    // Get the path to the RSS file in the public directory
    const rssPath = path.join(process.cwd(), 'public', 'rss.xml');
    
    // Read the RSS file
    const rssData = await fsPromises.readFile(rssPath, 'utf8');
    
    return new Response(rssData, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error serving RSS:', error);
    
    // Generate a simple error RSS feed
    const errorRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error - Prashant Blog RSS</title>
    <description>There was an error accessing the RSS feed. The file may not have been generated during build.</description>
    <link>https://prashant.sbs</link>
  </channel>
</rss>`;
    
    return new Response(errorRss, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}