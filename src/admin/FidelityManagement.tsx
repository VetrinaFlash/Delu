import { useEffect, useState } from 'react'
import { api } from './shared'
export default function FidelityManagement(){
 const [crediting,setCrediting]=useState(''),[creditKeys,setCreditKeys]=useState<Record<string,string>>({})
 const [members,setMembers]=useState<any[]>([]),[query,setQuery]=useState(''),[error,setError]=useState('')
 async function load(){try{setMembers(await api('/api/admin/fidelity'))}catch(e:any){setError(e.message)}}
 useEffect(()=>{load()},[])
 return <section className="community-admin"><h2>Fidelity Card</h2><p>Controlla qui la validità della tessera prima di applicare i benefici. Il codice tessera non autorizza accessi all’account e non rappresenta un saldo spendibile.</p><input aria-label="Cerca tessera" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Codice tessera, nome o email"/><p role="status">{error}</p>{members.filter(m=>(m.id+' '+m.name+' '+m.email).toLowerCase().includes(query.toLowerCase())).map(m=><article key={m.id}><strong>{m.name}</strong><p>{m.id} · {m.status}</p><p>{m.email}</p><p><strong>{m.points||0} punti</strong> · {m.paidOrders||0} ordini pagati</p>{m.status==='ACTIVE'&&<form onSubmit={async e=>{
  e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const requestId=creditKeys[m.id]||crypto.randomUUID();setCreditKeys(keys=>({...keys,[m.id]:requestId}));setCrediting(m.id);setError('')
  try{await api('/api/admin/fidelity/credit',{method:'POST',body:JSON.stringify({id:m.id,points:Number(f.get('points')),reason:f.get('reason'),requestId})});form.reset();setCreditKeys(keys=>({...keys,[m.id]:''}));await load()}
  catch(err){setError(err instanceof Error?err.message:String(err))}
  finally{setCrediting('')}
 }}><label>Punti da accreditare<input name="points" type="number" min="1" max="10000" step="1" required/></label><label>Causale o numero scontrino<input name="reason" maxLength={160} required/></label><button disabled={!!crediting}>Accredita punti</button></form>}<button onClick={async()=>{if(!confirm(m.status==='ACTIVE'?'Sospendere questa tessera?':'Riattivare questa tessera?'))return;try{await api('/api/admin/fidelity/status',{method:'POST',body:JSON.stringify({id:m.id,status:m.status==='ACTIVE'?'REVOKED':'ACTIVE'})});await load()}catch(e:any){setError(e.message)}}}>{m.status==='ACTIVE'?'Sospendi':'Riattiva'}</button></article>)}</section>
}
