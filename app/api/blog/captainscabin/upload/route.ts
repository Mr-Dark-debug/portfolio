import { put } from '@vercel/blob';
import { isAdminAuthorized, adminUnauthorized } from '@/lib/admin-auth';
import { rateLimit } from '@/lib/rate-limit';
export async function POST(req:Request){
 if(!isAdminAuthorized(req))return adminUnauthorized();const limited=await rateLimit(req,'upload',15,600);if(limited)return limited;
 if(!process.env.BLOB_READ_WRITE_TOKEN)return Response.json({error:'Image storage is not configured.'},{status:503});
 try{const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||file.size>4*1024*1024||!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))return Response.json({error:'Choose a PNG, JPEG, WebP or AVIF image below 4 MB.'},{status:400});
 const name=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const blob=await put(`blog/${name}`,file,{access:'public',addRandomSuffix:true,contentType:file.type});return Response.json({url:blob.url});
 }catch{return Response.json({error:'Upload failed.'},{status:503});}
}
