import { ContactForm } from "./ContactForm";
import { contactConfigured } from "@/lib/contact";
import { getContactEnv } from "@/lib/contact-env";
import { studio } from "@/content/studio";
import { Reveal } from "./Reveal";
export function Contact(){
 return <section id="contact" className="section contact-section"><div className="section-heading mono"><span>06 / Make the first move</span><span>Big ideas start with a conversation.</span></div><Reveal><h2 className="display-title">HAVE SOMETHING<br/>CRAZY IN MIND?<br/><a href="#project-form">LET’S BUILD IT.<span>↗</span></a></h2></Reveal><div className="contact-grid" id="project-form"><div className="contact-aside"><span className="status-dot"/><p>Your next project<br/>starts right here.</p><div>Tell us what you’re imagining.<br/>We’ll work out how to make it real.</div>{studio.email&&<a className="underlined-link" href={`mailto:${studio.email}`}>{studio.email} ↗</a>}</div><ContactForm configured={contactConfigured(getContactEnv())}/></div></section>;
}
