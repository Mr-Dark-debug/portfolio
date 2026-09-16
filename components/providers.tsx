"use client";
import { ThemeProvider } from 'next-themes';
import { MotionConfig } from 'framer-motion';
import { Analytics, track } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect } from 'react';
export function Providers({children}:{children:React.ReactNode}) {
 useEffect(()=>{
  const click=(event:MouseEvent)=>{ const link=(event.target as HTMLElement).closest('a'); if(!link)return; const href=link.getAttribute('href')||''; const name=link.dataset.track || (href.startsWith('https://github.com/')?'repo_click':href.includes('/resume/')?'resume_download':null); if(name)track(name); };
  document.addEventListener('click',click);return()=>document.removeEventListener('click',click);
 },[]);
 return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem><MotionConfig reducedMotion="user">{children}</MotionConfig><Analytics/><SpeedInsights/></ThemeProvider>;
}
