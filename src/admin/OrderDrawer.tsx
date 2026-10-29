import { useState } from 'react'
import { Truck, X } from 'lucide-react'
import { motion } from 'motion/react'
import { api, money, type ApiOrder } from './shared'

export default function OrderDrawer({order,onClose,onSaved}:{order:ApiOrder;onClose:()=>void;onSaved:(o:ApiOrder)=>void}){
  const[status,setStatus]=useState(order.status)
  const[carrier,setCarrier]=useState(order.fulfillment?.carrier||'')
  const[trackingCode,setTrackingCode]=useState(order.fulfillment?.trackingCode||'')
  const[trackingUrl,setTrackingUrl]=useState(order.fulfillment?.trackingUrl||'')
  const[loading,setLoading]=useState(false),[error,setError]=useState('')
  async function save(){
    setLoading(true);setError('')
    try{
      await api(`/api/admin/orders/${order.id}`,{method:'PATCH',body:JSON.stringify({status,fulfillment:{carrier,trackingCode,trackingUrl}})})
      onSaved({...order,status,fulfillment:{carrier,trackingCode,trackingUrl}})
    }catch(e:any){setError(e.message)}finally{setLoading(false)}
  }
  return <>
    <motion.div className="drawer-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
    <motion.aside className="product-form order-drawer" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}>
      <div className="drawer-head"><div><span>ORDINE</span><b>#{order.id}</b></div><button className="icon-btn" onClick={onClose}><X/></button></div>
      <div className="form-scroll">
        <div className="order-detail-block"><span>CLIENTE</span><h3>{order.customer}</h3><a href={`mailto:${order.email}`}>{order.email}</a>{order.phone&&<a href={`tel:${order.phone}`}>{order.phone}</a>}</div>
        <div className="order-detail-block"><span>SPEDIZIONE</span><p>{order.shipping?.address}<br/>{order.shipping?.postcode} {order.shipping?.city} {order.shipping?.province}<br/><b>{order.shipping?.country}</b></p><small>Costo: {money(Number(order.shipping?.cost||0))}</small></div>
        <div className="order-detail-block"><span>ARTICOLI</span>{order.items.map((i:any,n)=><div className="order-item-detail" key={n}><div><b>{i.name}</b><small>{i.color} · {i.size} · × {i.qty}</small></div><strong>{money(Number(i.unitPrice||0)*Number(i.qty||1))}</strong></div>)}</div>
        {order.notes&&<div className="order-detail-block"><span>NOTE</span><p>{order.notes}</p></div>}
        <div className="order-detail-block"><span>GESTIONE</span>
          <label>Stato<select value={status} onChange={e=>setStatus(e.target.value)}>{['Pagamento in attesa','Pagamento fallito','Pagato - verifica stock','Nuovo','In preparazione','Spedito','Completato','Annullato'].map(s=><option key={s}>{s}</option>)}</select></label>
          <div className="form-grid"><label>Corriere<input value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="BRT, GLS, DHL…"/></label><label>Codice tracking<input value={trackingCode} onChange={e=>setTrackingCode(e.target.value)}/></label></div>
          <label>Link tracking<input value={trackingUrl} onChange={e=>setTrackingUrl(e.target.value)} placeholder="https://..."/></label>
        </div>
        {error&&<div className="form-error">{error}</div>}
      </div>
      <button type="button" className="save-product" disabled={loading} onClick={save}><Truck/>{loading?'SALVATAGGIO…':'SALVA ORDINE'}</button>
    </motion.aside>
  </>
}
