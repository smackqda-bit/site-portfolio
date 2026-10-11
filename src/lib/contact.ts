import { createHash } from "node:crypto";
import { projectTypes } from "../content/contact-options";
export type ContactInput={name:string;email:string;projectType:string;budget:string;message:string;website:string;startedAt:number;token:string;};
export type ContactEnv={siteUrl:string;apiKey:string;from:string;to:string;turnstileSecret:string;turnstileSiteKey:string;redisUrl:string;redisToken:string;production:boolean;trustedIpHeader:string;};
type Fetcher=typeof fetch;
export class ContactError extends Error {constructor(public status:number,message:string){super(message);}}
export function validateContact(value:unknown,now=Date.now()):ContactInput{
 if(!value||typeof value!=="object"||Array.isArray(value))throw new ContactError(400,"Please check the form and try again.");
 const v=value as Record<string,unknown>;
 const str=(k:string,max:number,required=true)=>{const s=v[k];if(typeof s!=="string"||(required&&!s.trim())||s.length>max)throw new ContactError(400,`Please check the ${k} field.`);return s.trim();};
 const input={name:str("name",100),email:str("email",254),projectType:str("projectType",60),budget:str("budget",80,false),message:str("message",5000),website:str("website",200,false),startedAt:Number(v.startedAt),token:str("token",4096,false)};
 if(input.website)throw new ContactError(400,"We couldn’t verify this request. Please try again.");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)||/[\r\n]/.test(input.email))throw new ContactError(400,"Please enter a valid email address.");
 if(!projectTypes.some(t=>t===input.projectType))throw new ContactError(400,"Please select a project type.");
 if(input.message.length<20)throw new ContactError(400,"Tell us a little more — at least 20 characters.");
 if(!Number.isFinite(input.startedAt)||now-input.startedAt<2500||now-input.startedAt>86400000)throw new ContactError(400,"Please take a moment to complete the form, then try again.");
 return input;
}
const localBuckets=new Map<string,{count:number;reset:number}>();
export async function rateLimit(key:string,env:ContactEnv,fetcher:Fetcher,now=Date.now()){
 const hashed=createHash("sha256").update(key).digest("hex");
 if(env.redisUrl&&env.redisToken){
   const script="local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],900) end; return n";
   const response=await fetcher(env.redisUrl,{method:"POST",headers:{Authorization:`Bearer ${env.redisToken}`,"Content-Type":"application/json"},body:JSON.stringify(["EVAL",script,"1",`smackq:contact:${hashed}`]),signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw new ContactError(503,"Message delivery is temporarily unavailable. Please try again later.");
   const result=await response.json();if(typeof result.result!=="number")throw new ContactError(503,"Message delivery is temporarily unavailable.");
   if(result.result>3)throw new ContactError(429,"Too many requests. Please try again in 15 minutes.");
 }else{
   if(env.production)throw new ContactError(503,"Project inquiries are temporarily unavailable.");
   for(const [k,v] of localBuckets){if(v.reset<=now)localBuckets.delete(k);}
   if(localBuckets.size>10000)throw new ContactError(503,"Please try again later.");
   const bucket=localBuckets.get(hashed)||{count:0,reset:now+900000};bucket.count++;localBuckets.set(hashed,bucket);
   if(bucket.count>3)throw new ContactError(429,"Too many requests. Please try again in 15 minutes.");
 }
}
export function contactConfigured(env:ContactEnv){return Boolean(env.apiKey&&env.from&&env.to&&(!env.turnstileSecret||env.turnstileSiteKey)&&(!env.production||(env.siteUrl&&env.turnstileSecret&&env.redisUrl&&env.redisToken)));}
async function readBody(request:Request){
 const reader=request.body?.getReader();if(!reader)throw new ContactError(400,"The form is empty.");
 const parts:Uint8Array[]=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>16384){await reader.cancel();throw new ContactError(413,"Your message is too large.");}parts.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ContactError(400,"The request could not be read. Please try again.");}
}
export async function handleContact(request:Request,env:ContactEnv,fetcher:Fetcher=fetch):Promise<Response>{
 const response=(body:object,status:number)=>Response.json(body,{status,headers:{"Cache-Control":"no-store",...(status===429?{"Retry-After":"900"}:{})}});
 try{
   const expected=env.siteUrl?new URL(env.siteUrl).origin:new URL(request.url).origin;
   if(request.headers.get("origin")!==expected)throw new ContactError(403,"This request is not allowed.");
   if(!request.headers.get("content-type")?.startsWith("application/json"))throw new ContactError(415,"Please use the project inquiry form.");
   if(Number(request.headers.get("content-length"))>16384)throw new ContactError(413,"Your message is too large.");
   const input=validateContact(await readBody(request));
   if(!contactConfigured(env))throw new ContactError(503,"Project inquiries are not available yet. Please check back soon.");
   if(env.turnstileSecret){
     if(!input.token)throw new ContactError(400,"Please complete the verification.");
     const verify=await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:env.turnstileSecret,response:input.token}),signal:AbortSignal.timeout(8000)});
     if(!verify.ok)throw new ContactError(503,"Verification is temporarily unavailable.");
     const result=await verify.json();
     if(!result.success||result.hostname!==new URL(expected).hostname||result.action!=="contact")throw new ContactError(400,"Verification expired. Please try again.");
   }
   // Only trust an IP header that your deployment proxy overwrites.
   const ip=env.trustedIpHeader?request.headers.get(env.trustedIpHeader)?.split(",")[0]?.trim():undefined;
   await rateLimit("email:"+input.email.toLowerCase(),env,fetcher);
   if(ip)await rateLimit("ip:"+ip,env,fetcher);
   const result=await fetcher("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${env.apiKey}`,"Content-Type":"application/json","Idempotency-Key":createHash("sha256").update(input.email+input.startedAt+input.message).digest("hex")},body:JSON.stringify({from:env.from,to:[env.to],reply_to:input.email,subject:`SMACKQ — ${input.projectType}`,text:`Name: ${input.name}\nEmail: ${input.email}\nProject: ${input.projectType}\nBudget: ${input.budget||"Not specified"}\n\n${input.message}`}),signal:AbortSignal.timeout(10000)});
   if(!result.ok)throw new ContactError(502,"Your message could not be delivered. Please try again later.");
   const receipt=await result.json();if(typeof receipt.id!=="string"||!receipt.id)throw new ContactError(502,"Delivery could not be confirmed. Please try again later.");
   return response({ok:true,message:"Your inquiry has been accepted for delivery. Thank you — we’ll be in touch."},200);
 }catch(error){
   if(error instanceof ContactError)return response({ok:false,message:error.message},error.status);
   return response({ok:false,message:"Message delivery is temporarily unavailable. Please try again later."},503);
 }
}
