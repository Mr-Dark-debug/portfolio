"use client";
import { useEffect, useRef, useState } from 'react';
export function PostEngagement({slug}:{slug:string}){
 const [counts,setCounts]=useState<{available?:boolean;views?:number;claps?:number}>({});const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const comments=useRef<HTMLDivElement>(null);const [loadComments,setLoadComments]=useState(false);
 useEffect(()=>{let active=true;fetch(`/api/blog/reactions/${slug}`).then(r=>r.json()).then(async data=>{if(active)setCounts(data);if(data.available){const r=await fetch(`/api/blog/reactions/${slug}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'view'})});if(r.ok&&active)setCounts(await r.json());}}).catch(()=>{});return()=>{active=false;};},[slug]);
 useEffect(()=>{
  if(!loadComments||!comments.current||!process.env.NEXT_PUBLIC_GISCUS_REPO_ID||!process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID)return;
  const element=comments.current; const script=document.createElement('script');script.src='https://giscus.app/client.js';script.async=true;script.crossOrigin='anonymous';
  const attrs={repo:'Mr-Dark-debug/portfolio','repo-id':process.env.NEXT_PUBLIC_GISCUS_REPO_ID,'category-id':process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,mapping:'specific',term:slug,strict:'1','reactions-enabled':'0','emit-metadata':'0','input-position':'top',theme:'dark',lang:'en'};
  for(const [key,value]of Object.entries(attrs))script.setAttribute('data-'+key,value);
  element.appendChild(script);return()=>{element.replaceChildren();};
 },[loadComments,slug]);
 return <div><div className="flex flex-wrap items-center gap-4">{counts.available&&<><span className="text-sm text-slate-400">{counts.views} readers</span><button className="outline-button" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch(`/api/blog/reactions/${slug}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'clap'})});if(!r.ok)throw new Error();setCounts(await r.json());setMessage('Thanks for reading!');}catch{setMessage('Could not save your reaction.');}finally{setBusy(false);}}}>👏 {counts.claps} · Appreciate</button></>}<a className="outline-button" href={`https://github.com/Mr-Dark-debug/portfolio/discussions`}>Discuss on GitHub ↗</a></div><p className="mt-3 text-sm" role="status">{message}</p>{process.env.NEXT_PUBLIC_GISCUS_REPO_ID&&<button className="outline-button mt-4" onClick={()=>setLoadComments(true)}>Load comments from GitHub</button>}<div ref={comments}/></div>;
}
