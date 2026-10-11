"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import type { Project } from "@/content/projects";
import { useMotion } from "./MotionProvider";
import { Arrow } from "./Logo";
import { ProjectTransition } from "./ProjectTransition";
export function ProjectCard({project,index}:{project:Project;index:number}) {
  const ref=useRef<HTMLAnchorElement>(null);
  const label=project.kind==="concept"?"Concept Project":"Selected Work";
  const {reduced}=useMotion();
  function move(e:React.PointerEvent<HTMLAnchorElement>){
    if(reduced || e.pointerType!=="mouse")return;
    const r=e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx",`${(e.clientX-r.left-r.width/2)*.018}px`);
    e.currentTarget.style.setProperty("--my",`${(e.clientY-r.top-r.height/2)*.018}px`);
  }
  function reset(){ref.current?.style.setProperty("--mx","0px");ref.current?.style.setProperty("--my","0px");}
  return <article className={`project-card project-${project.theme}`}>
    <ProjectTransition slug={project.slug}><Link ref={ref} href={`/work/${project.slug}`} className="project-cover" onPointerMove={move} onPointerLeave={reset} aria-label={`Explore ${project.title} — ${label}`}>
      <Image src={project.cover} alt={`${project.title}: ${project.subtitle} — ${project.kind==="concept"?"original concept artwork":"project cover"}`} fill sizes={index===0?"(max-width: 600px) 100vw, 92vw":"(max-width: 600px) 100vw, 46vw"} unoptimized/>
      <span className="project-badge mono">{label}</span><span className="project-view">Explore<br/>{project.kind==="concept"?"concept":"project"} <Arrow diagonal/></span>
      <span className="project-hover-title">{project.title}</span>
    </Link></ProjectTransition>
    <div className="project-caption"><div><h3><Link href={`/work/${project.slug}`}>{project.title}<span>™</span></Link></h3><p>{project.category}</p></div><span className="mono">{project.year} <span>↗</span></span></div>
  </article>;
}
