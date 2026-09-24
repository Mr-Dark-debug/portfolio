"use client";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { Analytics, track } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";

function eventForLink(link: HTMLAnchorElement): { name: string; data?: Record<string, string> } | null {
  const explicit = link.dataset.track;
  if (explicit) return { name: explicit };
  const href = link.href;
  if (href.includes("github.com/")) return { name: "github_open" };
  if (href.includes("linkedin.com/")) return { name: "linkedin_open" };
  if (href.includes("youtube.com/") || href.includes("youtu.be/")) return { name: "youtube_open" };
  if (href.includes("instagram.com/")) return { name: "instagram_open" };
  if (href.includes("/resume/")) return { name: "resume_click" };
  if (href.includes("/contact")) return { name: "contact_click" };
  if (href.includes("/blog")) return { name: "article_open" };
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const match = eventForLink(target);
      if (match) track(match.name, match.data);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem><MotionConfig reducedMotion="user">{children}</MotionConfig><Analytics /><SpeedInsights /></ThemeProvider>;
}
