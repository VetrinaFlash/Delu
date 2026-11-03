import CustomerManagement from './admin/CustomerManagement'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Box, CircleUserRound, Eye, LayoutDashboard, LockKeyhole, LogOut, Package, Pencil, Plus, Search, Settings, ShoppingBag, TrendingUp, AlertTriangle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from './data'
import { defaultShopConfig, type ShopConfig } from './shop-config'
import ProductEditor from './admin/ProductEditor'
import OrderDrawer from './admin/OrderDrawer'
import CommerceSettings from './admin/CommerceSettings'
import { api, money, type ApiOrder, type Tab, upsertProduct } from './admin/shared'

function AdminBrand(){return <Link to="/" className="admin-delu-brand"><img src="/delu-logo.svg" alt="DeLù Clothes Shop"/></Link>}

function Login({onDone}:{onDone:()=>void}){
  const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('')
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});onDone()}catch(err:any){setError(err.message)}finally{setLoading(false)}}
  return <main className="admin-login"><div className="admin-login-brand"><AdminBrand/><p>PRIVATE MANAGEMENT SYSTEM</p></div><motion.form onSubmit={submit} className="login-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}><LockKeyhole/><span className="eyebrow">AREA RISERVATA</span><h1>DeLù Back Office.</h1><p>Catalogo, varianti, magazzino, ordini e spedizioni in un unico posto.</p><label>Email o nome utente<input autoComplete="username" type="text" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="form-error">{error}</div>}<button disabled={loading} type="submit">{loading?'ACCESSO...':'ACCEDI'} <ArrowRight/></button><small>Sessione firmata lato server. Le credenziali non vengono memorizzate nel browser.</small></motion.form></main>
}

export default function AdminSecure(){
  const[checking,setChecking]=useState(true),[auth,setAuth]=useState(false),[tab,setTab]=useState<Tab>('dashboard')
  const[products,setProducts]=useState<Product[]>([]),[orders,setOrders]=useState<ApiOrder[]>([]),[settings,setSettings]=useState<ShopConfig>(defaultShopConfig)
  const[error,setError]=useState(''),[editor,setEditor]=useState<Product|null|undefined>(undefined),[orderDetail,setOrderDetail]=useState<ApiOrder|null>(null)
  async function load(){setError('');try{const[p,o,s]=await Promise.all([api<Product[]>('/api/admin/products'),api<ApiOrder[]>('/api/admin/orders'),api<ShopConfig>('/api/admin/settings')]);setProducts(p);setOrders(o);setSettings(s)}catch(e:any){setError(e.message)}}
  useEffect(()=>{api('/api/auth/me').then(()=>{setAuth(true);return load()}).catch(()=>setAuth(false)).finally(()=>setChecking(false))},[])
  const seen=useRef<Map<string,string>|null>(null),[live,setLive]=useState(''),[lastSync,setLastSync]=useState('')
  useEffect(()=>{if(!auth)return;let stopped=false,running=false;
    async function tick(){if(running||document.hidden)return;running=true;try{
      const state=await fetch('/api/auth/me',{credentials:'include'});if(state.status===401){setLive('Sessione scaduta. Accedi di nuovo.');if('Notification' in window&&Notification.permission==='granted')new Notification('DeLù · accedi di nuovo',{body:'La sessione admin è scaduta. Apri la web app per accedere.'});setAuth(false);return}if(!state.ok)throw new Error('Connessione non disponibile')
      const incoming=await api<ApiOrder[]>('/api/admin/orders');if(stopped)return;
      if(seen.current){const changed=incoming.filter(o=>['Da confermare','Pagato - da preparare','Pagamento fallito','Nuovo'].includes(o.status)&&(!seen.current!.has(o.id)||(['Pagato - da preparare','Pagamento fallito'].includes(o.status)&&seen.current!.get(o.id)!==o.status)));
      if(changed.length){setLive(changed.length+' nuove richieste o pagamenti');if('Notification' in window&&Notification.permission==='granted')new Notification('DeLù · nuovi ordini',{body:changed.length+' richieste o pagamenti da controllare. Apri la dashboard.'})}}
      seen.current=new Map(incoming.map(o=>[o.id,o.status]));setOrders(incoming);setLastSync(new Date().toLocaleTimeString('it-IT'))
    }catch{if(!stopped)setLive('Connessione interrotta. Riprovo automaticamente.')}finally{running=false}}
    tick();const timer=window.setInterval(tick,8000);document.addEventListener('visibilitychange',tick);window.addEventListener('online',tick);return()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',tick);window.removeEventListener('online',tick)}
  },[auth])
  async function logout(){await api('/api/auth/logout',{method:'POST'}).catch(()=>{});setAuth(false)}
  async function deactivate(id:string){if(!confirm('Nascondere questo prodotto dallo shop?'))return;try{const updated=await api<Product>(`/api/admin/products/${id}`,{method:'PATCH',body:JSON.stringify({active:false})});setProducts(v=>v.map(p=>p.id===id?updated:p))}catch(e:any){setError(e.message)}}
  async function quickStock(p:Product,delta:number){if(p.variants?.length){setEditor(p);return}try{const updated=await api<Product>(`/api/admin/products/${p.id}`,{method:'PATCH',body:JSON.stringify({stock:Math.max(0,p.stock+delta)})});setProducts(v=>v.map(x=>x.id===p.id?updated:x))}catch(e:any){setError(e.message)}}
  if(checking)return <div className="admin-loading">DELÙ</div>
  if(!auth)return <><p role="status">{live}</p><Login onDone={()=>{setAuth(true);load()}}/></>
  const active=products.filter(p=>p.active!==false)
  return <main className="admin-shell">
    <aside className="admin-sidebar"><AdminBrand/><nav><button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}><LayoutDashboard/>Dashboard</button><button className={tab==='products'?'active':''} onClick={()=>setTab('products')}><Package/>Prodotti</button><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}><ShoppingBag/>Ordini <span>{orders.filter(o=>['Da confermare','Pagato - da preparare','Nuovo'].includes(o.status)).length}</span></button><button onClick={()=>setTab('customers')}><CircleUserRound/>Clienti e resi</button><button className={tab==='settings'?'active':''} onClick={()=>setTab('settings')}><Settings/>Impostazioni</button></nav><div className="admin-side-bottom"><Link to="/" target="_blank"><Eye/>Vedi shop</Link><button onClick={logout}><LogOut/>Esci</button></div></aside>
    <section className="admin-content"><div className="admin-top"><div><span className="eyebrow">DELÙ BACK OFFICE</span><h1>{tab==='dashboard'?'Panoramica':tab==='products'?'Catalogo & magazzino':tab==='orders'?'Ordini & spedizioni':'Impostazioni shop'}</h1></div><div className="admin-avatar"><CircleUserRound/><span>Admin<br/><small>DeLù Staff</small></span></div></div>{error&&<div className="admin-error">{error}<button onClick={()=>setError('')}><X/></button></div>}
      <div className="admin-live" role="status" aria-live="polite"><span>{live||'Aggiornamento automatico ogni 8 secondi'} · {lastSync&&'Ultimo aggiornamento '+lastSync}</span><button onClick={async()=>{if('Notification' in window){const permission=await Notification.requestPermission();setLive(permission==='granted'?'Avvisi browser attivati per la dashboard aperta. Per la web app chiusa vengono usate le email.':'Avvisi non autorizzati: resta disponibile la dashboard e la notifica email.')}}}>Attiva avvisi browser</button></div>
      {tab==='customers'&&<CustomerManagement/>}
      {tab==='dashboard'&&<Dashboard products={active} orders={orders} goOrders={()=>setTab('orders')} onOpen={setOrderDetail}/>} 
      {tab==='products'&&<Products products={products} onNew={()=>setEditor(null)} onEdit={setEditor} quickStock={quickStock} deactivate={deactivate}/>} 
      {tab==='orders'&&<Orders orders={orders} onOpen={setOrderDetail}/>} 
      {tab==='settings'&&<CommerceSettings value={settings} onSaved={setSettings}/>} 
    </section>
    <AnimatePresence>{editor!==undefined&&<ProductEditor product={editor||undefined} onClose={()=>setEditor(undefined)} onSaved={p=>{setProducts(v=>upsertProduct(v,p));setEditor(undefined)}}/>}{orderDetail&&<OrderDrawer order={orderDetail} onClose={()=>setOrderDetail(null)} onSaved={o=>{setOrders(v=>v.map(x=>x.id===o.id?o:x));setOrderDetail(null)}}/>}</AnimatePresence>
  </main>
}

function Metric({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}){return <div className="metric-card"><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Dashboard({products,orders,goOrders,onOpen}:{products:Product[];orders:ApiOrder[];goOrders:()=>void;onOpen:(order:ApiOrder)=>void}){const paid=orders.filter(o=>['Pagato - da preparare','Nuovo','In preparazione','Spedito','Completato','Pagato - verifica stock'].includes(o.status)),revenue=paid.reduce((s,o)=>s+o.total,0);return <><div className="metric-grid"><Metric icon={<TrendingUp/>} label="Valore ordini validi" value={money(revenue)} note={`${paid.length} ordini`}/><Metric icon={<ShoppingBag/>} label="Da preparare" value={String(orders.filter(o=>['Da confermare','Pagato - da preparare','Nuovo'].includes(o.status)).length)} note={`${orders.filter(o=>o.status==='In preparazione').length} in preparazione`}/><Metric icon={<Box/>} label="Articoli attivi" value={String(products.length)} note={`${products.reduce((s,p)=>s+p.stock,0)} pezzi disponibili`}/><Metric icon={<AlertTriangle/>} label="Stock basso" value={String(products.filter(p=>p.stock<8).length)} note="prodotti da controllare"/></div><div className="admin-panels"><div className="admin-panel"><div className="panel-head"><div><span>ULTIMI ORDINI</span><h3>Da gestire</h3></div><button onClick={goOrders}>Vedi tutti <ArrowRight/></button></div><OrderRows orders={orders.slice(0,6)} onOpen={onOpen}/></div><div className="admin-panel low-stock"><div className="panel-head"><div><span>MAGAZZINO</span><h3>Stock basso</h3></div></div>{products.filter(p=>p.stock<10).slice(0,7).map(p=><div className="stock-row" key={p.id}><img src={p.image} alt=""/><div><b>{p.name}</b><span>{p.variants?.length?`${p.variants.length} varianti`:p.category}</span></div><strong>{p.stock} pz</strong></div>)}</div></div></>}

function Products({products,onNew,onEdit,quickStock,deactivate}:{products:Product[];onNew:()=>void;onEdit:(p:Product)=>void;quickStock:(p:Product,d:number)=>void;deactivate:(id:string)=>void}){const[q,setQ]=useState('');const filtered=useMemo(()=>products.filter(p=>(p.name+' '+p.category+' '+p.tags.join(' ')).toLowerCase().includes(q.toLowerCase())),[products,q]);return <><div className="admin-actions"><div className="admin-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca prodotto, categoria, tag o colore..."/></div><button className="admin-primary" onClick={onNew}><Plus/>NUOVO PRODOTTO</button></div><div className="catalog-table"><div className="table-row table-head"><span>PRODOTTO</span><span>CATEGORIA</span><span>PREZZO</span><span>STOCK</span><span>VARIANTI</span><span></span></div>{filtered.map(p=><div className={`table-row ${p.active===false?'row-disabled':''}`} key={p.id}><div className="table-product"><img src={p.image} alt=""/><div><b>{p.name}</b><span>{p.colors.join(' · ')} {p.active===false?'· NASCOSTO':''}</span></div></div><span>{p.category}</span><b>{money(p.price)}</b><div className="stock-editor"><button onClick={()=>quickStock(p,-1)}>−</button><strong className={p.stock<8?'stock-danger':''}>{p.stock}</strong><button onClick={()=>quickStock(p,1)}>+</button></div><span className="variant-count">{p.variants?.length||0} <small>{p.tags.slice(0,2).join(' · ')}</small></span><div className="table-actions"><button title="Modifica" className="icon-btn" onClick={()=>onEdit(p)}><Pencil/></button>{p.active!==false&&<button title="Nascondi" className="icon-btn" onClick={()=>deactivate(p.id)}><X/></button>}</div></div>)}</div></>}

function Orders({orders,onOpen}:{orders:ApiOrder[];onOpen:(o:ApiOrder)=>void}){const[q,setQ]=useState(''),[status,setStatus]=useState('Tutti');const statuses=['Tutti',...new Set(orders.map(o=>o.status))],filtered=orders.filter(o=>(status==='Tutti'||o.status===status)&&(`${o.id} ${o.customer} ${o.email}`).toLowerCase().includes(q.toLowerCase()));return <><div className="admin-actions"><div className="admin-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ordine, cliente o email..."/></div><select className="admin-status-filter" value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div><div className="admin-panel full"><OrderRows orders={filtered} onOpen={onOpen}/></div></>}
function OrderRows({orders,onOpen}:{orders:ApiOrder[];onOpen:(order:ApiOrder)=>void}){
  if(!orders.length)return <p className="order-list-empty">Nessun ordine da mostrare.</p>
  return <ul className="order-records">
    {orders.map(order=>{
      const status=order.status.toLowerCase().replaceAll(' ','-')
      const date=new Date(order.createdAt)
      const quantity=order.items.reduce((total,item)=>total+(Number(item.qty)||1),0)
      return <li key={order.id}>
        <button type="button" className="order-record" onClick={()=>onOpen(order)} aria-label={`Apri ordine ${order.id} di ${order.customer}`}>
          <span className="order-record-icon"><ShoppingBag size={18} aria-hidden="true"/></span>
          <span className="order-record-customer">
            <strong>{order.customer}</strong>
            <small>#{order.id} · {quantity} {quantity===1?'articolo':'articoli'}</small>
            <small>{order.email}</small>
          </span>
          <span className="order-record-summary">
            <span className={`order-status status-${status}`}>{order.status}</span>
            <strong>{money(order.total)}</strong>
            <time>{Number.isNaN(date.valueOf())?'':date.toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'})}</time>
          </span>
          <ArrowRight className="order-record-arrow" size={17} aria-hidden="true"/>
        </button>
      </li>
    })}
  </ul>
}
