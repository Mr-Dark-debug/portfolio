import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Page not found | Prashant Choudhary",
  description:
    "This page could not be found. Explore Prashant's portfolio, projects and field notes.",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c22] text-slate-100 antialiased">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
          <p className="eyebrow">404 / A path less travelled</p>
          <h1 className="page-title">This page isn't here.</h1>
          <p className="my-8 text-lg leading-8 text-slate-400">
            The link may have moved. You can return to the portfolio or explore
            the projects.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link className="meadow-button" href="/en">
              Back to the portfolio →
            </Link>
            <Link className="outline-button" href="/en/projects">
              Explore projects
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
