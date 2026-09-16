import { describe, it, expect, vi } from 'vitest';
vi.mock('../lib/blog/storage',()=>({
 validSlug:(s:string)=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s),
 storedPosts:async()=>[
  {slug:'public-post',draft:false,markdown:'---\ntitle: Public\ndate: 2025-01-01\npublished: true\n---\n## Hello\n\n<script>alert(1)</script>\n\n[Bad](javascript:alert(1))\n\n## Hello'},
  {slug:'secret-draft',draft:true,markdown:'---\ntitle: Secret\ndate: 2025-01-01\npublished: true\n---\nSecret content'},
  {slug:'future-post',draft:false,markdown:'---\ntitle: Future\ndate: 2099-01-01\npublished: true\n---\nScheduled'},
  {slug:'unpublished',draft:false,markdown:'---\ntitle: Unpublished\ndate: 2025-01-01\npublished: false\n---\nHidden'},
 ],persistPost:vi.fn(),removePost:vi.fn(),
}));
import { getAllPosts,getPostBySlug,extractTableOfContents,getAdjacentPosts } from '../lib/blog/utils';
describe('public blog content',()=>{
 it('excludes draft, unpublished and scheduled posts',async()=>expect((await getAllPosts()).map(p=>p.slug)).toEqual(['public-post']));
 it.each(['secret-draft','future-post','unpublished','../public-post'])('does not leak %s through direct lookup',async slug=>expect(await getPostBySlug(slug)).toBeNull());
 it('allows an explicit internal admin read',async()=>expect((await getPostBySlug('secret-draft',true))?.title).toBe('Secret'));
 it('strips executable HTML and assigns unique heading IDs',async()=>{const p=await getPostBySlug('public-post');expect(p?.content).not.toContain('<script');expect(p?.content).not.toContain('javascript:');expect(extractTableOfContents(p!.content).map(h=>h.id)).toEqual(['hello','hello-1']);});
 it('has no adjacent posts for unknown slugs',async()=>expect(await getAdjacentPosts('missing')).toEqual({previous:null,next:null}));
});
