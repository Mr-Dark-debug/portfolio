import { contactSchema } from '@/lib/contact';
import { rateLimit } from '@/lib/rate-limit';
import { requestSubscription } from '@/lib/newsletter';
export async function POST(req:Request){
 const limited=await rateLimit(req,'contact',5,600);if(limited)return limited;
 let body:unknown;try{const text=await req.text();if(text.length>15000)return Response.json({error:'Request too large'},{status:413});body=JSON.parse(text);}catch{return Response.json({error:'Invalid JSON'},{status:400});}
 const parsed=contactSchema.safeParse(body);if(!parsed.success)return Response.json({error:'Please check the form. The message must be between 10 and 5,000 characters.'},{status:400});
 const {name,email,subject,message,subscribe}=parsed.data;
 try{
  const response=await fetch('https://formspree.io/f/'+(process.env.FORMSPREE_FORM_ID||'mwvyznvj'),{
   method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
   body:JSON.stringify({name,email,subject,message}),signal:AbortSignal.timeout(15000),
  });
  if(!response.ok)throw new Error('Delivery failed');
  let newsletter='not_requested';
  if(subscribe){try{await requestSubscription(email);newsletter='confirmation_sent';}catch{newsletter='unavailable';}}
  return Response.json({message:'Your message was submitted successfully.',newsletter});
 }catch{return Response.json({error:'The message could not be delivered. Please email prashantc592114@gmail.com.'},{status:503});}
}
