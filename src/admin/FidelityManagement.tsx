import { useEffect, useState } from 'react'
import { api } from './shared'
export default function FidelityManagement(){
 const [members,setMembers]=useState<any[]>([]),[query,setQuery]=useState(''),[error,setError]=useState('')
 async function load(){try{setMembers(await api('/api/admin/fidelity'))}catch(e:any){setError(e.message)}}
 useEffect(()=>{load()},[])
 return <section className="community-admin"><h2>Fidelity Card</h2><p>Controlla qui la validità della tessera prima di applicare i benefici. Il codice tessera non autorizza accessi all’account e non rappresenta un saldo spendibile.</p><input aria-label="Cerca tessera" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Codice tessera, nome o email"/><p role="status">{error}</p>{members.filter(m=>(m.id+' '+m.name+' '+m.email).toLowerCase().includes(query.toLowerCase())).map(m=><article key={m.id}><strong>{m.name}</strong><p>{m.id} · {m.status}</p><p>{m.email}</p><button onClick={async()=>{if(!confirm(m.status==='ACTIVE'?'Sospendere questa tessera?':'Riattivare questa tessera?'))return;try{await api('/api/admin/fidelity/status',{method:'POST',body:JSON.stringify({id:m.id,status:m.status==='ACTIVE'?'REVOKED':'ACTIVE'})});await load()}catch(e:any){setError(e.message)}}}>{m.status==='ACTIVE'?'Sospendi':'Riattiva'}</button></article>)}</section>
}
