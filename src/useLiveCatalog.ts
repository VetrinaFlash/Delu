import {useEffect,useState} from 'react'
import {useLocation} from 'react-router-dom'
import type {Product} from './data'

/** Shop, detail page and filters share the public D1 catalogue.
 * Never use development demo products as a fallback in production. */
export function useLiveCatalog(){
 const {pathname}=useLocation()
 const [products,setProducts]=useState<Product[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState(false)
 useEffect(()=>{
  const controller=new AbortController()
  setLoading(true);setError(false)
  fetch('/api/products',{signal:controller.signal,cache:'no-store',headers:{accept:'application/json'}})
    .then(async r=>{if(!r.ok)throw Error('Catalog unavailable');const data:unknown=await r.json();if(!Array.isArray(data))throw Error('Invalid catalog');return data as Product[]})
    .then(rows=>{if(!controller.signal.aborted)setProducts(rows.filter(row=>row&&typeof row.id==='string'&&typeof row.name==='string'&&Array.isArray(row.colors)&&Array.isArray(row.sizes)&&row.active!==false))})
    .catch(()=>{if(!controller.signal.aborted)setError(true)})
    .finally(()=>{if(!controller.signal.aborted)setLoading(false)})
  return()=>controller.abort()
 },[pathname])
 return{products,loading,error}
}
