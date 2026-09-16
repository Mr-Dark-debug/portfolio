import { createHash, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { database } from '@/lib/db';
import { getPostBySlug } from '@/lib/blog/utils';
import { rateLimit } from '@/lib/rate-limit';
type Props={params:Promise<{slug:string}>};
export async function GET(_req:Request,{params}:Props){
 const {slug}=await params;if(!await getPostBySlug(slug))return Response.json({error:'Not found'},{status:404});
 const sql=database();if(!sql)return Response.json({available:false});
 try{const rows=await sql`select kind,count(*)::integer as count from portfolio_reactions where slug=${slug} group by kind`;return Response.json({available:true,views:rows.find(r=>r.kind==='view')?.count||0,claps:rows.find(r=>r.kind==='clap')?.count||0});}catch{return Response.json({error:'Reactions unavailable'},{status:503});}
}
export async function POST(req:Request,{params}:Props){
 const limited=await rateLimit(req,'reactions',30,600);if(limited)return limited;
 const {slug}=await params;if(!await getPostBySlug(slug))return Response.json({error:'Not found'},{status:404});
 const body=await req.json().catch(()=>null);if(!['view','clap'].includes(body?.kind))return Response.json({error:'Invalid reaction'},{status:400});
 const sql=database();if(!sql)return Response.json({error:'Reactions are unavailable'},{status:503});
 const jar=await cookies();let visitor=jar.get('portfolio-reader')?.value;
 if(!visitor||!/^[a-f0-9-]{36}$/.test(visitor)){visitor=randomUUID();jar.set('portfolio-reader',visitor,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:31536000,path:'/'});}
 const hash=createHash('sha256').update(visitor).digest('hex');
 try{await sql`insert into portfolio_reactions (slug,visitor,kind) values (${slug},${hash},${body.kind}) on conflict do nothing`;return GET(req,{params});}catch{return Response.json({error:'Could not save reaction'},{status:503});}
}
