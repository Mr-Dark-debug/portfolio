import { it,expect,vi } from 'vitest';
vi.mock('../lib/blog/utils',()=>({getAllPosts:async()=>[],getPostBySlug:async()=>null}));
import { searchKnowledge } from '../lib/ai/knowledge';
it('finds projects from conversational questions rather than exact phrases',async()=>{const results=await searchKnowledge('Can you tell me about PocketLLM and offline inference?');expect(results.some(r=>r.title.includes('PocketLLM'))).toBe(true);expect(results[0].url).toContain('/projects/pocketllm');});
it('retrieves CV experience and skills',async()=>{const results=await searchKnowledge('What experience does he have with FastAPI and RAG?');expect(results.some(r=>r.url.endsWith('/resume'))).toBe(true);});
it('retrieves research results with source links',async()=>{const results=await searchKnowledge('SetFit paper reproduction accuracy');expect(results[0].url).toContain('/projects/setfit-reproduction');expect(results[0].text).toContain('88.61');});
