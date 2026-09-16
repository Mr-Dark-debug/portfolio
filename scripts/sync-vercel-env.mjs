import { config } from 'dotenv';
import { randomBytes } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
config({path:'.env.local',quiet:true});
if(!process.env.GROQ_API_KEY)throw new Error('Missing local Groq key');
const check=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`}});
if(!check.ok)throw new Error('Groq key validation failed');
let secret=process.env.ADMIN_SECRET;
if(!secret){secret=randomBytes(32).toString('hex');await appendFile('.env.local',`\nADMIN_SECRET=${secret}\n`);}
for(const [action,name,value] of [['update','GROQ_API_KEY',process.env.GROQ_API_KEY],['add','ADMIN_SECRET',secret]]){
 for(const environment of ['production','preview']){
  const args=['vercel','env',action,name,environment,'--yes'];
  const result=spawnSync('npx.cmd',args,{input:value,encoding:'utf8',shell:true,windowsHide:true});
  if(result.status!==0){console.error(`Could not ${action} ${name} in ${environment}.`);process.exitCode=1;}else console.log(`${name} synchronized to ${environment}.`);
 }
}
