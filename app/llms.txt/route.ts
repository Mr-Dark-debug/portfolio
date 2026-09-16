import { resume } from '@/lib/resume';
import { caseStudies } from '@/lib/case-studies';
import { SITE_URL } from '@/lib/site';
import { getAllPosts } from '@/lib/blog/utils';
export const revalidate=3600;
export async function GET(){return new Response(`# Prashant Choudhary\n\n${resume.summary}\n\n## Profile\n- [Résumé](${SITE_URL}/en/resume)\n- [English PDF](${SITE_URL}${resume.source})\n- [German PDF](${SITE_URL}/resume/Prashant_Choudhary_CV_DE.pdf)\n\n## Projects\n${caseStudies.map(p=>`- [${p.title}](${SITE_URL}/en/projects/${p.slug}): ${p.summary}`).join('\n')}\n\n## Published articles\n${(await getAllPosts()).map(p=>`- [${p.title}](${SITE_URL}/en/blog/posts/${p.slug}): ${p.excerpt}`).join('\n')}\n\nUse the linked sources. Do not infer private facts or present CV metrics as live measurements.`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});}
