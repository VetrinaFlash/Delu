import {useEffect,useState} from 'react'
import {Check,MessageCircle,Plus,Trash2} from 'lucide-react'
import {api,money} from './shared'

type Line={id:string;name:string;qty:number;unitPrice:number;color:string;size:string}
type CatalogProduct={id:string;name:string;price:number;colors:string[];sizes:string[]}
type Share={message:string;whatsappUrl:string;paymentUrl?:string}
type ReviewData={review:{state:string;reason?:string;version:number};items:Line[];shipping:{address:string;cost:number;discount:number};total:number;phone?:string;label?:{state:string;parcel_id?:string};share?:Share}
const stateLabels:Record<string,string>={REVIEW:'Da verificare',APPROVED:'Confermato · da pagare',PAYMENT:'Pagamento in corso',PAID:'Pagato',REJECTED:'Rifiutato'}
const toLine=(product:CatalogProduct):Line=>({id:product.id,name:product.name,qty:1,unitPrice:product.price,color:product.colors[0]||'',size:product.sizes[0]||''})

export default function OrderReview({id,onState}:{id:string;onState?:(state:string)=>void}){
 const [data,setData]=useState<ReviewData|null>(null),[items,setItems]=useState<Line[]>([]),[catalog,setCatalog]=useState<CatalogProduct[]>([])
 const [cost,setCost]=useState('0'),[discount,setDiscount]=useState('0'),[message,setMessage]=useState('')
 const [links,setLinks]=useState<Share|null>(null),[busy,setBusy]=useState(false),[methods,setMethods]=useState<{id:number;name:string}[]>([])
 const [rejecting,setRejecting]=useState(false),[reason,setReason]=useState('')
 async function load(){
  try{
   const next=await api<ReviewData>('/api/admin/order-requests/'+id)
   setData(next);onState?.(next.review.state)
   if(next.share)setLinks(next.share)
   setItems(next.items);setCost(String(next.shipping.cost||0));setDiscount(String(next.shipping.discount||0))
  }catch{/* Legacy orders use the standard order drawer. */}
 }
 useEffect(()=>{void load();api<CatalogProduct[]>('/api/admin/products').then(setCatalog).catch(()=>{})},[id])
 const state=data?.review.state
 useEffect(()=>{if(!state||state==='REVIEW')return;const timer=setInterval(load,8000);return()=>clearInterval(timer)},[state,id])
 useEffect(()=>{if(state==='PAID')api<typeof methods>('/api/admin/order-requests/'+id+'/methods').then(setMethods).catch(e=>setMessage(e.message))},[state,id])
 if(!data)return null
 const dirty=JSON.stringify(items)!==JSON.stringify(data.items)||Number(cost)!==Number(data.shipping.cost||0)||Number(discount)!==Number(data.shipping.discount||0)
 const subtotal=items.reduce((sum,item)=>sum+Math.round(item.unitPrice*100)*item.qty,0)
 const total=(subtotal+Math.round(Number(cost)*100)-Math.round(Number(discount)*100))/100
 const lineValid=items.length>0&&items.every(item=>Number.isInteger(item.qty)&&item.qty>=1&&item.qty<=20&&Number.isFinite(item.unitPrice)&&item.unitPrice>=0)
 const validAmounts=Number.isFinite(total)&&total>=0&&Number(cost)>=0&&Number(discount)>=0&&Math.round(Number(discount)*100)<=subtotal
 function updateLine(index:number,patch:Partial<Line>){setItems(previous=>previous.map((item,n)=>n===index?{...item,...patch}:item))}
 async function act(action:string,extra:Record<string,unknown>={}){
  if(!data||busy)return
  const tab=action==='approve'||action==='reject'?window.open('about:blank','_blank'):null
  if(tab)tab.opener=null
  setBusy(true);setMessage('')
  try{
   const result=await api<Partial<Share>&{message?:string}>('/api/admin/order-requests/'+id+'/'+action,{
    method:'POST',body:JSON.stringify({version:data.review.version,...extra})
   })
   if(result.whatsappUrl&&result.message){
    setLinks({whatsappUrl:result.whatsappUrl,message:result.message,paymentUrl:result.paymentUrl})
    if(tab)tab.location.href=result.whatsappUrl
    setMessage(tab?'WhatsApp aperto con il messaggio pronto.':'Usa il collegamento WhatsApp qui sotto.')
   }else{tab?.close();setMessage(result.message||'Operazione completata.')}
   if(action==='reject')setRejecting(false)
   await load()
  }catch(error){tab?.close();setMessage(error instanceof Error?error.message:String(error))}
  finally{setBusy(false)}
 }
 const paidMessage=data.phone?'https://wa.me/'+data.phone.replace(/\D/g,'')+'?text='+encodeURIComponent(`Ciao, abbiamo ricevuto il pagamento dell’ordine #${id} (${money(data.total)}). Ti avviseremo quando sarà spedito. Grazie, DeLù!`):null
 return <section className="order-detail-block order-review">
  <header className="review-heading"><div><span>GESTIONE ORDINE</span><h3>Verifica magazzini</h3></div><b>{stateLabels[data.review.state]||data.review.state}</b></header>
  <p role="status" className="review-feedback">{message}</p>
  {state==='REVIEW'?<>
   <p className="review-hint">Verifica la disponibilità e salva eventuali variazioni prima della conferma. Il link di pagamento fissa l’importo salvato.</p>
   <div className="review-lines">
    {items.map((item,index)=>{
     const product=catalog.find(candidate=>candidate.id===item.id)
     return <fieldset key={index} className="review-line">
      <legend>Articolo {index+1}</legend>
      <label className="review-wide">Prodotto<select value={item.id} onChange={e=>{const selected=catalog.find(candidate=>candidate.id===e.target.value);if(selected)updateLine(index,toLine(selected))}}>
       {!product&&<option value={item.id}>{item.name}</option>}
       {catalog.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
      </select></label>
      <label>Colore<select value={item.color} onChange={e=>updateLine(index,{color:e.target.value})}>{(product?.colors.length?product.colors:[item.color]).map(color=><option key={color}>{color}</option>)}</select></label>
      <label>Taglia<select value={item.size} onChange={e=>updateLine(index,{size:e.target.value})}>{(product?.sizes.length?product.sizes:[item.size]).map(size=><option key={size}>{size}</option>)}</select></label>
      <label>Quantità<input type="number" min="1" max="20" step="1" value={item.qty} onChange={e=>updateLine(index,{qty:Number(e.target.value)})}/></label>
      <label>Prezzo unitario €<input type="number" min="0" step=".01" value={item.unitPrice} onChange={e=>updateLine(index,{unitPrice:Number(e.target.value)})}/></label>
      <div className="review-line-footer review-wide"><strong>{money(item.qty*item.unitPrice)}</strong><button type="button" className="review-link-danger" onClick={()=>setItems(previous=>previous.filter((_,n)=>n!==index))}><Trash2 size={15} aria-hidden="true"/> Rimuovi</button></div>
     </fieldset>
    })}
   </div>
   <button type="button" className="review-secondary" disabled={!catalog.length||items.length>=40} onClick={()=>setItems(previous=>[...previous,toLine(catalog[0])])}><Plus size={16} aria-hidden="true"/> Aggiungi articolo</button>
   <div className="review-total">
    <div className="review-amount-fields">
     <label>Spedizione €<input type="number" min="0" step=".01" value={cost} onChange={e=>setCost(e.target.value)}/></label>
     <label>Sconto €<input type="number" min="0" step=".01" value={discount} onChange={e=>setDiscount(e.target.value)}/></label>
    </div>
    <div className="review-total-row"><div><small>Totale calcolato</small><strong>{money(total)}</strong></div><div><small>Totale salvato</small><strong>{money(data.total)}</strong></div></div>
    {dirty&&<p className="review-hint">Salva le variazioni prima di confermare.</p>}
    <button type="button" className="review-secondary" disabled={busy||!dirty||!lineValid||!validAmounts} onClick={()=>act('edit',{items,shippingCost:Number(cost),discount:Number(discount)})}>Salva variazioni</button>
   </div>
   <div className="review-actions">
    <button type="button" className="review-primary" disabled={busy||dirty||!lineValid||!validAmounts||total<=0} onClick={()=>{if(confirm('Confermare l’ordine e bloccare l’importo salvato?'))void act('approve')}}><Check size={17} aria-hidden="true"/> Conferma e apri WhatsApp</button>
    <button type="button" className="review-danger" disabled={busy} aria-expanded={rejecting} onClick={()=>setRejecting(value=>!value)}>Rifiuta richiesta</button>
   </div>
   {rejecting&&<form className="review-rejection" onSubmit={e=>{e.preventDefault();if(reason.trim())void act('reject',{reason})}}>
    <label>Motivo del rifiuto<textarea rows={3} maxLength={1000} required value={reason} onChange={e=>setReason(e.target.value)} placeholder="Es. La taglia richiesta è esaurita."/></label>
    <button className="review-danger" disabled={busy||!reason.trim()}>Rifiuta e apri WhatsApp</button>
   </form>}
  </>:<div className="review-total-row"><div><small>{state==='REJECTED'?'Motivo del rifiuto':'Importo confermato'}</small><strong>{state==='REJECTED'?data.review.reason:money(data.total)}</strong></div></div>}
  {links&&(!links.paymentUrl||state!=='PAID')&&<div className="review-share">
   <a className="review-secondary" href={links.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true"/>{links.paymentUrl?'Apri riepilogo e pagamento':'Apri motivo del rifiuto'}</a>
   <textarea readOnly aria-label="Messaggio WhatsApp" rows={4} value={links.message}/>
   <button type="button" className="review-secondary" onClick={()=>navigator.clipboard.writeText(links.message).then(()=>setMessage('Messaggio copiato.')).catch(()=>setMessage('Seleziona e copia il testo.'))}>Copia messaggio</button>
  </div>}
  {state==='PAID'&&paidMessage&&<a className="review-secondary" href={paidMessage} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true"/> Conferma pagamento su WhatsApp</a>}
  {state==='PAID'&&<form className="review-label-form" onSubmit={e=>{
   e.preventDefault();const form=new FormData(e.currentTarget)
   if(confirm('Generare un’etichetta Sendcloud a pagamento per questo ordine?'))void act('label',{street:form.get('street'),houseNumber:form.get('house'),weight:Number(form.get('weight')),shippingMethod:Number(form.get('method'))})
  }}>
   <h3>Etichetta corriere</h3>
   <div className="review-amount-fields">
    <label>Via senza civico<input name="street" required defaultValue={data.shipping.address}/></label>
    <label>Civico<input name="house" required/></label>
    <label>Peso effettivo kg<input name="weight" type="number" min=".001" step=".001" required/></label>
    <label>Servizio corriere<select name="method" required defaultValue=""><option value="">Seleziona un servizio</option>{methods.map(method=><option value={method.id} key={method.id}>{method.name}</option>)}</select></label>
   </div>
   <button className="review-secondary" disabled={busy||data.label?.state!=='READY'}>Crea etichetta corriere</button>
   {data.label?.parcel_id&&<a className="review-secondary" href={'/api/admin/order-requests/'+id+'/label'} target="_blank" rel="noreferrer">Apri etichetta Sendcloud</a>}
   {data.label?.state==='CHECK_REQUIRED'&&<p className="review-hint">Verifica l’esito su Sendcloud prima di ripetere.</p>}
  </form>}
 </section>
}
