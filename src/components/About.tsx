import { Reveal } from "./Reveal";
import { ScrollStatement } from "./ScrollStatement";
export function About() {
  return <section id="about" className="section about-section">
    <div className="section-heading mono"><span>01 / The studio</span><span>Human instinct. Digital edge.</span></div>
    <ScrollStatement/>
    <div className="about-bottom"><div className="studio-seal" aria-hidden="true"><span>HUMAN<br/>AFTER ALL.</span><i>↗</i></div><Reveal className="about-copy"><p>Small studio.<br/>Unrestricted imagination.</p><div>SMACKQ brings human creativity and intelligent tools together to make the web feel different. We design and develop distinctive websites, interactive experiences and digital products.</div><div>Claude and Codex help us explore and build faster. Creative direction, thoughtful engineering and quality control stay human. Every decision is shaped around your project. Every detail earns its place.</div><a href="#expertise" className="underlined-link">Meet our capabilities <span>↗</span></a></Reveal></div>
  </section>;
}
