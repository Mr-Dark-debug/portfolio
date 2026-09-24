import { getAllPosts, getPostBySlug } from "@/lib/blog/utils";
import { resume } from "@/lib/resume";
import { caseStudies } from "@/lib/case-studies";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const posts = await getAllPosts();
  const articles = await Promise.all(posts.map((post) => getPostBySlug(post.slug)));
  const text = [`# ${SITE_NAME} — public Field Notes`, "", "Only currently published public material is included.", "", "## Profile", `- [Résumé](${SITE_URL}/en/resume)`, `- [English PDF](${SITE_URL}${resume.source})`, "", "## Projects", ...caseStudies.map((project) => `- [${project.title}](${SITE_URL}/en/projects/${project.slug}): ${project.summary}`), "", "## Articles", ...articles.flatMap((post) => post ? [`### ${post.title}`, `URL: ${SITE_URL}/en/blog/posts/${post.slug}`, `Published: ${post.publishedAt || post.date}`, "", post.body, ""] : [])].join("\n");
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
