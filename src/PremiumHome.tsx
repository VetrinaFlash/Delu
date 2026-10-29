import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowDownRight, ArrowRight, AtSign, Globe2, Heart, MapPin, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { products } from './data'
import { LocaleProvider, useLocale, type Locale } from './i18n'

type HomeCopy={
  season:string; heroA:string; heroB:string; heroText:string; discover:string; place:string;
  statementA:string; statementB:string; statementText:string;
  newLabel:string; newTitle:string; viewAll:string; open:string;
  editorialLabel:string; editorialTitle:string; editorialText:string; editorialCta:string;
  moods:string; newIn:string; edit:string;
  visit:string; visitText:string; shop:string; search:string; wishlist:string;
}

const copy:Record<Locale,HomeCopy>={
  it:{season:'NEW SEASON / 2026',heroA:'Indossa',heroB:'il momento.',heroText:'Una selezione femminile decisa, contemporanea e curata a Follonica.',discover:'SCOPRI LA COLLEZIONE',place:'FOLLONICA · TOSCANA',statementA:'NON SOLO ABITI.',statementB:'UN’ATTITUDINE.',statementText:'Capi scelti per farsi notare senza chiedere permesso. Femminile, deciso, DeLù.',newLabel:'APPENA ARRIVATI',newTitle:'New icons.',viewAll:'VEDI TUTTO',open:'SCOPRI',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'Non segui il look. Lo crei.',editorialText:'Nuovi arrivi, capsule e selezioni curate per donne che scelgono il proprio stile.',editorialCta:'ENTRA NELLO SHOP',moods:'SCEGLI IL TUO MOOD',newIn:'NUOVI ARRIVI',edit:'DELÙ EDIT',visit:'DELÙ, DAL VIVO.',visitText:'Via Roma 27 · Follonica. Passa a trovarci oppure scopri la selezione online.',shop:'SHOP',search:'CERCA',wishlist:'PREFERITI'},
  en:{season:'NEW SEASON / 2026',heroA:'Wear',heroB:'the moment.',heroText:'A bold contemporary womenswear edit, curated in Follonica, Italy.',discover:'DISCOVER THE COLLECTION',place:'FOLLONICA · TUSCANY',statementA:'NOT JUST CLOTHES.',statementB:'AN ATTITUDE.',statementText:'Pieces chosen to be noticed without asking permission. Feminine, bold, DeLù.',newLabel:'JUST LANDED',newTitle:'New icons.',viewAll:'VIEW ALL',open:'DISCOVER',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'You don’t follow the look. You create it.',editorialText:'New arrivals, capsules and curated edits for women who choose their own style.',editorialCta:'ENTER THE SHOP',moods:'CHOOSE YOUR MOOD',newIn:'NEW IN',edit:'DELÙ EDIT',visit:'DELÙ, IN REAL LIFE.',visitText:'Via Roma 27 · Follonica, Tuscany. Visit us or discover the edit online.',shop:'SHOP',search:'SEARCH',wishlist:'WISHLIST'},
  fr:{season:'NEW SEASON / 2026',heroA:'Portez',heroB:'le moment.',heroText:'Une sélection féminine contemporaine et affirmée, choisie à Follonica.',discover:'DÉCOUVRIR LA COLLECTION',place:'FOLLONICA · TOSCANE',statementA:'PLUS QUE DES VÊTEMENTS.',statementB:'UNE ATTITUDE.',statementText:'Des pièces choisies pour se faire remarquer. Féminine, affirmée, DeLù.',newLabel:'NOUVEAUTÉS',newTitle:'New icons.',viewAll:'VOIR TOUT',open:'DÉCOUVRIR',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'Vous ne suivez pas le look. Vous le créez.',editorialText:'Nouveautés, capsules et sélections pour les femmes qui choisissent leur style.',editorialCta:'ENTRER DANS LA BOUTIQUE',moods:'CHOISISSEZ VOTRE MOOD',newIn:'NOUVEAUTÉS',edit:'DELÙ EDIT',visit:'DELÙ, EN VRAI.',visitText:'Via Roma 27 · Follonica, Toscane. Venez nous voir ou découvrez la sélection en ligne.',shop:'BOUTIQUE',search:'RECHERCHER',wishlist:'FAVORIS'},
  de:{season:'NEW SEASON / 2026',heroA:'Trag',heroB:'den Moment.',heroText:'Eine moderne, feminine Auswahl aus Follonica in der Toskana.',discover:'KOLLEKTION ENTDECKEN',place:'FOLLONICA · TOSKANA',statementA:'NICHT NUR KLEIDUNG.',statementB:'EINE HALTUNG.',statementText:'Pieces, die auffallen. Feminin, selbstbewusst, DeLù.',newLabel:'NEU EINGETROFFEN',newTitle:'New icons.',viewAll:'ALLE ANSEHEN',open:'ENTDECKEN',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'Du folgst keinem Look. Du kreierst ihn.',editorialText:'Neuheiten, Capsules und kuratierte Auswahl für Frauen mit eigenem Stil.',editorialCta:'ZUM SHOP',moods:'WÄHLE DEINEN MOOD',newIn:'NEUHEITEN',edit:'DELÙ EDIT',visit:'DELÙ, LIVE.',visitText:'Via Roma 27 · Follonica, Toskana. Besuche uns oder entdecke die Auswahl online.',shop:'SHOP',search:'SUCHE',wishlist:'WUNSCHLISTE'},
  es:{season:'NEW SEASON / 2026',heroA:'Viste',heroB:'el momento.',heroText:'Una selección femenina contemporánea y con carácter, elegida en Follonica.',discover:'DESCUBRE LA COLECCIÓN',place:'FOLLONICA · TOSCANA',statementA:'NO SOLO ROPA.',statementB:'UNA ACTITUD.',statementText:'Prendas elegidas para hacerse notar. Femenina, decidida, DeLù.',newLabel:'RECIÉN LLEGADO',newTitle:'New icons.',viewAll:'VER TODO',open:'DESCUBRIR',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'No sigues el look. Lo creas.',editorialText:'Novedades, cápsulas y selecciones para mujeres que eligen su propio estilo.',editorialCta:'ENTRAR EN LA TIENDA',moods:'ELIGE TU MOOD',newIn:'NOVEDADES',edit:'DELÙ EDIT',visit:'DELÙ, EN PERSONA.',visitText:'Via Roma 27 · Follonica, Toscana. Visítanos o descubre la selección online.',shop:'TIENDA',search:'BUSCAR',wishlist:'FAVORITOS'}
}

const localeTag:Record<Locale,string>={it:'it-IT',en:'en-GB',fr:'fr-FR',de:'de-DE',es:'es-ES'}
const money=(value:number,locale:Locale)=>new Intl.NumberFormat(localeTag[locale],{style:'currency',currency:'EUR'}).format(value)

function HomeInner(){
  const{locale,setLocale,localeNames}=useLocale()
  const c=copy[locale]
  const heroRef=useRef<HTMLElement>(null)
  const showcaseRef=useRef<HTMLElement>(null)
  const editorialRef=useRef<HTMLElement>(null)
  const{scrollYProgress:heroProgress}=useScroll({target:heroRef,offset:['start start','end start']})
  const{scrollYProgress:showcaseProgress}=useScroll({target:showcaseRef,offset:['start start','end end']})
  const{scrollYProgress:editorialProgress}=useScroll({target:editorialRef,offset:['start end','end start']})
  const heroScale=useTransform(heroProgress,[0,1],[1,1.12])
  const heroY=useTransform(heroProgress,[0,1],['0%','12%'])
  const heroTextY=useTransform(heroProgress,[0,1],['0%','-22%'])
  const trackX=useTransform(showcaseProgress,[0,1],['0vw','-64vw'])
  const track=useSpring(trackX,{stiffness:85,damping:22,mass:.35})
  const editorialScale=useTransform(editorialProgress,[0,1],[1.08,1])
  const editorialY=useTransform(editorialProgress,[0,1],['-4%','4%'])
  const featured=(products.filter(p=>p.active!==false&&p.new).length?products.filter(p=>p.active!==false&&p.new):products.filter(p=>p.active!==false)).slice(0,4)

  return <main className="ph-root">
    <header className="ph-header">
      <Link className="ph-head-link" to="/shop">{c.shop}</Link>
      <Link className="ph-logo" to="/" aria-label="DeLù Clothes Shop"><img src="/delu-logo.svg" alt="DeLù Clothes Shop"/></Link>
      <div className="ph-head-actions">
        <Link to="/shop" aria-label={c.search}><Search/></Link>
        <Link to="/wishlist" aria-label={c.wishlist}><Heart/></Link>
        <label className="ph-language"><Globe2/><select value={locale} onChange={e=>setLocale(e.target.value as Locale)}>{Object.entries(localeNames).map(([key,label])=><option key={key} value={key}>{key.toUpperCase()} · {label}</option>)}</select></label>
      </div>
    </header>

    <section ref={heroRef} className="ph-hero">
      <motion.div className="ph-hero-media" style={{scale:heroScale,y:heroY}}>
        <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=92" alt="DeLù editorial"/>
      </motion.div>
      <div className="ph-hero-shade"/>
      <motion.div className="ph-hero-copy" style={{y:heroTextY}}>
        <motion.span initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.95,duration:.7}}>{c.season}</motion.span>
        <div className="ph-hero-title" aria-label={`${c.heroA} ${c.heroB}`}>
          <motion.div initial={{y:'115%'}} animate={{y:0}} transition={{delay:.82,duration:.9,ease:[.16,1,.3,1]}}>{c.heroA}</motion.div>
          <motion.div className="is-italic" initial={{y:'115%'}} animate={{y:0}} transition={{delay:.92,duration:.95,ease:[.16,1,.3,1]}}>{c.heroB}</motion.div>
        </div>
        <motion.p initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:1.08,duration:.75}}>{c.heroText}</motion.p>
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:1.18,duration:.7}}><Link className="ph-hero-cta" to="/shop">{c.discover}<ArrowDownRight/></Link></motion.div>
      </motion.div>
      <motion.div className="ph-hero-watermark" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.05,duration:1.2}}>DELÙ</motion.div>
      <div className="ph-hero-side"><span>01</span><i/><b>{c.place}</b></div>
      <motion.div className="ph-scroll-cue" animate={{y:[0,9,0]}} transition={{repeat:Infinity,duration:2,ease:'easeInOut'}}>SCROLL<ArrowDownRight/></motion.div>
    </section>

    <section className="ph-statement">
      <motion.div className="ph-statement-line left" initial={{x:'8%',opacity:.2}} whileInView={{x:'0%',opacity:1}} viewport={{amount:.4}} transition={{duration:1,ease:[.16,1,.3,1]}}>{c.statementA}</motion.div>
      <motion.div className="ph-statement-line right" initial={{x:'-8%',opacity:.2}} whileInView={{x:'0%',opacity:1}} viewport={{amount:.4}} transition={{duration:1,ease:[.16,1,.3,1]}}>{c.statementB}</motion.div>
      <motion.p initial={{opacity:0,y:26}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.7}} transition={{duration:.8}}>{c.statementText}</motion.p>
    </section>

    <section ref={showcaseRef} className="ph-showcase">
      <div className="ph-showcase-sticky">
        <div className="ph-showcase-title">
          <span>{c.newLabel}</span>
          <h2>{c.newTitle}</h2>
          <p>01 — 04</p>
          <Link to="/shop?new=1">{c.viewAll}<ArrowRight/></Link>
        </div>
        <motion.div className="ph-product-track" style={{x:track}}>
          {featured.map((p,index)=><motion.article className="ph-card" key={p.id} whileHover={{y:-12}} transition={{type:'spring',stiffness:260,damping:22}}>
            <Link className="ph-card-image" to={`/product/${p.id}`}>
              <motion.img src={p.image} alt={p.name} whileHover={{scale:1.035}} transition={{duration:.75,ease:[.16,1,.3,1]}}/>
              <span>{String(index+1).padStart(2,'0')}</span>
              {p.new&&<b>NEW</b>}
              <i>{c.open}<ArrowDownRight/></i>
            </Link>
            <div className="ph-card-meta"><div><small>{p.category}</small><Link to={`/product/${p.id}`}>{p.name}</Link></div><strong>{money(p.price,locale)}</strong></div>
          </motion.article>)}
        </motion.div>
      </div>
    </section>

    <section ref={editorialRef} className="ph-editorial">
      <motion.div className="ph-editorial-image" style={{scale:editorialScale,y:editorialY}}><img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2200&q=92" alt="DeLù style"/></motion.div>
      <div className="ph-editorial-shade"/>
      <div className="ph-editorial-copy"><span>{c.editorialLabel}</span><motion.h2 initial={{clipPath:'inset(0 0 100% 0)'}} whileInView={{clipPath:'inset(0 0 0% 0)'}} viewport={{once:true,amount:.45}} transition={{duration:1.05,ease:[.16,1,.3,1]}}>{c.editorialTitle}</motion.h2><p>{c.editorialText}</p><Link to="/shop">{c.editorialCta}<ArrowRight/></Link></div>
      <div className="ph-editorial-word">DELÙ</div>
    </section>

    <section className="ph-moods">
      <div className="ph-moods-head"><span>{c.moods}</span><b>02 / 02</b></div>
      <div className="ph-mood-grid">
        <Link to="/shop?new=1" className="ph-mood-card"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=90" alt="New in"/><div><span>01</span><h3>{c.newIn}</h3><ArrowDownRight/></div></Link>
        <Link to="/shop?edit=1" className="ph-mood-card"><img src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1600&q=90" alt="DeLù Edit"/><div><span>02</span><h3>{c.edit}</h3><ArrowDownRight/></div></Link>
      </div>
    </section>

    <section className="ph-visit">
      <div className="ph-visit-top"><MapPin/><span>42.9257° N · 10.7616° E</span></div>
      <motion.h2 initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.5}} transition={{duration:.85,ease:[.16,1,.3,1]}}>{c.visit}</motion.h2>
      <p>{c.visitText}</p>
      <div className="ph-visit-links"><a href="https://maps.google.com/?q=Via+Roma+27+Follonica" target="_blank" rel="noreferrer">VIA ROMA 27 <ArrowRight/></a><a href="https://instagram.com/delu.clotheshop" target="_blank" rel="noreferrer"><AtSign/> @DELU.CLOTHESHOP</a></div>
      <div className="ph-visit-ghost">DELÙ</div>
    </section>
  </main>
}

export default function PremiumHome(){return <LocaleProvider><HomeInner/></LocaleProvider>}
