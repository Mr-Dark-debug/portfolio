import { database } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){
 try{const sql=database();if(sql)await sql`select 1`;
 return Response.json({status:'ok',revision:process.env.VERCEL_GIT_COMMIT_SHA||'local',services:{storage:sql?'postgres':'bundled-read-only',chat:!!process.env.GROQ_API_KEY,newsletter:!!(sql&&process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),images:!!process.env.BLOB_READ_WRITE_TOKEN,monitoring:!!process.env.SENTRY_DSN}},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({status:'degraded'},{status:503});}
}
