import { resume } from '@/lib/resume';
import { caseStudies } from '@/lib/case-studies';
import { featuredProjects, projects } from '@/lib/projects-data';
import { getAllPosts, getPostBySlug } from '@/lib/blog/utils';
import { SITE_URL } from '@/lib/site';

export type KnowledgeSource = { title: string; url: string; text: string; score?: number };

const stopWords = new Set(['the','a','an','and','about','what','which','does','can','tell','me','his','he','is','of','to','in','you','your','prashant','who','how','why','when','where','it','its','this','that','there','their','with','have','has','had','for','are','was','were','been','will','would','should','could','from','doesn']);

const PROFILE_INTENT = /(who is|about prashant|his background|profile|experience|education|stud(y|ies|ying)|work history|job|hire|contact|email|available|availability|skill|stack|resume|cv)/i;

export function rankSources(query: string, sources: KnowledgeSource[]) {
  const terms = query.toLowerCase().split(/[^\p{L}\p{N}+#]+/u).filter(t=>t.length>1&&!stopWords.has(t));
  const ranked = sources
    .map(source=>({...source, score:terms.reduce((score,term)=>score+(source.title.toLowerCase().includes(term)?7:0)+(source.text.toLowerCase().slice(0,4000).includes(term)?1:0),0)}))
    .filter(s=>(s.score||0)>0)
    .sort((a,b)=>(b.score||0)-(a.score||0))
    .slice(0,6);
  return { ranked, terms };
}

export async function searchKnowledge(query: string, locale='en') {
  const profileSource: KnowledgeSource = { title:'Prashant Choudhary — profile, experience, education and skills',url:`${SITE_URL}/${locale}/resume`,text:JSON.stringify(resume) };
  const caseSources: KnowledgeSource[] = caseStudies.map(p=>({title:p.title,url:`${SITE_URL}/${locale}/projects/${p.slug}`,text:JSON.stringify(p)}));
  const repoSources: KnowledgeSource[] = [...featuredProjects,...projects].map(p=>({title:p.title,url:p.repoUrl,text:`${p.title} (${p.repo}). ${p.description}`}));
  const posts = await getAllPosts();
  const postSources: KnowledgeSource[] = posts.map(p=>({title:p.title,url:`${SITE_URL}/${locale}/blog/posts/${p.slug}`,text:`${p.excerpt} Tags: ${p.tags.join(', ')}`}));

  // Rank everything together so title matches beat generic profile text
  const { ranked, terms } = rankSources(query, [profileSource, ...caseSources, ...repoSources, ...postSources]);

  // Enrich top post matches with full content so answers cite real substance
  const enriched: KnowledgeSource[] = [...ranked];
  for (const match of ranked.filter(s=>s.url.includes('/blog/posts/')).slice(0,3)) {
    const slug = match.url.split('/').pop()!;
    const post = await getPostBySlug(slug);
    if (post) {
      const idx = enriched.findIndex(s=>s.url===match.url);
      enriched[idx] = {...match, text:`${match.text}\n${post.content.replace(/<[^>]*>/g,' ').slice(0,6500)}`};
    }
  }

  // Profile-first only for pure about-me questions with no specific topic terms
  if ((terms.length === 0 || PROFILE_INTENT.test(query)) && !enriched.some(s=>s.url!==profileSource.url && (s.score||0) >= 7)) {
    const rest = enriched.filter(s=>s.url!==profileSource.url);
    return [profileSource, ...rest].slice(0,6);
  }

  if (enriched.length > 0) return enriched;
  // Fallback: never return [] — profile + top case studies stay useful
  return [profileSource, ...caseSources.slice(0,2)];
}
