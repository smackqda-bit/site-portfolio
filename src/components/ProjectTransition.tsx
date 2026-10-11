"use client";

import { ViewTransition } from "react";
import { useMotion } from "./MotionProvider";

export function ProjectTransition({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const { reduced } = useMotion();

  // React coordinates the shared image with the router's transition.
  // Unsupported browsers retain ordinary, fully functional navigation.
  return (
    <ViewTransition
      name={`project-${slug}`}
      default="none"
      share={reduced ? "none" : "project-expand"}
    >
      {children}
    </ViewTransition>
  );
}
