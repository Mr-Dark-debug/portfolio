import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { locales } from '@/navigation';
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:'*',allow:'/',disallow:['/api/','/blog/captainscabin',...locales.flatMap(l=>[`/${l}/blog/captainscabin`,`/${l}/newsletter/`])]}],sitemap:`${SITE_URL}/sitemap.xml`,host:SITE_URL};}
