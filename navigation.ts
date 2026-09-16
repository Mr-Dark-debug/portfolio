import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const locales = ['en', 'de', 'de-CH', 'lb-LU', 'es', 'hi-IN', 'fr'] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true
});

export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);
