import HomePageClient from '@/components/home-page-client';
import HomeSocialSignals from '@/components/home-social-signals';
import { getSocialItems } from '@/lib/studio/content';
import Link from 'next/link';
import { Github, Linkedin, Mail } from 'lucide-react';
import { pageMetadata } from '@/lib/metadata';
import { resume } from '@/lib/resume';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params; return pageMetadata(locale,'','AI/ML Engineer & Python Backend Developer',resume.summary);
}
export default async function HomePage({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params;
   return <HomePageClient socialItems={await getSocialItems()} hero={<div className="w-full max-w-xl text-left"><p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.22em] text-lime-200"><span className="h-2 w-2 rounded-full bg-lime-300"/>AI engineer · Trier, Germany</p><h1 className="hero-name text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-white drop-shadow-[0_2px_18px_rgba(5,7,41,0.9)] sm:text-7xl">Prashant<br/><span className="text-violet-200">Choudhary.</span></h1><p className="mt-7 max-w-md text-lg leading-8 text-slate-200">Building useful AI, from the model<br className="hidden sm:block"/> to the product people use.</p><p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Python · FastAPI · LLM & agentic systems<br/>M.Sc. Natural Language Processing, University of Trier</p><div className="mt-8 flex flex-wrap gap-3"><Link className="meadow-button" href={`/${locale}/projects`}>Explore my work ↗</Link><Link className="outline-button" href={`/${locale}/resume`}>View résumé ↓</Link></div><div className="mt-9 flex gap-3"><a className="social-link" aria-label="GitHub" title="GitHub" href="https://github.com/Mr-Dark-debug" target="_blank" rel="noopener noreferrer"><Github size={19}/></a><a className="social-link" aria-label="LinkedIn" title="LinkedIn" href="https://www.linkedin.com/in/mr-dark-debug" target="_blank" rel="noopener noreferrer"><Linkedin size={19}/></a><a className="social-link" aria-label="Email Prashant" title="Email" href="mailto:prashantc592114@gmail.com"><Mail size={19}/></a></div></div>}/>;
}
