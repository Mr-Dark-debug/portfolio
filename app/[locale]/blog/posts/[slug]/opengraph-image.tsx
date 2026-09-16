import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog/utils";

export const runtime = "nodejs";
export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let title = "Captain's Log";
  try {
    const post = await getPostBySlug(slug);
    if (post?.title) title = post.title;
  } catch {
    // fallback title
  }

  const truncated = title.length > 90 ? `${title.slice(0, 87)}...` : title;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#09090b",
          padding: "80px",
        }}
      >
        <div style={{ color: "#a78bfa", fontSize: 26, marginBottom: 16 }}>
          Captain&apos;s Log · Prashant Choudhary
        </div>
        <div style={{ color: "white", fontSize: 56, fontWeight: 700 }}>
          {truncated}
        </div>
      </div>
    ),
    { ...size }
  );
}
