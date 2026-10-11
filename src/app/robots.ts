import type { MetadataRoute } from "next";import {studio} from "@/content/studio";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:process.env.NEXT_PUBLIC_SITE_URL?"/":undefined,disallow:process.env.NEXT_PUBLIC_SITE_URL?"/api/":"/"},sitemap:process.env.NEXT_PUBLIC_SITE_URL?`${studio.url}/sitemap.xml`:undefined};}
