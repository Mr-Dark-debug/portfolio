import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { ProjectInsights } from "@/components/project-insights";
import { resolveProject } from "@/lib/project-repository";
import { pageMetadata } from "@/lib/metadata";
type Props = {
  params: Promise<{ locale: string; owner: string; repo: string }>;
};
export async function generateMetadata({ params }: Props) {
  const { locale, owner, repo } = await params;
  return pageMetadata(
    locale,
    `/projects/repository/${owner}/${repo}`,
    repo,
    `Explore ${owner}/${repo}: AI overview, languages, repository activity and recent commits.`,
  );
}
export default async function RepositoryPage({ params }: Props) {
  const { locale, owner, repo } = await params;
  const key = `repo:${owner}/${repo}`;
  if (!resolveProject(key)) notFound();
  return (
    <PageShell locale={locale}>
      <Link className="section-link" href={`/${locale}/#projects`}>
        ← All repositories
      </Link>
      <p className="eyebrow mt-10">Open source / {owner}</p>
      <h1 className="page-title break-words">{repo}</h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-400">
        Explore the implementation, technology and recent development. The
        overview is generated for this visit using the available public
        repository evidence.
      </p>
      <ProjectInsights projectKey={key} locale={locale} />
      <Link href={`/${locale}/#contact`} className="meadow-button mt-8">
        Discuss this project ↗
      </Link>
    </PageShell>
  );
}
