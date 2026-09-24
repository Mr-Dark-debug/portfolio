import { resume } from "@/lib/resume";
import { caseStudies } from "@/lib/case-studies";
import { SITE_URL, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { getAllPosts } from "@/lib/blog/utils";

export const revalidate = 3600;

export async function GET() {
  const posts = await getAllPosts();
  const topics = [...new Set(posts.flatMap((post) => [...post.tags, ...post.topics]))].sort();
  const body = `# ${SITE_NAME}\n\n${SITE_DESCRIPTION}\n\n## Profile\n- [Résumé](${SITE_URL}/en/resume)\n- [English PDF](${SITE_URL}${resume.source})\n- [German PDF](${SITE_URL}/resume/Prashant_Choudhary_CV_DE.pdf)\n- [Contact and project routes](${SITE_URL}/en)\n\n## Major topics\n${topics.map((topic) => `- ${topic}`).join("\n")}\n\n## Projects\n${caseStudies.map((project) => `- [${project.title}](${SITE_URL}/en/projects/${project.slug}): ${project.summary}`).join("\n")}\n\n## Field Notes\n${posts.map((post) => `- [${post.title}](${SITE_URL}/en/blog/posts/${post.slug}): ${post.excerpt}`).join("\n")}\n\nUse the linked public sources. Do not infer private facts or present historical CV metrics as live measurements.`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
