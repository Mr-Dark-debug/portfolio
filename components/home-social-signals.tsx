import Link from "next/link";
import { ArrowUpRight, Github, Instagram, Linkedin, Youtube } from "lucide-react";
import type { SocialItem } from "@/lib/studio/schema";

function Icon({ provider }: { provider: SocialItem["provider"] }) { if (provider === "github") return <Github aria-hidden="true" />; if (provider === "instagram") return <Instagram aria-hidden="true" />; if (provider === "linkedin") return <Linkedin aria-hidden="true" />; if (provider === "youtube") return <Youtube aria-hidden="true" />; return <ArrowUpRight aria-hidden="true" />; }

export default function HomeSocialSignals({ items, locale }: { items: SocialItem[]; locale: string }) {
  const visible = items.filter((item) => item.visible !== false && (item.featured || item.order < 3)).slice(0, 6);
  if (!visible.length) return null;
  return <section className="editorial-section home-social-signals" aria-labelledby="social-signals-title"><header className="editorial-heading"><div><p className="eyebrow">05 / Elsewhere</p><h2 id="social-signals-title">Recent signals<span>.</span></h2></div><Link className="section-link" href={`/${locale}/blog`}>Read the notes <ArrowUpRight size={17} /></Link></header><div className="home-social-grid">{visible.map((item) => <a className="home-social-card" href={item.url} target="_blank" rel="noreferrer" key={item.id}><span className="home-social-icon"><Icon provider={item.provider} /></span><span><strong>{item.title}</strong><small>{item.description || item.provider}</small></span><ArrowUpRight aria-hidden="true" /></a>)}</div></section>;
}
