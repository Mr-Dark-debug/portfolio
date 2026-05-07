import createMiddleware from 'next-intl/middleware';
import {routing} from './navigation';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|de|de-CH|lb-LU|es|hi-IN)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
