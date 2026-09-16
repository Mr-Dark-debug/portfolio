import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { NewsletterConfirm } from '@/components/newsletter-confirm';
export const metadata={title:'Email subscription',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Page({params,searchParams}:{params:Promise<{locale:string;action:string}>;searchParams:Promise<{token?:string}>}){const {locale,action}=await params;const {token=''}=await searchParams;if(action!=='confirm'&&action!=='unsubscribe')notFound();return <PageShell locale={locale}><h1 className="page-title">{action==='confirm'?'One last step.':'Email preferences.'}</h1><NewsletterConfirm token={token} action={action}/></PageShell>;}
