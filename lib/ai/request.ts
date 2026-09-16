import { z } from 'zod';
export const chatSchema = z.object({
 messages:z.array(z.object({
  role:z.enum(['user','assistant']), content:z.string().max(8000).optional(),
  parts:z.array(z.object({type:z.string(),text:z.string().max(8000).optional()}).passthrough()).max(60).optional(),
 }).passthrough()).min(1).max(24),
 locale:z.enum(['en','de','de-CH','lb-LU','es','hi-IN','fr']).default('en'),
 model:z.enum(['openai/gpt-oss-120b','qwen/qwen3-32b','llama-3.3-70b-versatile']).optional(),
});
export function messageText(message: {content?:string;parts?:{type:string;text?:string}[]}) {
 return message.content || message.parts?.filter(p=>p.type==='text').map(p=>p.text||'').join('') || '';
}
