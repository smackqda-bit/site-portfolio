import test from "node:test";
import assert from "node:assert/strict";
import { handleContact, validateContact, contactConfigured, type ContactEnv } from "../src/lib/contact";

const base:ContactEnv={siteUrl:"https://studio.example",apiKey:"test-key",from:"Studio <studio@example.com>",to:"owner@example.com",turnstileSecret:"",turnstileSiteKey:"test-site-key",redisUrl:"",redisToken:"",production:false,trustedIpHeader:""};
let sequence=0;
function input(overrides:Record<string,unknown>={}){return {name:"Test Person",email:`person${sequence++}@example.com`,projectType:"Website",budget:"",message:"A thoughtful portfolio for a small architecture practice.",website:"",startedAt:Date.now()-5000,token:"",...overrides};}
function request(body:unknown,headers:Record<string,string>={}){return new Request("https://studio.example/api/contact",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://studio.example",...headers},body:JSON.stringify(body)});}
const provider=(status=200,payload:object={id:"email-test-id"})=>(async()=>Response.json(payload,{status})) as typeof fetch;

test("validates and trims legitimate inquiries",()=>{const data=validateContact(input({name:"  Ada  "}));assert.equal(data.name,"Ada");});
test("rejects invalid emails and header injection",()=>{for(const email of ["bad","a@example.com\r\nBcc: victim@example.com"])assert.throws(()=>validateContact(input({email})));});
test("rejects honeypot, unknown types, short messages and fast submissions",()=>{for(const patch of [{website:"spam"},{projectType:"made up"},{message:"short"},{startedAt:Date.now()}])assert.throws(()=>validateContact(input(patch)));});
test("rejects stale, invalid or future timestamps",()=>{for(const startedAt of [0,"invalid",Date.now()+10000])assert.throws(()=>validateContact(input({startedAt})));});
test("rejects missing and oversized fields",()=>{for(const patch of [{name:""},{message:"x".repeat(5001)},{budget:42}])assert.throws(()=>validateContact(input(patch)));});
test("rejects unexpected origins before delivery",async()=>{const res=await handleContact(request(input(),{Origin:"https://attacker.example"}),base,provider());assert.equal(res.status,403);});
test("rejects wrong content type",async()=>{const res=await handleContact(request(input(),{"Content-Type":"text/plain"}),base,provider());assert.equal(res.status,415);});
test("rejects invalid JSON",async()=>{const req=new Request("https://studio.example/api/contact",{method:"POST",headers:{Origin:base.siteUrl,"Content-Type":"application/json"},body:"{"});assert.equal((await handleContact(req,base,provider())).status,400);});
test("enforces body limit even without content-length",async()=>{assert.equal((await handleContact(request({payload:"x".repeat(20000)}),base,provider())).status,413);});
test("unconfigured backend never reports success",async()=>{const res=await handleContact(request(input()),{...base,apiKey:""},provider());assert.equal(res.status,503);assert.equal((await res.json()).ok,false);});
test("production fails closed without spam protection",()=>{assert.equal(contactConfigured({...base,production:true}),false);});
test("reports success only after provider acknowledgment",async()=>{let body:Record<string,unknown>={};const mock=(async(_url,init)=>{body=JSON.parse(String(init?.body));return Response.json({id:"accepted-123"});}) as typeof fetch;const data=input();const res=await handleContact(request(data),base,mock);assert.equal(res.status,200);assert.equal((await res.json()).ok,true);assert.equal(body.reply_to,data.email);assert.deepEqual(body.to,["owner@example.com"]);});
test("provider rejection does not report delivery",async()=>{const res=await handleContact(request(input()),base,provider(500,{error:"unavailable"}));assert.equal(res.status,502);assert.equal((await res.json()).ok,false);});
test("missing provider receipt does not report delivery",async()=>{assert.equal((await handleContact(request(input()),base,provider(200,{}))).status,502);});
test("network errors produce a retryable error",async()=>{const mock=(async()=>{throw new Error("offline")}) as typeof fetch;assert.equal((await handleContact(request(input()),base,mock)).status,503);});
test("local rate limiter blocks fourth inquiry",async()=>{const data=input();for(let i=0;i<3;i++)assert.equal((await handleContact(request(data),base,provider())).status,200);const res=await handleContact(request(data),base,provider());assert.equal(res.status,429);assert.equal(res.headers.get("Retry-After"),"900");});
test("production Turnstile validates hostname and action",async()=>{const env={...base,production:true,turnstileSecret:"secret",redisUrl:"https://redis.example",redisToken:"token"};const mock=(async()=>Response.json({success:true,hostname:"attacker.example",action:"contact"})) as typeof fetch;assert.equal((await handleContact(request(input({token:"challenge"})),env,mock)).status,400);});
test("production path validates challenge, uses shared limits and delivers",async()=>{const calls:string[]=[];const env={...base,production:true,turnstileSecret:"secret",redisUrl:"https://redis.example",redisToken:"token"};const mock=(async(url)=>{calls.push(String(url));if(String(url).includes("siteverify"))return Response.json({success:true,hostname:"studio.example",action:"contact"});if(String(url).includes("redis"))return Response.json({result:1});return Response.json({id:"accepted"});}) as typeof fetch;assert.equal((await handleContact(request(input({token:"challenge"})),env,mock)).status,200);assert.equal(calls.length,3);});
test("shared limiter fails closed when storage is unavailable",async()=>{const env={...base,redisUrl:"https://redis.example",redisToken:"token"};assert.equal((await handleContact(request(input()),env,provider(503))).status,503);});

test("missing public challenge key keeps form unavailable",()=>{assert.equal(contactConfigured({...base,turnstileSecret:"secret",turnstileSiteKey:""}),false);});
