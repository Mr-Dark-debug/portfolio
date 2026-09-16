import { z } from 'zod';
export const contactSchema=z.object({name:z.string().trim().min(1).max(100),email:z.string().trim().email().max(254),subject:z.string().trim().min(1).max(200).refine(v=>!/[\r\n]/.test(v)),message:z.string().trim().min(10).max(5000),subscribe:z.boolean().default(false),website:z.string().max(0).optional()});
