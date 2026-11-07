import type {Product} from './data'

export const colorKey=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('it-IT')

export function availableProductColors(product:Product):string[]{
 const all=[...(product.colors||[]),...(product.variants||[]).map(v=>v.color),...(product.colorImages||[]).map(i=>i.color)]
 const seen=new Set<string>()
 return all.filter(c=>{const key=colorKey(c||'');if(!key||seen.has(key))return false;seen.add(key);return true})
}

export function galleryForColor(product:Product,color:string):string[]{
 const target=colorKey(color)
 const matched=(product.colorImages||[]).filter(item=>colorKey(item.color)===target).map(item=>item.url)
 if(matched.length)return [...new Set(matched)]
 const neutral=product.images||[]
 if(neutral.length)return [...new Set(neutral)]
 // If another variant has its own images, never show its photo for this color.
 if((product.colorImages||[]).length)return ['/delu-logo.svg']
 return [product.image||'/delu-logo.svg']
}
