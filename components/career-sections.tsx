import { resume } from "@/lib/resume";
import { ArrowUpRight, GraduationCap } from "lucide-react";

const careerDetails = [
  {
    location: "Surat, India",
    focus: "AI products & backend systems",
    url: "https://proposal.biz",
    label: "Proposal.biz",
  },
  {
    location: "Surat, India",
    focus: "Retrieval & agentic workflows",
    url: "https://enacton.com",
    label: "EnactOn",
  },
  {
    location: "Remote · India",
    focus: "Conversational AI",
    url: null,
    label: null,
  },
  {
    location: "Remote",
    focus: "Product quality & user testing",
    url: "https://nothing.tech",
    label: "Nothing",
  },
];

export function CareerSections() {
  return (
    <div className="career-wrapper">
      <section
        id="experience"
        className="editorial-section"
        aria-labelledby="experience-title"
      >
        <header className="editorial-heading">
          <div>
            <p className="eyebrow">01 / Where I’ve contributed</p>
            <h2 id="experience-title">
              Experience<span>.</span>
            </h2>
          </div>
          <p>
            AI systems in production.
            <br />A practical eye for the details.
          </p>
        </header>
        <ol className="career-list">
          {resume.experience.map((entry, index) => {
            const details = careerDetails[index];
            return (
              <li className="career-row" key={entry.title}>
                <div className="career-identity">
                  <span className="career-index">0{index + 1}</span>
                  <h3>{entry.organization}</h3>
                  <p>{entry.period}</p>
                  {details.url && (
                    <a
                      href={details.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {details.label}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
                <dl className="career-facts">
                  <div>
                    <dt>Position</dt>
                    <dd>{entry.title}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{details.location}</dd>
                  </div>
                  <div>
                    <dt>Focus</dt>
                    <dd>{details.focus}</dd>
                  </div>
                </dl>
                <p className="career-description">
                  {entry.detail.replace(
                    /,? as documented in the supplied CV\./,
                    ".",
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
      <section
        id="education"
        className="editorial-section education-section"
        aria-labelledby="education-title"
      >
        <header className="editorial-heading">
          <div>
            <p className="eyebrow">02 / Always learning</p>
            <h2 id="education-title">
              Education<span>.</span>
            </h2>
          </div>
          <p>
            From applied AI
            <br />
            to the language behind it.
          </p>
        </header>
        <ol className="education-list">
          {resume.education.map((entry, index) => (
            <li className="education-row" key={entry.title}>
              <div className="education-mark" aria-hidden="true">
                <GraduationCap size={27} />
              </div>
              <div>
                <p className="eyebrow">
                  {index === 0
                    ? "Postgraduate · In progress"
                    : "Undergraduate · Completed"}
                </p>
                <h3>{entry.title}</h3>
                <p className="education-school">{entry.organization}</p>
              </div>
              <div className="education-period">
                <p>{entry.period}</p>
                <span>{index === 0 ? "Trier, Germany" : "Bardoli, India"}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="learning-note">
          <span className="status-dot" /> Currently exploring few-shot learning,
          reproducible NLP evaluation and efficient language models.
        </div>
      </section>
    </div>
  );
}
