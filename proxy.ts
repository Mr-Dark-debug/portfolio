import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './navigation';
import { isAdminAuthorized, adminUnauthorized } from './lib/admin-auth';
import { isStudioAuthorized } from './lib/studio/auth';
import { rateLimit } from './lib/rate-limit';

const intl = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname === '/studio' || pathname.startsWith('/studio/')) {
    if (pathname === '/studio/login' || pathname === '/studio/login/' || pathname.startsWith('/studio/preview/')) return NextResponse.next();
    if (!(await isStudioAuthorized(req))) {
      const login = new URL('/studio/login', req.url);
      login.searchParams.set('next', `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }
  if (pathname.includes('/captainscabin')) {
    const limited = await rateLimit(req, 'admin', 60, 60);
    if (limited) return limited;
    if (!isAdminAuthorized(req)) return adminUnauthorized();
  }
  return intl(req);
}

export const config = { matcher: ['/', '/((?!api|_next|_vercel|opengraph-image|.*\\..*).*)'] };
