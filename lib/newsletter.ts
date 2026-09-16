import { createHash, randomBytes } from 'node:crypto';
import { database } from './db';
import { sendEmail } from './email';
import { SITE_URL } from './site';
export async function requestSubscription(email: string) {
 const sql=database();
 if(!sql || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Newsletter is not available yet. Follow the RSS feed for new posts.');
 const token=randomBytes(32).toString('hex');
 const hash=createHash('sha256').update(token).digest('hex');
 const existing=await sql`select confirmed_at from portfolio_subscribers where email=${email}`;
 if(existing[0]?.confirmed_at)return;
 await sql`insert into portfolio_subscribers (email,token_hash,expires_at) values (${email},${hash},now()+interval '24 hours') on conflict (email) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at`;
 await sendEmail(email,'Confirm your subscription to Prashant’s field notes',`Please confirm your subscription within 24 hours: ${SITE_URL}/en/newsletter/confirm?token=${token}\n\nIf you did not request this, ignore this email.\nUnsubscribe or cancel: ${SITE_URL}/en/newsletter/unsubscribe?token=${token}`);
}
