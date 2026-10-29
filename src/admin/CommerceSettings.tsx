import { useEffect, useState } from 'react'
import { ImagePlus, LockKeyhole, Save } from 'lucide-react'
import { api } from './shared'
import type { ShopConfig } from '../shop-config'

export default function CommerceSettings({value,onSaved}:{value:ShopConfig;onSaved:(v:ShopConfig)=>void}){
  const[v,setV]=useState<ShopConfig>(value),[loading,setLoading]=useState(false),[saved,setSaved]=useState(false),[error,setError]=useState('')
  useEffect(()=>setV(value),[value])
  const change=(zone:keyof ShopConfig['shipping'],key:'price'|'freeFrom',raw:string)=>setV(current=>({...current,shipping:{...current.shipping,[zone]:{...current.shipping[zone],[key]:raw===''&&key==='freeFrom'?null:Number(raw)}}}))
  async function save(){setLoading(true);setSaved(false);setError('');try{const data=await api<ShopConfig>('/api/admin/settings',{method:'PUT',body:JSON.stringify(v)});setV(data);onSaved(data);setSaved(true);setTimeout(()=>setSaved(false),2500)}catch(e:any){setError(e.message)}finally{setLoading(false)}}
  const zones:[keyof ShopConfig['shipping'],string][]=[['italy','Italia'],['eu','Unione Europea'],['europe','Europa extra UE'],['world','Resto del mondo']]
  return <div className="admin-settings">
    <div className="admin-panel"><div className="panel-head"><div><span>CHECKOUT</span><h3>Tariffe di spedizione</h3></div></div><p className="settings-intro">Questi valori vengono usati sia dal checkout sia dal server che calcola il totale inviato a Nexi. Il browser non può modificarli.</p><div className="shipping-settings-grid">{zones.map(([key,label])=><div className="shipping-zone-card" key={key}><b>{label}</b><label>Tariffa €<input type="number" min="0" step="0.01" value={v.shipping[key].price} onChange={e=>change(key,'price',e.target.value)}/></label><label>Spedizione gratis da €<input type="number" min="0" step="0.01" value={v.shipping[key].freeFrom??''} placeholder="Mai" onChange={e=>change(key,'freeFrom',e.target.value)}/></label></div>)}</div>{error&&<div className="form-error">{error}</div>}<button className="admin-primary settings-save" onClick={save} disabled={loading}>{saved?<><Save/>SALVATO</>:<><Save/>{loading?'SALVATAGGIO…':'SALVA TARIFFE'}</>}</button></div>
    <div className="admin-panel"><div className="panel-head"><div><span>INTEGRAZIONI</span><h3>Pagamenti & media</h3></div></div><div className="integration-status"><LockKeyhole/><div><b>Nexi XPay Hosted Payment Page</b><span>Le chiavi rimangono su Cloudflare e non vengono mai inviate al browser.</span></div></div><div className="integration-status"><ImagePlus/><div><b>Cloudflare R2</b><span>Collega il binding PRODUCT_IMAGES per caricare direttamente le foto dal pannello.</span></div></div></div>
  </div>
}
