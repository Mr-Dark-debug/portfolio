import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "../editorial.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/navigation';
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { SITE_URL, SITE_NAME, SITE_KEYWORDS, SITE_SOCIALS } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#080c22" },
    { media: "(prefers-color-scheme: dark)", color: "#080c22" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LocaleLayout.metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    keywords: SITE_KEYWORDS,
    icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION, other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined },
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        de: `${SITE_URL}/de`,
        "de-CH": `${SITE_URL}/de-CH`,
        "lb-LU": `${SITE_URL}/lb-LU`,
        es: `${SITE_URL}/es`,
        "hi-IN": `${SITE_URL}/hi-IN`,
        fr: `${SITE_URL}/fr`,
        "x-default": `${SITE_URL}/en`,
      },
      types: {
        "application/rss+xml": [
          {
            url: `${SITE_URL}/rss.xml`,
            title: "Prashant Blog RSS",
          },
        ],
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${SITE_URL}/${locale}`,
      siteName: "Prashant Choudhary",
      type: "website",
      locale,
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  setRequestLocale(locale);
  const messages = await getMessages({locale});

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: "AI/ML Engineer & Full-Stack Developer",
    sameAs: Object.values(SITE_SOCIALS),
    knowsAbout: [
      "Artificial Intelligence",
      "Machine Learning",
      "LLM Applications",
      "Next.js",
      "React",
      "TypeScript",
      "Natural Language Processing",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: locale,
    potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/${locale}/blog?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };

  return (
    <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg"
        >
          Skip to content
        </a>
        <Providers>
          <NextIntlClientProvider locale={locale} timeZone="Europe/Berlin" messages={messages}>
            <div id="main-content">
              {children}
            </div>
            <Toaster position="top-center" richColors />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
