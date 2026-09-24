import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "../studio.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Studio · Prashant Choudhary",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c22",
};

export default function StudioRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="studio-document" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <a className="studio-skip-link" href="#studio-main">Skip to Studio content</a>
        {children}
      </body>
    </html>
  );
}
