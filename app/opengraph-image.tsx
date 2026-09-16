import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Prashant Choudhary - AI/ML Engineer & Full-Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          backgroundColor: "#080c22",
          padding: "80px",
        }}
      >
        <div style={{ color: "#a78bfa", fontSize: 28, marginBottom: 16 }}>
          AI / ML Engineer & Full-Stack Developer
        </div>
        <div style={{ color: "white", fontSize: 72, fontWeight: 700 }}>
          Prashant Choudhary
        </div>
        <div style={{ color: "#a1a1aa", fontSize: 30, marginTop: 16 }}>
          Practical AI products · Developer education
        </div>
      </div>
    ),
    { ...size }
  );
}
