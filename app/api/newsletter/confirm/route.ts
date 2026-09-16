import { createHash } from 'node:crypto';
import { database } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
export async function POST(req:Request){
 const limited=await rateLimit(req,'confirm',10,600);if(limited)return limited;
 const body=await req.json().catch(()=>null);
 if(!body || !/^[a-f0-9]{64}$/.test(body.token) || !['confirm','unsubscribe'].includes(body.action))return Response.json({error:'Invalid confirmation link.'},{status:400});
 const sql=database();if(!sql)return Response.json({error:'Newsletter unavailable.'},{status:503});
 const hash=createHash('sha256').update(body.token).digest('hex');
 try{
  if(body.action==='unsubscribe'){await sql`delete from portfolio_subscribers where token_hash=${hash}`;return Response.json({message:'Subscription removed.'});}
  const rows=await sql`update portfolio_subscribers set confirmed_at=coalesce(confirmed_at,now()) where token_hash=${hash} and (expires_at>now() or confirmed_at is not null) returning email`;
  if(!rows.length)return Response.json({error:'This link has expired. Please subscribe again.'},{status:400});
  return Response.json({message:'Your subscription is confirmed. Thank you.'});
 }catch{return Response.json({error:'Please try again later.'},{status:503});}
}
