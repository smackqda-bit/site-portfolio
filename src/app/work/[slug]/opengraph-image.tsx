import { ImageResponse } from "next/og";
import { projects } from "@/content/projects";

export const alt = "A SMACKQ digital experience";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProjectImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  const warm = project?.theme === "forma";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: warm ? "#ded2bf" : "#10130d",
          color: warm ? "#3a342b" : "#f2f2f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
          <span>SMACKQ</span>
          <span>{project?.kind === "concept" ? "CONCEPT PROJECT" : "SELECTED WORK"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 148, fontWeight: 700, letterSpacing: -9 }}>
            {project?.title || "SMACKQ"}
          </span>
          <span style={{ fontSize: 32 }}>{project?.subtitle || "Digital, reimagined."}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
          <span>{project?.category}</span>
          <span>{project?.year}</span>
        </div>
      </div>
    ),
    size,
  );
}
