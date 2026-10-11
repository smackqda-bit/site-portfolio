import type { ContactEnv } from "./contact";
export function getContactEnv():ContactEnv{return {
 siteUrl:process.env.NEXT_PUBLIC_SITE_URL||"",apiKey:process.env.RESEND_API_KEY||"",
 from:process.env.CONTACT_FROM_EMAIL||"",to:process.env.CONTACT_TO_EMAIL||"",
 turnstileSecret:process.env.TURNSTILE_SECRET_KEY||"",turnstileSiteKey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||"",
 redisUrl:process.env.UPSTASH_REDIS_REST_URL||"",redisToken:process.env.UPSTASH_REDIS_REST_TOKEN||"",
 production:process.env.NODE_ENV==="production",trustedIpHeader:process.env.CONTACT_TRUSTED_IP_HEADER||"",
};}
