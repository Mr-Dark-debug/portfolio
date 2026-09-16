import { config } from 'dotenv';
import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
config({path:'.env.local',quiet:true});
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL before running migration');
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});
try{await sql.unsafe(await readFile('migrations/001_portfolio.sql','utf8'));console.log('Portfolio schema migrated.');}finally{await sql.end();}
