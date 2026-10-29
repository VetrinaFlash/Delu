import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react'
import {
  ArrowRight, Bag, ChevronDown, CircleUserRound, Heart, LayoutDashboard,
  LockKeyhole, LogOut, Menu, Package, Search, ShoppingBag, SlidersHorizontal,
  Sparkles, Truck, X, Plus, Pencil, Eye, Box, TrendingUp, AlertTriangle,
} from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { orders as seedOrders, products as seedProducts, type Product } from './data'

type CartItem = { product: Product; qty: number; size?: string; color?: string }

const money = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`brand ${light ? 'brand--light' : ''}`} aria-label="Thelu Clothes Shop home">
      <span className="brand-mark">T</span>
      <span className="brand-name">THELU</span>
      <span className="brand-sub">CLOTHES SHOP</span>
    </Link>
  )
}

function Header({ cartCount, onCart }: { cartCount: number; onCart: () => void }) {
  const [mobile, setMobile] = useState(false)
  const location = useLocation()
  if (location.pathname.startsWith('/admin')) return null
  return (
    <>
      <div className="announcement">SPEDIZIONE GRATUITA DA 79€ <span>•</span> NUOVI DROP OGNI SETTIMANA <span>•</span> RESO FACILE</div>
      <header className="site-header">
        <button className="icon-btn mobile-only" onClick={() => setMobile(true)} aria-label="Apri menu"><Menu size={20}/></button>
        <nav className="desktop-nav">
          <Link to="/shop">SHOP</Link><Link to="/shop?new=1">NEW IN</Link><Link to="/shop?edit=1">THELU EDIT</Link>
        </nav>
        <Brand />
        <div className="header-actions">
          <Link className="icon-btn desktop-only" to="/shop" aria-label="Cerca"><Search size={19}/></Link>
          <Link className="icon-btn desktop-only" to="/shop" aria-label="Preferiti"><Heart size={19}/></Link>
          <button className="icon-btn cart-icon" onClick={onCart} aria-label="Carrello"><Bag size={19}/><span>{cartCount}</span></button>
        </div>
      </header>
      <AnimatePresence>
        {mobile && <motion.aside className="mobile-menu" initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} transition={{type:'spring', damping:28, stiffness:260}}>
          <div className="mobile-menu-top"><Brand/><button className="icon-btn" onClick={() => setMobile(false)}><X/></button></div>
          <Link to="/shop" onClick={()=>setMobile(false)}>Shop <ArrowRight/></Link>
          <Link to="/shop?new=1" onClick={()=>setMobile(false)}>New in <ArrowRight/></Link>
          <Link to="/shop?edit=1" onClick={()=>setMobile(false)}>Thelu edit <ArrowRight/></Link>
          <Link to="/admin" onClick={()=>setMobile(false)}>Area riservata <LockKeyhole/></Link>
        </motion.aside>}
      </AnimatePresence>
    </>
  )
}

function Hero() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 800], [0, 120])
  const heroScale = useTransform(scrollY, [0, 800], [1, 1.08])
  return (
    <section className="hero">
      <motion.div className="hero-media" style={{ y: heroY, scale: heroScale }}>
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=90" alt="Thelu fashion collection"/>
      </motion.div>
      <div className="hero-shade"/>
      <motion.div className="hero-copy" initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:.9,ease:[.16,1,.3,1]}}>
        <span className="eyebrow light">THE NEW FEMININE</span>
        <h1>Wear the<br/><em>moment.</em></h1>
        <p>Una selezione femminile pensata per farsi notare senza chiedere permesso.</p>
        <Link to="/shop" className="btn btn-light">SCOPRI LA COLLEZIONE <ArrowRight size={16}/></Link>
      </motion.div>
      <div className="hero-side-note">THELU / COLLECTION 01 / 2026</div>
      <motion.div className="scroll-cue" animate={{y:[0,8,0]}} transition={{duration:1.8,repeat:Infinity}}>SCROLL <ChevronDown size={15}/></motion.div>
    </section>
  )
}

function Marquee() {
  return <div className="marquee"><motion.div animate={{x:['0%','-50%']}} transition={{duration:24,repeat:Infinity,ease:'linear'}}>
    {Array.from({length:8}).map((_,i)=><span key={i}>THELU <i>✦</i> FEMININE ENERGY <i>✦</i> NEW DROP <i>✦</i> </span>)}
  </motion.div></div>
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product)=>void }) {
  return (
    <motion.article className="product-card" layout whileHover={{y:-6}} transition={{duration:.25}}>
      <Link to={`/product/${product.id}`} className="product-image-wrap">
        <img src={product.image} alt={product.name} className="product-image"/>
        <div className="product-badges">{product.new && <span>NEW</span>}{product.stock < 10 && <span>LAST PIECES</span>}</div>
        <motion.div className="quick-view" initial={false}>VIEW</motion.div>
      </Link>
      <div className="product-info">
        <div><Link to={`/product/${product.id}`}>{product.name}</Link><span>{product.category}</span></div>
        <div className="price">{money(product.price)} {product.compareAt && <del>{money(product.compareAt)}</del>}</div>
      </div>
      <button className="quick-add" onClick={()=>onAdd(product)}>AGGIUNGI <Plus size={15}/></button>
    </motion.article>
  )
}

function Home({ onAdd }: { onAdd: (p: Product)=>void }) {
  return <main>
    <Hero/>
    <Marquee/>
    <section className="editorial section-pad">
      <motion.div className="section-head" initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.3}}>
        <div><span className="eyebrow">THELU SELECTION</span><h2>Not just clothes.<br/><em>An attitude.</em></h2></div>
        <p>Linee contemporanee, dettagli femminili e pezzi che cambiano energia a un look. Scegli il tuo mood.</p>
      </motion.div>
      <div className="editorial-grid">
        <motion.a href="/shop" className="editorial-card editorial-card--tall" whileHover="hover">
          <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=90" alt="Party edit"/>
          <div className="editorial-overlay"><span>01 / THE PARTY EDIT</span><h3>After<br/>dark.</h3><b>SHOP NOW <ArrowRight/></b></div>
        </motion.a>
        <div className="editorial-stack">
          <motion.a href="/shop" className="editorial-card" whileHover="hover">
            <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=90" alt="Daily essentials"/>
            <div className="editorial-overlay"><span>02 / DAILY</span><h3>Everyday,<br/>elevated.</h3><b>EXPLORE <ArrowRight/></b></div>
          </motion.a>
          <div className="statement-card"><Sparkles/><p>Dress like you're<br/>already <em>there.</em></p><span>THELU MANIFESTO</span></div>
        </div>
      </div>
    </section>
    <section className="featured section-pad">
      <div className="section-title-row"><div><span className="eyebrow">JUST LANDED</span><h2>New obsession.</h2></div><Link to="/shop">VEDI TUTTO <ArrowRight size={17}/></Link></div>
      <div className="product-grid">{seedProducts.slice(0,4).map(p=><ProductCard key={p.id} product={p} onAdd={onAdd}/>)}</div>
    </section>
    <section className="split-story">
      <motion.div className="split-image" initial={{clipPath:'inset(12% 12% 12% 12%)'}} whileInView={{clipPath:'inset(0% 0% 0% 0%)'}} transition={{duration:1,ease:[.16,1,.3,1]}} viewport={{once:true}}><img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=90" alt="Thelu street style"/></motion.div>
      <div className="split-copy"><span className="eyebrow">THELU WORLD</span><h2>You don't follow<br/>the look.<br/><em>You set it.</em></h2><p>Uno spazio dove il guardaroba diventa espressione. Nuovi arrivi, capsule e selezioni curate per donne che scelgono il proprio stile.</p><Link to="/shop" className="text-link">ENTER THE SHOP <ArrowRight/></Link></div>
    </section>
    <section className="benefits section-pad"><div><Truck/><b>Spedizione rapida</b><span>Consegna tracciata</span></div><div><ShoppingBag/><b>Drop selezionati</b><span>Novità ogni settimana</span></div><div><Heart/><b>Scelto da Thelu</b><span>Qualità e stile prima di tutto</span></div></section>
  </main>
}

function Shop({ onAdd }: { onAdd:(p:Product)=>void }) {
  const [category,setCategory]=useState('Tutti')
  const [color,setColor]=useState('Tutti')
  const [size,setSize]=useState('Tutte')
  const [sort,setSort]=useState('featured')
  const [filters,setFilters]=useState(false)
  const categories=['Tutti',...Array.from(new Set(seedProducts.map(p=>p.category)))]
  const colors=['Tutti',...Array.from(new Set(seedProducts.flatMap(p=>p.colors)))]
  const sizes=['Tutte',...Array.from(new Set(seedProducts.flatMap(p=>p.sizes)))]
  const visible=useMemo(()=>{
    let list=seedProducts.filter(p=>(category==='Tutti'||p.category===category)&&(color==='Tutti'||p.colors.includes(color))&&(size==='Tutte'||p.sizes.includes(size)))
    if(sort==='price-low') list=[...list].sort((a,b)=>a.price-b.price)
    if(sort==='price-high') list=[...list].sort((a,b)=>b.price-a.price)
    if(sort==='new') list=[...list].sort((a,b)=>Number(b.new)-Number(a.new))
    return list
  },[category,color,size,sort])
  return <main className="shop-page">
    <section className="shop-hero"><span className="eyebrow">THE COLLECTION</span><h1>Shop <em>the mood.</em></h1><p>{seedProducts.length} pezzi selezionati. Trova quello che parla di te.</p></section>
    <div className="shop-toolbar section-pad-x">
      <button className="filter-trigger" onClick={()=>setFilters(!filters)}><SlidersHorizontal size={17}/> FILTRI <span>{visible.length}</span></button>
      <div className="category-pills">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Ordina prodotti"><option value="featured">In evidenza</option><option value="new">Più recenti</option><option value="price-low">Prezzo crescente</option><option value="price-high">Prezzo decrescente</option></select>
    </div>
    <AnimatePresence>{filters&&<motion.div className="filter-panel section-pad-x" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
      <div><label>COLORE</label><div className="filter-chips">{colors.map(c=><button className={color===c?'active':''} onClick={()=>setColor(c)} key={c}>{c}</button>)}</div></div>
      <div><label>TAGLIA</label><div className="filter-chips">{sizes.map(s=><button className={size===s?'active':''} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div></div>
      <button className="clear-filter" onClick={()=>{setCategory('Tutti');setColor('Tutti');setSize('Tutte')}}>Azzera filtri</button>
    </motion.div>}</AnimatePresence>
    <section className="product-grid product-grid--shop section-pad">{visible.map(p=><ProductCard key={p.id} product={p} onAdd={onAdd}/>)}</section>
  </main>
}

function ProductPage({ onAdd }: { onAdd:(p:Product,size?:string,color?:string)=>void }) {
  const {id}=useParams(); const product=seedProducts.find(p=>p.id===id)
  const [size,setSize]=useState(''); const [color,setColor]=useState(product?.colors[0]??'')
  if(!product) return <Navigate to="/shop" replace/>
  return <main className="product-page section-pad">
    <motion.div className="product-detail-image" initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}}><img src={product.image} alt={product.name}/><span>{product.new?'NEW DROP':'THELU SELECTION'}</span></motion.div>
    <motion.div className="product-detail-info" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} transition={{delay:.15}}>
      <span className="eyebrow">{product.category}</span><h1>{product.name}</h1><div className="product-detail-price">{money(product.price)} {product.compareAt&&<del>{money(product.compareAt)}</del>}</div>
      <p className="product-desc">Un pezzo Thelu selezionato per vestibilità, carattere e versatilità. Pensato per diventare il punto forte del tuo look.</p>
      <div className="option-block"><div><b>COLORE</b><span>{color}</span></div><div className="swatches">{product.colors.map(c=><button key={c} onClick={()=>setColor(c)} className={color===c?'active':''} title={c}>{c[0]}</button>)}</div></div>
      <div className="option-block"><div><b>TAGLIA</b><button>Guida taglie</button></div><div className="sizes">{product.sizes.map(s=><button key={s} className={size===s?'active':''} onClick={()=>setSize(s)}>{s}</button>)}</div></div>
      <button className="add-main" onClick={()=>onAdd(product,size||product.sizes[0],color)}>AGGIUNGI AL CARRELLO <Bag size={18}/></button>
      <div className="detail-notes"><span><Truck size={17}/> Spedizione tracciata</span><span><Package size={17}/> {product.stock} pezzi disponibili</span></div>
    </motion.div>
  </main>
}

function CartDrawer({ open,onClose,items,setItems }:{open:boolean;onClose:()=>void;items:CartItem[];setItems:(v:CartItem[])=>void}) {
  const total=items.reduce((s,i)=>s+i.product.price*i.qty,0)
  return <AnimatePresence>{open&&<>
    <motion.div className="drawer-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
    <motion.aside className="cart-drawer" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:30,stiffness:280}}>
      <div className="drawer-head"><div><span>YOUR BAG</span><b>{items.length} {items.length===1?'articolo':'articoli'}</b></div><button className="icon-btn" onClick={onClose}><X/></button></div>
      <div className="cart-items">{items.length===0?<div className="empty-cart"><Bag size={42}/><h3>La tua bag è vuota.</h3><p>Non per molto.</p><Link to="/shop" onClick={onClose}>SCOPRI LO SHOP <ArrowRight/></Link></div>:items.map((item,i)=><div className="cart-row" key={`${item.product.id}-${i}`}><img src={item.product.image}/><div><b>{item.product.name}</b><span>{item.color} / {item.size}</span><span>Q.tà {item.qty}</span><strong>{money(item.product.price*item.qty)}</strong></div><button onClick={()=>setItems(items.filter((_,idx)=>idx!==i))}><X size={16}/></button></div>)}</div>
      {items.length>0&&<div className="cart-footer"><div><span>SUBTOTALE</span><b>{money(total)}</b></div><small>Spedizione calcolata al checkout.</small><button>VAI AL CHECKOUT <ArrowRight/></button></div>}
    </motion.aside>
  </>}</AnimatePresence>
}

function AdminLogin({ onLogin }:{onLogin:()=>void}) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState('');
  const submit=(e:React.FormEvent)=>{e.preventDefault(); if(!email||!password){setError('Inserisci email e password.');return} sessionStorage.setItem('thelu-admin','1');onLogin()}
  return <main className="admin-login"><div className="admin-login-brand"><Brand light/><p>PRIVATE MANAGEMENT SYSTEM</p></div><motion.form onSubmit={submit} className="login-card" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}><LockKeyhole/><span className="eyebrow">AREA RISERVATA</span><h1>Welcome back.</h1><p>Gestisci prodotti, disponibilità e ordini Thelu.</p><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@thelu.it"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••"/></label>{error&&<div className="form-error">{error}</div>}<button type="submit">ACCEDI <ArrowRight/></button><small>Accesso riservato allo staff autorizzato.</small></motion.form></main>
}

function Admin({ onLogout }:{onLogout:()=>void}) {
  const [tab,setTab]=useState<'dashboard'|'products'|'orders'>('dashboard'); const [showForm,setShowForm]=useState(false)
  const [catalog,setCatalog]=useState<Product[]>(()=>{try{return JSON.parse(localStorage.getItem('thelu-catalog')||'null')||seedProducts}catch{return seedProducts}})
  const save=(list:Product[])=>{setCatalog(list);localStorage.setItem('thelu-catalog',JSON.stringify(list))}
  return <main className="admin-shell">
    <aside className="admin-sidebar"><Brand light/><nav><button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}><LayoutDashboard/>Dashboard</button><button className={tab==='products'?'active':''} onClick={()=>setTab('products')}><Package/>Prodotti</button><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}><ShoppingBag/>Ordini <span>{seedOrders.filter(o=>o.status==='Nuovo').length}</span></button></nav><div className="admin-side-bottom"><Link to="/" target="_blank"><Eye/>Vedi shop</Link><button onClick={onLogout}><LogOut/>Esci</button></div></aside>
    <section className="admin-content"><div className="admin-top"><div><span className="eyebrow">THELU BACK OFFICE</span><h1>{tab==='dashboard'?'Good morning.':tab==='products'?'Catalogo prodotti':'Gestione ordini'}</h1></div><div className="admin-avatar"><CircleUserRound/><span>Admin<br/><small>Thelu Staff</small></span></div></div>
    {tab==='dashboard'&&<><div className="metric-grid"><Metric icon={<TrendingUp/>} label="Vendite oggi" value="€ 684" note="+18% vs ieri"/><Metric icon={<ShoppingBag/>} label="Ordini" value="12" note="4 da preparare"/><Metric icon={<Box/>} label="Articoli attivi" value={String(catalog.length)} note={`${catalog.reduce((s,p)=>s+p.stock,0)} pezzi a stock`}/><Metric icon={<AlertTriangle/>} label="Stock basso" value={String(catalog.filter(p=>p.stock<10).length)} note="da controllare"/></div><div className="admin-panels"><div className="admin-panel"><div className="panel-head"><div><span>ULTIMI ORDINI</span><h3>Da gestire</h3></div><button onClick={()=>setTab('orders')}>Vedi tutti <ArrowRight/></button></div><OrderTable compact/></div><div className="admin-panel low-stock"><div className="panel-head"><div><span>MAGAZZINO</span><h3>Stock basso</h3></div></div>{catalog.filter(p=>p.stock<12).map(p=><div className="stock-row" key={p.id}><img src={p.image}/><div><b>{p.name}</b><span>{p.category}</span></div><strong>{p.stock} pz</strong></div>)}</div></div></>}
    {tab==='products'&&<><div className="admin-actions"><div className="admin-search"><Search/><input placeholder="Cerca prodotto..."/></div><button className="admin-primary" onClick={()=>setShowForm(true)}><Plus/>NUOVO PRODOTTO</button></div><div className="catalog-table"><div className="table-row table-head"><span>PRODOTTO</span><span>CATEGORIA</span><span>PREZZO</span><span>STOCK</span><span>TAG</span><span></span></div>{catalog.map(p=><div className="table-row" key={p.id}><div className="table-product"><img src={p.image}/><div><b>{p.name}</b><span>{p.colors.join(' · ')}</span></div></div><span>{p.category}</span><b>{money(p.price)}</b><span className={p.stock<10?'stock-danger':''}>{p.stock} pz</span><span className="tag-cell">{p.tags.slice(0,2).map(t=><i key={t}>{t}</i>)}</span><button className="icon-btn"><Pencil size={16}/></button></div>)}</div></>}
    {tab==='orders'&&<div className="admin-panel full"><OrderTable/></div>}
    </section>
    <AnimatePresence>{showForm&&<ProductForm onClose={()=>setShowForm(false)} onSave={p=>{save([p,...catalog]);setShowForm(false)}}/>}</AnimatePresence>
  </main>
}

function Metric({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}){return <div className="metric-card"><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}

function OrderTable({compact=false}:{compact?:boolean}){const rows=compact?seedOrders.slice(0,3):seedOrders;return <div className="orders-table">{rows.map(o=><div className="order-row" key={o.id}><b>{o.id}</b><div><strong>{o.customer}</strong><span>{o.email}</span></div><span>{o.items} articoli</span><b>{money(o.total)}</b><i className={`order-status status-${o.status.toLowerCase().replaceAll(' ','-')}`}>{o.status}</i><span>{o.createdAt}</span><button className="icon-btn"><ArrowRight size={16}/></button></div>)}</div>}

function ProductForm({onClose,onSave}:{onClose:()=>void;onSave:(p:Product)=>void}){
  const [form,setForm]=useState({name:'',price:'',category:'',stock:'',colors:'',sizes:'',tags:'',image:''})
  const field=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement>)=>setForm({...form,[k]:e.target.value})
  const submit=(e:React.FormEvent)=>{e.preventDefault();onSave({id:`thelu-${Date.now()}`,name:form.name,price:Number(form.price),category:form.category,stock:Number(form.stock),colors:form.colors.split(',').map(x=>x.trim()).filter(Boolean),sizes:form.sizes.split(',').map(x=>x.trim()).filter(Boolean),tags:form.tags.split(',').map(x=>x.trim()).filter(Boolean),image:form.image||'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=85',new:true})}
  return <><motion.div className="drawer-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/><motion.form className="product-form" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} onSubmit={submit}><div className="drawer-head"><div><span>CATALOGO</span><b>Nuovo prodotto</b></div><button type="button" className="icon-btn" onClick={onClose}><X/></button></div><div className="form-scroll"><label>Nome prodotto<input required value={form.name} onChange={field('name')} placeholder="Es. Blazer Rose Atelier"/></label><div className="form-grid"><label>Prezzo €<input required type="number" step="0.01" value={form.price} onChange={field('price')}/></label><label>Stock<input required type="number" value={form.stock} onChange={field('stock')}/></label></div><label>Categoria<input required value={form.category} onChange={field('category')} placeholder="Abiti, Top, Jeans..."/></label><label>Colori <small>separati da virgola</small><input value={form.colors} onChange={field('colors')} placeholder="Rosa, Nero, Bianco"/></label><label>Taglie <small>separate da virgola</small><input value={form.sizes} onChange={field('sizes')} placeholder="XS, S, M, L"/></label><label>Tag / filtri <small>separati da virgola</small><input value={form.tags} onChange={field('tags')} placeholder="new, elegante, sera"/></label><label>URL immagine<input value={form.image} onChange={field('image')} placeholder="https://..."/></label><div className="form-tip"><Sparkles/><span>I tag inseriti diventano automaticamente utilizzabili come filtri nello shop.</span></div></div><button className="save-product" type="submit">SALVA PRODOTTO <ArrowRight/></button></motion.form></>}

function AdminGate(){const nav=useNavigate(); const [logged,setLogged]=useState(()=>sessionStorage.getItem('thelu-admin')==='1'); if(!logged)return <AdminLogin onLogin={()=>setLogged(true)}/>;return <Admin onLogout={()=>{sessionStorage.removeItem('thelu-admin');setLogged(false);nav('/admin')}}/>}

function Footer(){const location=useLocation();if(location.pathname.startsWith('/admin'))return null;return <footer><div className="footer-brand"><Brand light/><p>Fashion, attitude, you.</p></div><div><span>SHOP</span><Link to="/shop">Tutti i prodotti</Link><Link to="/shop">New in</Link><Link to="/shop">Best seller</Link></div><div><span>INFO</span><a href="#">Spedizioni & resi</a><a href="#">Guida taglie</a><a href="#">Contatti</a></div><div><span>FOLLOW THELU</span><a href="#">Instagram</a><a href="#">TikTok</a></div><div className="footer-bottom">© 2026 THELU CLOTHES SHOP <span>MADE WITH ATTITUDE.</span></div></footer>}

export default function App(){
  const [cart,setCart]=useState<CartItem[]>([]);const [cartOpen,setCartOpen]=useState(false)
  const progress=useSpring(useScroll().scrollYProgress,{stiffness:100,damping:30,restDelta:.001})
  const add=(p:Product,size?:string,color?:string)=>{setCart([...cart,{product:p,qty:1,size:size||p.sizes[0],color:color||p.colors[0]}]);setCartOpen(true)}
  return <><motion.div className="scroll-progress" style={{scaleX:progress}}/><Header cartCount={cart.length} onCart={()=>setCartOpen(true)}/><Routes><Route path="/" element={<Home onAdd={p=>add(p)}/>}/><Route path="/shop" element={<Shop onAdd={p=>add(p)}/>}/><Route path="/product/:id" element={<ProductPage onAdd={add}/>}/><Route path="/admin" element={<AdminGate/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes><Footer/><CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} items={cart} setItems={setCart}/></>
}
