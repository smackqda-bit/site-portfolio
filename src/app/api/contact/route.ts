import { handleContact } from "@/lib/contact";
import { getContactEnv } from "@/lib/contact-env";
export const runtime="nodejs";
export const maxDuration=40;
export async function POST(request:Request){return handleContact(request,getContactEnv());}
