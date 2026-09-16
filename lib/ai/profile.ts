import { resume } from '@/lib/resume';
export const publicProfile = {
  ...resume,
  name: "Prashant Choudhary",
  currentEducation: {
    degree: "Master's in Natural Language Processing",
    institution: "University of Trier",
    startDate: "2026-04-13",
    status: "ongoing",
  },
  publicLinks: {
    website: "https://prashant.sbs/",
    github: "https://github.com/Mr-Dark-debug",
    linkedin: "https://www.linkedin.com/in/mr-dark-debug",
    youtube: "https://youtube.com/@prashantelsewhere",
    blog: "https://prashant.sbs/en/blog",
    x: "https://x.com/prashanttto",
  },
  verifiedFacts: [
    "Prashant Choudhary is an AI/ML engineer and full-stack developer.",
    "He is currently pursuing a Master's in NLP at the University of Trier.",
    "The Master's program started on 13 April 2026 and is ongoing.",
    "Public profile links include his website, GitHub, LinkedIn, YouTube, blog, and X profile.",
  ],
};

export const allowedProfileHosts = new Set([
  "www.prashant.sbs",
  "prashant.sbs",
  "github.com",
  "www.linkedin.com",
  "linkedin.com",
  "youtube.com",
  "www.youtube.com",
  "www.syntax-blogs.prashant.sbs",
  "syntax-blogs.prashant.sbs",
  "x.com",
]);
