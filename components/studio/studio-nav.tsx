"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, FileText, FolderOpen, Home, LogOut, Menu, Settings, Share2, Sparkles, Tags, Wrench, X } from "lucide-react";

const links = [
  { href: "/studio", label: "Overview", icon: Home },
  { href: "/studio/posts", label: "Posts", icon: FileText },
  { href: "/studio/media", label: "Media", icon: FolderOpen },
  { href: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/studio/social", label: "Social hub", icon: Share2 },
  { href: "/studio/seo", label: "SEO", icon: Tags },
  { href: "/studio/tools", label: "Tools", icon: Wrench },
  { href: "/studio/settings", label: "Settings", icon: Settings },
];

export function StudioNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/studio/auth/logout", { method: "POST" });
    router.replace("/studio/login");
    router.refresh();
  };
  return (
    <>
      <button className="studio-icon-button studio-mobile-menu" type="button" aria-label={open ? "Close Studio navigation" : "Open Studio navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      {open && <button className="studio-rail-backdrop" type="button" aria-label="Close Studio navigation" onClick={() => setOpen(false)} />}
      <aside className="studio-rail" data-open={open}>
        <Link className="studio-brand" href="/studio" onClick={() => setOpen(false)}>
          <span className="studio-brand-mark">PC</span>
          <span className="studio-brand-copy"><strong>Studio</strong><span>Portfolio control room</span></span>
        </Link>
        <div>
          <p className="studio-rail-label">Workspace</p>
          <nav className="studio-nav" aria-label="Studio navigation">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === "/studio" ? pathname === href : pathname.startsWith(href);
              return <Link key={href} className="studio-nav-link" href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon aria-hidden="true" /><span>{label}</span></Link>;
            })}
          </nav>
        </div>
        <div className="studio-rail-footer">
          <Link href="/en">Open portfolio</Link>
          <Link href="/en/blog">Open Field Notes</Link>
          <button type="button" onClick={logout} disabled={loggingOut}><LogOut aria-hidden="true" /> {loggingOut ? "Signing out…" : "Sign out"}</button>
        </div>
      </aside>
    </>
  );
}
