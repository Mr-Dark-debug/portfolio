import type { Metadata } from 'next';
import { locales } from '@/navigation';
import { SITE_URL, SITE_NAME } from './site';
export function pageMetadata(locale: string, path: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  return { metadataBase: new URL(SITE_URL), title: `${title} | ${SITE_NAME}`, description,
  alternates: { canonical: url, languages: { ...Object.fromEntries(locales.map(l=>[l,`${SITE_URL}/${l}${path}`])), 'x-default': `${SITE_URL}/en${path}` } },
  openGraph: { title, description, url, type: 'website', siteName: SITE_NAME, images: [`${SITE_URL}/opengraph-image`] },
  twitter: { card: 'summary_large_image', title, description, images: [`${SITE_URL}/opengraph-image`] } };
}
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
