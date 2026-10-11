import Link from "next/link";

// Six original, monoline glyphs. The open Q becomes the studio's recurring mark.
import { wordmarkPaths } from "@/content/wordmark";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 710 138" fill="none" aria-hidden="true">
      {wordmarkPaths.map((d, i) => (
        <path key={i} className="wordmark-glyph" d={d} stroke="currentColor"
          strokeWidth="13" strokeLinejoin="bevel" />
      ))}
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return <Link href="/" className={`logo ${className}`} aria-label="SMACKQ — home"><Wordmark /></Link>;
}

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-7-7 7 7-7 7"}
      stroke="currentColor" strokeWidth="1.5" />
  </svg>;
}
