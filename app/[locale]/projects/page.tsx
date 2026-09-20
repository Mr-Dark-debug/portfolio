import { ProjectVisual } from "@/components/selected-work";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { caseStudies } from "@/lib/case-studies";
import { pageMetadata } from "@/lib/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMetadata(
    locale,
    "/projects",
    "Selected projects",
    "AI infrastructure, NLP research and applied AI products by Prashant Choudhary.",
  );
}
export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <PageShell locale={locale}>
      <p className="eyebrow">Selected work</p>
      <h1 className="page-title">
        From an idea
        <br />
        to something useful.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-400">
        Four projects, with the engineering decisions, scope and evidence behind
        each one.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {caseStudies.map((p) => (
          <Link
            href={`/${locale}/projects/${p.slug}`}
            className="selected-project group"
            key={p.slug}
          >
            <ProjectVisual slug={p.slug} />
            <div className="selected-project-copy">
              <p className="eyebrow">{p.category}</p>
              <h2 className="text-2xl font-semibold text-white group-hover:text-lime-200">
                {p.title} ↗
              </h2>
              <p className="my-4">{p.summary}</p>
              <span className="tag">{p.metric}</span>
              <p className="mt-5 text-sm text-lime-200">Explore project →</p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
