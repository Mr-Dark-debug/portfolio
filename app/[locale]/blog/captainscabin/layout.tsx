import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isAdminAuthorized } from '@/lib/admin-auth';
export default async function AdminLayout({children}:{children:React.ReactNode}){const h=await headers();if(!isAdminAuthorized(new Request('https://prashant.sbs',{headers:h})))notFound();return children;}
