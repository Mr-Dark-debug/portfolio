import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { caseStudies } from "@/lib/case-studies";

export function ProjectVisual({ slug }: { slug: string }) {
  if (slug === "pocketllm")
    return (
      <div className="work-visual visual-pocket" aria-hidden="true">
        <div className="visual-orbit" />
        <div className="visual-console">
          <span className="console-label">
            <i /> POCKETLLM
          </span>
          <strong>
            Your models.
            <br />
            Your environment.
          </strong>
          <div className="console-pills">
            <span>LOCAL</span>
            <span>CLOUD</span>
            <span>BYOK</span>
          </div>
          <div className="console-line">
            prompt <span>→</span> retrieve <span>→</span> stream
          </div>
        </div>
        <span className="visual-footnote">01 / LLM INFRASTRUCTURE</span>
      </div>
    );
  if (slug === "setfit-reproduction")
    return (
      <div className="work-visual visual-setfit" aria-hidden="true">
        <div className="research-grid" />
        <div className="visual-research">
          <span className="console-label">PAPER → CODE → EVIDENCE</span>
          <strong>
            Reproduce.
            <br />
            Question. Verify.
          </strong>
          <div className="research-runs">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i}>{String(i + 1).padStart(2, "0")}</span>
            ))}
          </div>
          <span className="text-xs opacity-60">
            Ten independent runs. One reproducible workflow.
          </span>
        </div>
        <span className="visual-footnote">02 / NLP RESEARCH</span>
      </div>
    );
  if (slug === "aethermind-forge")
    return (
      <div className="work-visual visual-forge" aria-hidden="true">
        <div className="forge-stack">
          <span>RMSNorm</span>
          <span>Attention · RoPE</span>
          <span>SwiGLU</span>
          <span>Language model</span>
        </div>
        <div className="forge-label">
          <span className="console-label">FORGE–1</span>
          <strong>
            Small model.
            <br />
            Deep questions.
          </strong>
        </div>
        <span className="visual-footnote">03 / MODEL ENGINEERING</span>
      </div>
    );
  return (
    <div className="work-visual visual-molt" aria-hidden="true">
      <div className="molt-paper">
        <span>YOUR NEXT CHAPTER</span>
        <div />
        <div />
        <div />
        <strong>
          Review.
          <br />
          Refine.
          <br />
          Apply.
        </strong>
      </div>
      <span className="molt-tag">AI + human review</span>
      <span className="visual-footnote">04 / APPLIED AI</span>
    </div>
  );
}

export function SelectedWork({ locale }: { locale: string }) {
  return (
    <section
      id="selected-work"
      className="editorial-section selected-work"
      aria-labelledby="selected-work-title"
    >
      <header className="editorial-heading">
        <div>
          <p className="eyebrow">03 / Ideas made tangible</p>
          <h2 id="selected-work-title">
            Selected work<span>.</span>
          </h2>
        </div>
        <Link className="section-link" href={`/${locale}/projects`}>
          Explore all projects <ArrowUpRight size={17} />
        </Link>
      </header>
      <div className="selected-work-grid">
        {caseStudies.map((project) => (
          <article className="selected-project" key={project.slug}>
            <Link
              href={`/${locale}/projects/${project.slug}`}
              aria-label={`Explore ${project.title}`}
            >
              <ProjectVisual slug={project.slug} />
              <div className="selected-project-copy">
                <p className="eyebrow">{project.category}</p>
                <div className="project-title-row">
                  <h3>{project.title}</h3>
                  <span className="project-arrow">
                    <ArrowUpRight size={22} />
                  </span>
                </div>
                <p>{project.summary}</p>
                <ul className="project-stack" aria-label="Technology stack">
                  {project.stack.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="project-readout">
                  <span>{project.metric}</span>
                  <span>Explore project →</span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
