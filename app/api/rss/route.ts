import { generateRSS } from '../../../scripts/generate-rss';

export async function GET() {
  try {
    // Generate the RSS feed
    await generateRSS();
    
    // Read the generated RSS file
    const fs = await import('fs');
    const path = await import('path');
    
    const rssPath = path.join(process.cwd(), 'public', 'rss.xml');
    const rssData = fs.readFileSync(rssPath, 'utf8');
    
    return new Response(rssData, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating RSS:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}