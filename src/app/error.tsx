"use client";
import Link from "next/link";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <main id="main" className="error-page"><span className="eyebrow">A brief interruption</span><h1>LET’S<br/>TRY AGAIN.</h1><p>Something interrupted this experience. Your next visit may work.</p><button className="pill-button" onClick={reset}>Try again ↻</button><Link className="underlined-link" href="/">Back to the studio</Link></main>;}
