import type { Product } from '../data'

export type ApiOrder={
  id:string;customer:string;email:string;phone:string;total:number;status:string;items:any[];
  shipping:any;notes:string;createdAt:string;
  fulfillment?:{carrier:string;trackingCode:string;trackingUrl:string}
}
export type Tab='dashboard'|'products'|'orders'|'settings'|'customers'
export const money=(n:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n)
export const split=(v:string)=>[...new Map(v.split(/[,;\n]+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean).map(x=>[x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it-IT'),x])).values()]

export async function api<T=any>(url:string,init?:RequestInit):Promise<T>{
  const isForm=typeof FormData!=='undefined'&&init?.body instanceof FormData
  const response=await fetch(url,{credentials:'include',...init,headers:{...(isForm?{}:{'content-type':'application/json'}),...(init?.headers||{})}})
  const data=await response.json().catch(()=>{throw new Error('Risposta del servizio non valida. Riprova più tardi.')})
  if(!response.ok)throw new Error(data.error||'Operazione non riuscita')
  return data
}

export function upsertProduct(list:Product[],product:Product){return list.some(x=>x.id===product.id)?list.map(x=>x.id===product.id?product:x):[product,...list]}

