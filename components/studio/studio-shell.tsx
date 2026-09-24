import Link from "next/link";
import { ExternalLink, Plus, Upload } from "lucide-react";
import { StudioNav } from "./studio-nav";

export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-app">
      <div className="studio-shell">
        <StudioNav />
        <div className="studio-main">
          <header className="studio-topbar">
            <div className="studio-topbar-title"><strong>Prashant Portfolio Studio</strong><span>Private publishing workspace</span></div>
            <div className="studio-actions">
              <Link className="studio-button studio-button-quiet" href="/en" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Portfolio</Link>
              <Link className="studio-button studio-button-primary" href="/studio/posts/new"><Plus aria-hidden="true" /> New post</Link>
            </div>
          </header>
          <main id="studio-main" className="studio-content">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function StudioPageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="studio-header"><div className="studio-header-copy"><span className="studio-eyebrow">{eyebrow}</span><h1 className="studio-title">{title}</h1>{description ? <p className="studio-subtitle">{description}</p> : null}</div>{actions ? <div className="studio-actions">{actions}</div> : null}</header>;
}

export function QuickUploadLink() {
  return <Link className="studio-quick-action" href="/studio/media"><Upload aria-hidden="true" /><span>Upload media</span></Link>;
}
