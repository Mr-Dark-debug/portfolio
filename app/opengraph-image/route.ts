import SiteImage from '@/lib/site-og-image';

// Explicit URL keeps shared social metadata independent of the locale layout.
export const runtime = 'nodejs';
export const revalidate = 86400;
export async function GET() {
  return SiteImage();
}
