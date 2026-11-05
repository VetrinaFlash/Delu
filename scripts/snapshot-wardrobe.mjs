/**
 * DELÙ preview catalogue snapshot.
 *
 * Cloudflare Pages preview functions have no production D1 binding, and
 * cross-worker fetch to a production Pages domain in the same zone has
 * proven unreliable (503). Read the existing public /api/products at BUILD
 * TIME instead. The resulting JSON is public, read-only and sanitised.
 *
 * In production the wardrobe fetches /api/products on each visit; in
 * preview it fetches this snapshot and links purchases to production.
 */
import {mkdir,writeFile} from 'node:fs/promises'
import {join} from 'node:path'

const origin='https://delu-49u.pages.dev/api/products'
const destination=join(process.cwd(),'public','wardrobe-catalog.json')
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
let error
for(let attempt=1;attempt<=4;attempt++){
 try{
  const res=await fetch(origin,{headers:{accept:'application/json','user-agent':'delu-preview-build/1.0'},redirect:'error',signal:AbortSignal.timeout(15000)})
  if(!res.ok||!res.headers.get('content-type')?.includes('application/json'))throw Error('HTTP '+res.status+' invalid response')
  const body=await res.json()
  if(!Array.isArray(body))throw Error('Catalogue must be an array')
  const product=body.map(p=>{
   if(!p||typeof p!=='object'||typeof p.id!=='string'||typeof p.name!=='string'||!Number.isFinite(p.price)||!Number.isInteger(p.stock))return null
   const image=typeof p.image==='string'?p.image.trim():''
   if(!image||(!image.startsWith('https://')&&!image.startsWith('/')))return null
   return {
    id:p.id.slice(0,120),name:p.name.slice(0,220),
    category:String(p.category||'').slice(0,100),
    price:p.price,stock:p.stock,
    active:p.active!==false,new:p.new===true,featured:p.featured===true,
    image,description:String(p.description||'').slice(0,5000),
    colors:Array.isArray(p.colors)?p.colors.slice(0,40):[],
    sizes:Array.isArray(p.sizes)?p.sizes.slice(0,40):[],
    tags:Array.isArray(p.tags)?p.tags.slice(0,40):[],
    variants:Array.isArray(p.variants)?p.variants.slice(0,120).map(v=>({
     color:String(v?.color||''),size:String(v?.size||''),stock:Number(v?.stock)||0
    })):[],
    images:Array.isArray(p.images)?p.images.slice(0,12).filter(x=>typeof x==='string'):[],
    imageAlt:typeof p.imageAlt==='string'?p.imageAlt.slice(0,250):''
   }
  }).filter(Boolean)
  if(!product.length)throw Error('No valid public products returned: refusing empty preview')
  await mkdir(join(process.cwd(),'public'),{recursive:true})
  await writeFile(destination,JSON.stringify({source:'DELU-public-D1',fetchedAt:new Date().toISOString(),products:product}))
  console.log('Wardrobe preview snapshot: '+product.length+' public products, '+product.filter(p=>p.active&&p.stock>0).length+' available; source '+origin)
  error=undefined
  break
 }catch(e){error=e;console.warn('Catalogue snapshot attempt '+attempt+'/4: '+String(e));if(attempt<4)await sleep(attempt*1500)}
}
if(error)throw Error('Could not build the DELÙ wardrobe snapshot from the public shop: '+String(error))
