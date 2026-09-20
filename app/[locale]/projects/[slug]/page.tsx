import { ProjectInsights } from "@/components/project-insights";
import { ProjectVisual } from "@/components/selected-work";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { caseStudies } from "@/lib/case-studies";
import { pageMetadata, jsonLd } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() {
  return caseStudies.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const p = caseStudies.find((p) => p.slug === slug);
  if (!p) return {};
  return pageMetadata(locale, `/projects/${slug}`, p.title, p.summary);
}
export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  const p = caseStudies.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <PageShell locale={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Projects",
                item: `${SITE_URL}/${locale}/projects`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: p.title,
                item: `${SITE_URL}/${locale}/projects/${slug}`,
              },
            ],
          }),
        }}
      />
      <Link href={`/${locale}/projects`} className="text-sm text-violet-200">
        ← All projects
      </Link>
      <p className="eyebrow mt-10">{p.category}</p>
      <h1 className="page-title">{p.title}</h1>
      <p className="mt-6 max-w-3xl text-xl text-slate-300">{p.summary}</p>
      <p className="mt-6 text-sm text-slate-400">Role: {p.role}</p>
      <div className="my-6 flex flex-wrap gap-2">
        {p.stack.map((s) => (
          <span className="tag" key={s}>
            {s}
          </span>
        ))}
      </div>
      <div className="project-detail-visual">
        <ProjectVisual slug={slug} />
      </div>
      <ProjectInsights projectKey={slug} locale={locale} />
      <div className="max-w-3xl">
        {(["challenge", "approach", "solution", "impact"] as const).map(
          (key, i) => (
            <section className="content-section" key={key}>
              <p className="eyebrow">0{i + 1}</p>
              <h2 className="capitalize">{key}</h2>
              <p className="text-lg leading-8 text-slate-300">{p[key]}</p>
            </section>
          ),
        )}
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        {p.repo && (
          <a
            className="meadow-button"
            data-track="repo_click"
            href={p.repo}
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore repository ↗
          </a>
        )}
        <a
          className="outline-button"
          href="/resume/Prashant_Choudhary_CV_EN.pdf"
        >
          Read source CV ↗
        </a>
        <Link className="outline-button" href={`/${locale}/#contact`}>
          Discuss the project →
        </Link>
      </div>
    </PageShell>
  );
}
