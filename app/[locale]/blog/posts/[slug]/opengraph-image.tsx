import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog/utils";

export const runtime = "nodejs";
export const alt = "Prashant Choudhary Field Note";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let title = "Field Notes";
  let topic = "Engineering";
  let author = "Prashant Choudhary";
  try {
    const post = await getPostBySlug(slug);
    if (post?.title) title = post.title;
    topic = post?.tags[0] || post?.topics[0] || topic;
    author = post?.author || author;
  } catch {
    title = "Field Notes";
  }
  const truncated = title.length > 86 ? `${title.slice(0, 83)}...` : title;
  return new ImageResponse(<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", backgroundColor: "#080c22", padding: "68px 76px", color: "#f6f5ff" }}><div style={{ display: "flex", justifyContent: "space-between", width: "100%", color: "#c4b5fd", fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase" }}><span>PC / Field notes</span><span style={{ color: "#d4f994" }}>{topic}</span></div><div style={{ display: "flex", flexDirection: "column", gap: "20px" }}><div style={{ color: "#f6f5ff", fontSize: 58, lineHeight: 1.05, fontWeight: 600, letterSpacing: "-0.04em", maxWidth: 980 }}>{truncated}</div><div style={{ color: "#a6b2cc", fontSize: 24 }}>{author}</div></div><div style={{ width: 110, height: 5, backgroundColor: "#d4f994" }} /></div>, { ...size });
}
