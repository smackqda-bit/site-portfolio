import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
const geist = localFont({src:"../fonts/Geist-Regular.ttf", variable:"--font-geist", weight:"400", display:"swap", adjustFontFallback:"Arial"});
import { studio } from "@/content/studio";
import { MotionProvider } from "@/components/MotionProvider";
import { Header } from "@/components/Header";
import "./globals.css";
import "./experience.css";
import { Experience } from "@/components/Experience";
import { StoryDirector } from "@/components/StoryDirector";
export const metadata: Metadata = {
  metadataBase: new URL(studio.url),
  icons: {icon:"/icon.svg"},
  title: {default: "SMACKQ™ — Digital, Reimagined.",template:"%s — SMACKQ™"},
  description: studio.description,
  openGraph:{type:"website",locale:"en_US",siteName:"SMACKQ",title:"SMACKQ™ — Digital, Reimagined.",description:studio.description},
  twitter:{card:"summary_large_image",title:"SMACKQ™ — Digital, Reimagined.",description:studio.description},
  robots: process.env.NEXT_PUBLIC_SITE_URL ? {index:true,follow:true} : {index:false,follow:false},
};
export const viewport: Viewport = {themeColor:"#080808",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en" className={geist.variable}><body><MotionProvider><a className="skip-link" href="#main">Skip to content</a><Header/><Experience/><StoryDirector/>{children}</MotionProvider></body></html>;
}
