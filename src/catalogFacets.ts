import type {Product} from './data'
import {availableProductColors} from './productColorGallery'
import {fieldLabels} from '../shared/catalog'

/** One canonical comparison for manually entered catalogue filter values.
 * Preserve merchant spelling for display; ignore case, diacritics and repeated whitespace. */
export const filterKey=(value:string):string=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('it-IT')

export const facetValues=(product:Product,key:string):string[]=>{
 const attr=product.attributes
 let values:string[]
 if(key==='color')values=availableProductColors(product)
 else if(key==='size')values=[...(product.sizes||[]),...(product.variants||[]).map(v=>v.size)]
 else if(key==='fabric'){
  values=[...(product.fabrics||[]),...Object.values(attr?.compositions||{}).flatMap(parts=>Array.isArray(parts)?parts.map(p=>p.material):[])]
 }else{
  const entries=attr?.values?.[key]
  values=Array.isArray(entries)?entries:[]
 }
 const seen=new Set<string>()
 return values.filter(v=>typeof v==='string'&&!!filterKey(v)).map(v=>v.trim()).filter(v=>{const k=filterKey(v);if(seen.has(k))return false;seen.add(k);return true})
}

export const facetOptions=(products:Product[],key:string):string[]=>{
 const found=new Map<string,string>()
 for(const product of products)for(const value of facetValues(product,key)){
  const normal=filterKey(value)
  if(!found.has(normal))found.set(normal,value)
 }
 return [...found.values()].sort((a,b)=>a.localeCompare(b,'it',{sensitivity:'base'}))
}

/** Show exactly the supported attributes merchants actually populated, not a
 * restricted hardcoded subset. Empty attributes never become empty filter sections. */
export const availableFacetKeys=(products:Product[]):string[]=>{
 const attrs=Object.keys(fieldLabels).filter(key=>products.some(p=>facetValues(p,key).length>0))
 return ['color','size','fabric',...attrs].filter(key=>products.some(p=>facetValues(p,key).length>0))
}

export type SelectedFacets=Record<string,string[]>
export const productMatchesFacets=(product:Product,selected:SelectedFacets,except?:string):boolean=>
 Object.entries(selected).every(([key,choices])=>key===except||!choices.length||
  choices.some(choice=>facetValues(product,key).some(value=>filterKey(choice)===filterKey(value))))

export const matchingColor=(product:Product,choices:string[]):string|undefined=>
 choices.map(v=>facetValues(product,'color').find(c=>filterKey(c)===filterKey(v))).find(Boolean)
