import type { Product } from '../data'

export type ApiOrder={
  id:string;customer:string;email:string;phone:string;total:number;status:string;items:any[];
  shipping:any;notes:string;createdAt:string;
  fulfillment?:{carrier:string;trackingCode:string;trackingUrl:string}
}
export type Tab='dashboard'|'products'|'orders'|'settings'
export const money=(n:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n)
export const split=(v:string)=>v.split(',').map(x=>x.trim()).filter(Boolean)

export async function api<T=any>(url:string,init?:RequestInit):Promise<T>{
  const isForm=typeof FormData!=='undefined'&&init?.body instanceof FormData
  const response=await fetch(url,{credentials:'include',...init,headers:{...(isForm?{}:{'content-type':'application/json'}),...(init?.headers||{})}})
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(data.error||'Operazione non riuscita')
  return data
}

export function upsertProduct(list:Product[],product:Product){return list.some(x=>x.id===product.id)?list.map(x=>x.id===product.id?product:x):[product,...list]}
