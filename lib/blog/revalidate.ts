import { revalidatePath } from 'next/cache';
export function refreshBlog(){
 revalidatePath('/[locale]/blog','page');revalidatePath('/[locale]/blog/posts/[slug]','page');
 for(const path of ['/sitemap.xml','/rss.xml','/llms.txt','/api/rss'])revalidatePath(path);
}
