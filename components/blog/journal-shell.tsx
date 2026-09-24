import Link from "next/link";
import { ArrowUpRight, Rss } from "lucide-react";
import { MediaPreferencesLink } from "@/components/blog/consent-aware-embed";

export function JournalNav({
  locale,
  article = false,
  children,
}: {
  locale: string;
  article?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <nav className="journal-nav" aria-label="Journal navigation">
      <div className="journal-container journal-nav-inner">
        <Link href={`/${locale}`} className="journal-brand">
          PC<span aria-hidden="true">/</span>
          <span>Prashant Choudhary</span>
        </Link>
        <div className="journal-nav-links">
          <Link href={`/${locale}/blog`}>
            {article ? "← All field notes" : "Field notes"}
          </Link>
          <Link href={`/${locale}/projects`} className="journal-project-link">
            Projects <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          {children}
        </div>
      </div>
    </nav>
  );
}
export function JournalFooter({ locale }: { locale: string }) {
  return (
    <footer className="journal-footer">
      <div className="journal-container">
        <div>
          <p className="journal-kicker">Keep exploring</p>
          <Link href={`/${locale}/projects`} className="journal-footer-title">
            From the notes to the work. <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <div className="journal-footer-bottom">
          <span>© {new Date().getFullYear()} Prashant Choudhary</span>
          <div>
            <Link href={`/${locale}/resume`}>Résumé</Link>
            <a href="/rss.xml">
              <Rss size={14} aria-hidden="true" /> RSS
            </a>
            <Link href={`/${locale}/privacy`}>Privacy</Link>
            <MediaPreferencesLink />
          </div>
        </div>
      </div>
    </footer>
  );
}
export function JournalDate({
  date,
  locale,
}: {
  date: string;
  locale: string;
}) {
  return (
    <time dateTime={date}>
      {new Date(date).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Europe/Berlin",
      })}
    </time>
  );
}
