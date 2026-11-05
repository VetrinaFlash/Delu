/**
 * Read-only bridge for Cloudflare Pages preview deployments.
 *
 * Pages preview and production environments can have different D1 bindings.
 * This preview-only route exposes only the already-public catalogue from the
 * canonical production site. No customer data, cookies, secrets, mutations or
 * payment requests are forwarded.
 */
const productionProducts='https://delu-49u.pages.dev/api/products'
const previewHostname=/^(?:[a-z0-9-]+\.)+delu-49u\.pages\.dev$/
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'}
const failure=()=>Response.json({error:'Il catalogo non è disponibile in questa preview.'},{status:503,headers})
export async function onRequestGet(context:{request:Request}):Promise<Response>{
 const host=new URL(context.request.url).hostname.toLowerCase()
 if(!previewHostname.test(host))return new Response('Not found',{status:404,headers})
 try{
  const upstream=await fetch(productionProducts,{method:'GET',headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(8000)})
  if(!upstream.ok||!upstream.headers.get('content-type')?.includes('application/json'))return failure()
  const source:unknown=await upstream.json()
  if(!Array.isArray(source))return failure()
  const sanitized=source.slice(0,100).filter((p:any)=>
   p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.image==='string'&&
   Number.isFinite(p.price)&&Number.isInteger(p.stock)&&p.price>=0&&p.stock>=0
  ).map((p:any)=>({
   id:p.id,name:p.name,category:String(p.category||''),price:p.price,compareAt:p.compareAt??undefined,
   image:p.image,imageAlt:p.imageAlt||'',images:Array.isArray(p.images)?p.images.slice(0,12):[],
   description:String(p.description||''),stock:p.stock,active:p.active!==false,
   colors:Array.isArray(p.colors)?p.colors.slice(0,30):[],
   sizes:Array.isArray(p.sizes)?p.sizes.slice(0,30):[],
   tags:Array.isArray(p.tags)?p.tags.slice(0,30):[],
   fabrics:Array.isArray(p.fabrics)?p.fabrics.slice(0,30):[],
   variants:Array.isArray(p.variants)?p.variants.slice(0,100):[],
   featured:!!p.featured,new:!!p.new
  }))
  return Response.json(sanitized,{headers})
 }catch{
  return failure()
 }
}
