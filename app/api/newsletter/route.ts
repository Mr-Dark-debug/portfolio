import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { requestSubscription } from '@/lib/newsletter';
export async function POST(req:Request){
 const limited=await rateLimit(req,'newsletter',3,3600);if(limited)return limited;
 const body=await req.json().catch(()=>null);
 const parsed=z.object({email:z.string().trim().toLowerCase().email().max(254),website:z.string().max(0).optional()}).safeParse(body);
 if(!parsed.success)return Response.json({error:'Enter a valid email address.'},{status:400});
 try{await requestSubscription(parsed.data.email);return Response.json({message:'Check your inbox to confirm your subscription.'});}
 catch{return Response.json({error:'Email subscriptions are currently unavailable. Please use the RSS feed.'},{status:503});}
}
