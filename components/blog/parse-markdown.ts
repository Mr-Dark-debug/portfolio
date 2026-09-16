import * as YAML from 'js-yaml';
export function parseMarkdown(raw:string){
 const match=raw.replace(/\r\n/g,'\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
 if(!match)return null;
 const data=YAML.load(match[1],{schema:YAML.JSON_SCHEMA}) as Record<string,unknown>;
 return {title:String(data.title||''),excerpt:String(data.excerpt||''),tags:Array.isArray(data.tags)?data.tags.map(String):[],published:data.published===true,image:String(data.image||''),date:String(data.date||'').slice(0,10),content:match[2].trim()};
}
