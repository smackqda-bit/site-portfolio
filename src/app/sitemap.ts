import type { MetadataRoute } from "next";import {studio} from "@/content/studio";import {projects} from "@/content/projects";
export default function sitemap():MetadataRoute.Sitemap{return [{url:studio.url,changeFrequency:"monthly",priority:1},...projects.map(p=>({url:`${studio.url}/work/${p.slug}`,changeFrequency:"monthly" as const,priority:.7}))];}
