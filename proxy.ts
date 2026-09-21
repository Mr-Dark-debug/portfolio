import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './navigation';
import { isAdminAuthorized, adminUnauthorized } from './lib/admin-auth';
import { rateLimit } from './lib/rate-limit';
const intl = createMiddleware(routing);
export default async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.includes('/captainscabin')) {
    const limited = await rateLimit(req, 'admin', 60, 60);
    if (limited) return limited;
    if (!isAdminAuthorized(req)) return adminUnauthorized();
  }
  return intl(req);
}
export const config = { matcher: ['/', '/((?!api|_next|_vercel|opengraph-image|.*\\..*).*)'] };
