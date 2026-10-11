import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { projects } from "@/content/projects";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { ProjectTransition } from "@/components/ProjectTransition";
export function generateStaticParams(){return projects.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const p=projects.find(p=>p.slug===slug);return p?{title:`${p.title}${p.kind==="concept"?" — Concept Project":""}`,description:p.description}:{title:"Project not found"};
}
export default async function CaseStudy({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const index=projects.findIndex(p=>p.slug===slug);if(index<0)notFound();const p=projects[index];const next=projects[(index+1)%projects.length];
  return <><main id="main" className="case-page"><section className="case-header"><Link href="/#work" className="underlined-link">← All explorations</Link><div className="section-heading mono"><span>{p.kind==="concept"?"Concept Project / Self-initiated":"Selected Work"}</span><span>{p.year}</span></div><h1>{p.title}<sup>™</sup></h1><div className="case-subtitle"><p>{p.subtitle}</p><span className="mono">{p.category}</span></div></section><ProjectTransition slug={p.slug}><div className="case-hero-image"><Image priority src={p.cover} alt={`${p.title} cover`} fill sizes="100vw" unoptimized/></div></ProjectTransition><section className="section case-description"><span className="eyebrow">The exploration</span><div><h2>{p.description}</h2><p>{p.detail}</p><div className="tech-list">{p.technologies.map(t=><span key={t}>{t}</span>)}</div>{p.kind==="concept"&&<p className="concept-note">Concept Project — an original studio exploration. No real client, commercial results or live product are claimed.</p>}{p.website && <a className="pill-button" href={p.website} target="_blank" rel="noopener noreferrer">Visit website ↗</a>}</div></section><div className="case-gallery">{p.gallery.map(img=><Reveal key={img.src}><Image src={img.src} alt={img.alt} width={1600} height={1100} sizes="100vw" unoptimized/></Reveal>)}</div><section className="next-project section"><span className="eyebrow">{next.kind==="concept"?"Next concept":"Next project"}</span><Link href={`/work/${next.slug}`}>{next.title}<span>↗</span></Link><Link href="/#contact" className="underlined-link">Have an idea of your own? Let’s build it. ↗</Link></section></main><Footer/></>;
}
