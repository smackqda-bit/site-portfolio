import { projects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { Reveal } from "./Reveal";
export function Work() {
 return <section id="work" className="section work-section"><div className="section-heading mono"><span>02 / Selected explorations</span><span>Imagination, made tangible.</span></div><Reveal className="work-heading"><h2 className="display-title">NOT ORDINARY.<br/><em>NOT FORGETTABLE.</em></h2><p>{projects.every(p=>p.kind==="concept")?"Independent concepts.":"Selected digital experiences."}<br/>A glimpse of what’s possible.</p></Reveal><div className="projects-grid">{projects.map((p,i)=><Reveal key={p.slug} className={i===0?"project-wide":""}><ProjectCard project={p} index={i}/></Reveal>)}</div><p className="work-disclaimer mono">Projects marked Concept Project are self-initiated explorations. No client commissions or commercial results are implied.</p></section>;
}
