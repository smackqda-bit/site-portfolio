import { Logo } from "./Logo";
import { studio } from "@/content/studio";
export function Footer(){return <footer className="site-footer"><div className="footer-top"><Logo/><p>Independent minds.<br/>Extraordinary digital.</p><a href="#top" className="back-top">Back to top <span>↑</span></a></div><div className="footer-bottom mono"><span>© {new Date().getFullYear()} SMACKQ</span><span>Built with human vision & intelligent tools.</span><div>{studio.email && <a href={`mailto:${studio.email}`}>{studio.email}</a>}<a href="/privacy">Privacy</a></div></div></footer>;}
