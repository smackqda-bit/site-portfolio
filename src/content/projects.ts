export type Project = {
  kind: "concept" | "client"; slug: string; title: string; subtitle: string; category: string; year: string;
  description: string; detail: string; cover: string; gallery: {src:string;alt:string}[];
  technologies: string[]; website?: string; theme: string;
};
export const projects: Project[] = [
  {
    kind:"concept",slug:"void-audio",title:"VOID",subtitle:"Feel the unheard.",category:"Brand experience / Creative development",year:"2026",
    description:"An immersive digital flagship for an imagined experimental audio brand. An exploration of sound, silence and sculptural product design.",
    detail:"The concept brings a fictional audio object into a quiet, almost architectural environment. Oversized typography and a restrained monochrome palette give the product room to speak. Motion studies explore how sound could shape a digital interface.",
    cover:"/projects/void.svg",gallery:[{src:"/projects/void-detail.svg",alt:"VOID concept — abstract silver sound waves on a charcoal background"},{src:"/projects/void.svg",alt:"VOID concept — sculptural audio object and experimental typography"}],
    technologies:["Next.js","Three.js","GSAP"],theme:"void",
  },
  {
    kind:"concept",slug:"forma-objects",title:"FORMA",subtitle:"Objects for a slower world.",category:"Art direction / Digital commerce concept",year:"2026",
    description:"A digital gallery for an imagined collection of architectural objects. Warm materials, radical simplicity and a slower way to explore.",
    detail:"FORMA studies the meeting point of an editorial publication and a product catalogue. Sculptural objects, material details and generous spacing create a tactile browsing concept. This is a visual and interaction study, not a live commercial store.",
    cover:"/projects/forma.svg",gallery:[{src:"/projects/forma-detail.svg",alt:"FORMA concept — architectural arches and warm material study"},{src:"/projects/forma.svg",alt:"FORMA concept — sculptural chair in a warm gallery"}],
    technologies:["React","TypeScript","GSAP"],theme:"forma",
  },
  {
    kind:"concept",slug:"synapse-lab",title:"SYNAPSE",subtitle:"A new state of mind.",category:"AI interface / Digital product concept",year:"2026",
    description:"An experimental interface for an imagined creative intelligence workspace. Turning complex connections into a clear, expressive visual language.",
    detail:"The study explores how a person might organize ideas through a spatial interface. A generative visual system connects notes and concepts. The AI workflow is an interface proposal; this demonstration does not claim to provide a functioning AI service.",
    cover:"/projects/synapse.svg",gallery:[{src:"/projects/synapse-detail.svg",alt:"SYNAPSE concept — connected lime nodes in a spatial interface"},{src:"/projects/synapse.svg",alt:"SYNAPSE concept — abstract neural network and graphic typography"}],
    technologies:["Next.js","WebGL","TypeScript"],theme:"synapse",
  },
];
