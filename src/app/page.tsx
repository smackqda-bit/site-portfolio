import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Work } from "@/components/Work";
import { Expertise } from "@/components/Expertise";
import { Process } from "@/components/Process";
import { ParticleLab } from "@/components/ParticleLab";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
export const dynamic = "force-dynamic";
export default function Home(){return <><main id="main"><Hero/><About/><Work/><Expertise/><Process/><ParticleLab/><Contact/></main><Footer/></>;}
