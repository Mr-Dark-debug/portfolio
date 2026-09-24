import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { locales } from "@/navigation";
import { getSettings } from "@/lib/studio/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const disallow = ["/studio", "/studio/", "/api/studio", "/preview", ...locales.flatMap((locale) => [`/${locale}/blog/captainscabin`, `/${locale}/newsletter/`])];
  let policy = process.env.AI_CRAWLER_POLICY;
  try { policy = (await getSettings()).aiCrawlerPolicy; } catch { policy = "allow"; }
  if (policy === "block") disallow.push("/(.*)");
  return { rules: [{ userAgent: "*", allow: "/", disallow }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
