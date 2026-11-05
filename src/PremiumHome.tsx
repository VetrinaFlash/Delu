import QuickNavigation from './QuickNavigation'
import WardrobeRail from './WardrobeRail'
import { TiltCard } from './ExperienceDetails'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform, useReducedMotion, useMotionValueEvent } from 'motion/react'
import { ArrowDownRight, ArrowRight, AtSign, Globe2, UserRound, MapPin, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { products } from './data'
import { LocaleProvider, useLocale, type Locale } from './i18n'

type HomeCopy={
  season:string; heroA:string; heroB:string; heroText:string; discover:string; place:string;
  statementA:string; statementB:string; statementText:string;
  campaignLabel:string; campaignA:string; campaignAText:string; campaignB:string; campaignBText:string; campaignC:string; campaignCText:string;
  newLabel:string; newTitle:string; viewAll:string; open:string;
  editorialLabel:string; editorialTitle:string; editorialText:string; editorialCta:string;
  moods:string; newIn:string; edit:string;
  visit:string; visitText:string; shop:string; search:string; wishlist:string;
}

const baseCopy:Record<Exclude<Locale,'uk'|'ru'>,HomeCopy>={
  it:{season:'NEW SEASON / 2026',heroA:'Indossa',heroB:'il momento.',heroText:'Una selezione femminile decisa, contemporanea e curata a Follonica.',discover:'SCOPRI LA COLLEZIONE',place:'FOLLONICA · TOSCANA',statementA:'NON SOLO ABITI.',statementB:'UN’ATTITUDINE.',statementText:'Capi scelti per farsi notare senza chiedere permesso. Femminile, deciso, DeLù.',campaignLabel:'DELÙ / EXPERIENCE',campaignA:'Femminile.',campaignAText:'Linee, dettagli e carattere. Il look comincia da come vuoi sentirti.',campaignB:'Decisa.',campaignBText:'Niente rumore inutile. Solo capi che entrano nella stanza prima di te.',campaignC:'Tua.',campaignCText:'Non una divisa. Una selezione da interpretare, combinare e rendere personale.',newLabel:'APPENA ARRIVATI',newTitle:'New icons.',viewAll:'VEDI TUTTO',open:'SCOPRI',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'Non segui il look. Lo crei.',editorialText:'Nuovi arrivi, capsule e selezioni curate per donne che scelgono il proprio stile.',editorialCta:'ENTRA NELLO SHOP',moods:'SCEGLI IL TUO MOOD',newIn:'NUOVI ARRIVI',edit:'DELÙ EDIT',visit:'DELÙ, DAL VIVO.',visitText:'Via Roma 27 · Follonica. Passa a trovarci oppure scopri la selezione online.',shop:'SHOP',search:'CERCA',wishlist:'PREFERITI'},
  en:{season:'NEW SEASON / 2026',heroA:'Wear',heroB:'the moment.',heroText:'A bold contemporary womenswear edit, curated in Follonica, Italy.',discover:'DISCOVER THE COLLECTION',place:'FOLLONICA · TUSCANY',statementA:'NOT JUST CLOTHES.',statementB:'AN ATTITUDE.',statementText:'Pieces chosen to be noticed without asking permission. Feminine, bold, DeLù.',campaignLabel:'DELÙ / EXPERIENCE',campaignA:'Feminine.',campaignAText:'Lines, details and character. The look begins with how you want to feel.',campaignB:'Bold.',campaignBText:'No unnecessary noise. Just pieces that enter the room before you do.',campaignC:'Yours.',campaignCText:'Not a uniform. An edit to interpret, combine and make completely personal.',newLabel:'JUST LANDED',newTitle:'New icons.',viewAll:'VIEW ALL',open:'DISCOVER',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'You don’t follow the look. You create it.',editorialText:'New arrivals, capsules and curated edits for women who choose their own style.',editorialCta:'ENTER THE SHOP',moods:'CHOOSE YOUR MOOD',newIn:'NEW IN',edit:'DELÙ EDIT',visit:'DELÙ, IN REAL LIFE.',visitText:'Via Roma 27 · Follonica, Tuscany. Visit us or discover the edit online.',shop:'SHOP',search:'SEARCH',wishlist:'WISHLIST'},
  fr:{season:'NEW SEASON / 2026',heroA:'Portez',heroB:'le moment.',heroText:'Une sélection féminine contemporaine et affirmée, choisie à Follonica.',discover:'DÉCOUVRIR LA COLLECTION',place:'FOLLONICA · TOSCANE',statementA:'PLUS QUE DES VÊTEMENTS.',statementB:'UNE ATTITUDE.',statementText:'Des pièces choisies pour se faire remarquer. Féminine, affirmée, DeLù.',campaignLabel:'DELÙ / EXPÉRIENCE',campaignA:'Féminine.',campaignAText:'Lignes, détails et caractère. Le look commence par ce que vous voulez ressentir.',campaignB:'Affirmée.',campaignBText:'Pas de bruit inutile. Des pièces qui entrent dans la pièce avant vous.',campaignC:'À vous.',campaignCText:'Pas un uniforme. Une sélection à interpréter, associer et rendre personnelle.',newLabel:'NOUVEAUTÉS',newTitle:'New icons.',viewAll:'VOIR TOUT',open:'DÉCOUVRIR',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'Vous ne suivez pas le look. Vous le créez.',editorialText:'Nouveautés, capsules et sélections pour les femmes qui choisissent leur style.',editorialCta:'ENTRER DANS LA BOUTIQUE',moods:'CHOISISSEZ VOTRE MOOD',newIn:'NOUVEAUTÉS',edit:'DELÙ EDIT',visit:'DELÙ, EN VRAI.',visitText:'Via Roma 27 · Follonica, Toscane. Venez nous voir ou découvrez la sélection en ligne.',shop:'BOUTIQUE',search:'RECHERCHER',wishlist:'FAVORIS'},
  de:{season:'NEW SEASON / 2026',heroA:'Trag',heroB:'den Moment.',heroText:'Eine moderne, feminine Auswahl aus Follonica in der Toskana.',discover:'KOLLEKTION ENTDECKEN',place:'FOLLONICA · TOSKANA',statementA:'NICHT NUR KLEIDUNG.',statementB:'EINE HALTUNG.',statementText:'Pieces, die auffallen. Feminin, selbstbewusst, DeLù.',campaignLabel:'DELÙ / EXPERIENCE',campaignA:'Feminin.',campaignAText:'Linien, Details und Charakter. Der Look beginnt mit dem Gefühl, das du willst.',campaignB:'Selbstbewusst.',campaignBText:'Kein unnötiger Lärm. Nur Pieces, die vor dir den Raum betreten.',campaignC:'Deins.',campaignCText:'Keine Uniform. Eine Auswahl zum Interpretieren, Kombinieren und Personalisieren.',newLabel:'NEU EINGETROFFEN',newTitle:'New icons.',viewAll:'ALLE ANSEHEN',open:'ENTDECKEN',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'Du folgst keinem Look. Du kreierst ihn.',editorialText:'Neuheiten, Capsules und kuratierte Auswahl für Frauen mit eigenem Stil.',editorialCta:'ZUM SHOP',moods:'WÄHLE DEINEN MOOD',newIn:'NEUHEITEN',edit:'DELÙ EDIT',visit:'DELÙ, LIVE.',visitText:'Via Roma 27 · Follonica, Toskana. Besuche uns oder entdecke die Auswahl online.',shop:'SHOP',search:'SUCHE',wishlist:'WUNSCHLISTE'},
  es:{season:'NEW SEASON / 2026',heroA:'Viste',heroB:'el momento.',heroText:'Una selección femenina contemporánea y con carácter, elegida en Follonica.',discover:'DESCUBRE LA COLECCIÓN',place:'FOLLONICA · TOSCANA',statementA:'NO SOLO ROPA.',statementB:'UNA ACTITUD.',statementText:'Prendas elegidas para hacerse notar. Femenina, decidida, DeLù.',campaignLabel:'DELÙ / EXPERIENCIA',campaignA:'Femenina.',campaignAText:'Líneas, detalles y carácter. El look empieza por cómo quieres sentirte.',campaignB:'Decidida.',campaignBText:'Sin ruido innecesario. Prendas que entran en la habitación antes que tú.',campaignC:'Tuya.',campaignCText:'No es un uniforme. Una selección para interpretar, combinar y hacer personal.',newLabel:'RECIÉN LLEGADO',newTitle:'New icons.',viewAll:'VER TODO',open:'DESCUBRIR',editorialLabel:'DELÙ / EDITORIAL 01',editorialTitle:'No sigues el look. Lo creas.',editorialText:'Novedades, cápsulas y selecciones para mujeres que eligen su propio estilo.',editorialCta:'ENTRAR EN LA TIENDA',moods:'ELIGE TU MOOD',newIn:'NOVEDADES',edit:'DELÙ EDIT',visit:'DELÙ, EN PERSONA.',visitText:'Via Roma 27 · Follonica, Toscana. Visítanos o descubre la selección online.',shop:'TIENDA',search:'BUSCAR',wishlist:'FAVORITOS'}
}

const copy:Record<Locale,HomeCopy>={...baseCopy,uk:{...baseCopy.en,heroA:'Одягни',heroB:'свій момент.',heroText:'Сучасний жіночий стиль, ретельно обраний у Фоллоніці.',discover:'ВІДКРИТИ КОЛЕКЦІЮ',statementA:'БІЛЬШЕ, НІЖ ОДЯГ.',statementB:'ТВІЙ ХАРАКТЕР.',statementText:'Жіночні деталі. Впевненість. DeLù.',campaignA:'Жіночність.',campaignAText:'Лінії, деталі та характер. Стиль починається з відчуття.',campaignB:'Впевненість.',campaignBText:'Речі, які допомагають виразити себе.',campaignC:'Твій вибір.',campaignCText:'Поєднуй та створюй власний стиль.',newLabel:'НОВІ НАДХОДЖЕННЯ',viewAll:'ПЕРЕГЛЯНУТИ ВСЕ',open:'ВІДКРИТИ',editorialTitle:'Не наслідуй стиль. Створюй його.',editorialText:'Новинки та добірки для жінок, які обирають свій стиль.',editorialCta:'ДО МАГАЗИНУ',moods:'ОБЕРИ СВІЙ СТИЛЬ',newIn:'НОВІ НАДХОДЖЕННЯ',visit:'DELÙ, НАЖИВО.',visitText:'Via Roma 27 · Фоллоніка, Тоскана. Завітайте до нас або перегляньте колекцію онлайн.',shop:'МАГАЗИН',search:'ПОШУК',wishlist:'УЛЮБЛЕНЕ'},ru:{...baseCopy.en,heroA:'Одень',heroB:'свой момент.',heroText:'Современный женственный стиль, отобранный во Фоллонике.',discover:'ОТКРЫТЬ КОЛЛЕКЦИЮ',statementA:'БОЛЬШЕ, ЧЕМ ОДЕЖДА.',statementB:'ТВОЙ ХАРАКТЕР.',statementText:'Женственные детали. Уверенность. DeLù.',campaignA:'Женственность.',campaignAText:'Линии, детали и характер. Стиль начинается с ощущения.',campaignB:'Уверенность.',campaignBText:'Вещи, которые помогают выразить себя.',campaignC:'Твой выбор.',campaignCText:'Сочетай и создавай собственный стиль.',newLabel:'НОВЫЕ ПОСТУПЛЕНИЯ',viewAll:'СМОТРЕТЬ ВСЁ',open:'ОТКРЫТЬ',editorialTitle:'Не следуй стилю. Создавай его.',editorialText:'Новинки и подборки для женщин, которые выбирают свой стиль.',editorialCta:'В МАГАЗИН',moods:'ВЫБЕРИ СВОЙ СТИЛЬ',newIn:'НОВЫЕ ПОСТУПЛЕНИЯ',visit:'DELÙ, ВЖИВУЮ.',visitText:'Via Roma 27 · Фоллоника, Тоскана. Приходите к нам или смотрите коллекцию онлайн.',shop:'МАГАЗИН',search:'ПОИСК',wishlist:'ИЗБРАННОЕ'}}

const localeTag:Record<Locale,string>={it:'it-IT',en:'en-GB',fr:'fr-FR',de:'de-DE',es:'es-ES',uk:'uk-UA',ru:'ru-RU'}
const money=(value:number,locale:Locale)=>new Intl.NumberFormat(localeTag[locale],{style:'currency',currency:'EUR'}).format(value)

function HomeInner(){
  const{locale,setLocale,localeNames,t}=useLocale()
  const c=copy[locale]
  const reducedMotion=useReducedMotion()
  // Preserve old section deep links even though the chapter dock is replaced with the shop actions.
  useEffect(()=>{
    const id=window.location.hash.slice(1)
    if(!['experience','wardrobe','new-icons','editorial','visit'].includes(id))return
    const frame=requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'}))
    return()=>cancelAnimationFrame(frame)
  },[])
  const [scrolled,setScrolled]=useState(false)
  const [travel,setTravel]=useState(0)
  const {scrollYProgress:pageProgress}=useScroll()
  const readingProgress=useSpring(pageProgress,{stiffness:100,damping:30})
  const trackRef=useRef<HTMLDivElement>(null)
  const heroRef=useRef<HTMLElement>(null)
  const showcaseRef=useRef<HTMLElement>(null)
  const editorialRef=useRef<HTMLElement>(null)
  const{scrollYProgress:heroProgress}=useScroll({target:heroRef,offset:['start start','end start']})
  const{scrollYProgress:showcaseProgress}=useScroll({target:showcaseRef,offset:['start start','end end']})
  const{scrollYProgress:editorialProgress}=useScroll({target:editorialRef,offset:['start end','end start']})
  const heroScale=useTransform(heroProgress,[0,1],[1,1.12])
  const heroY=useTransform(heroProgress,[0,1],['0%','12%'])
  const heroTextY=useTransform(heroProgress,[0,1],['0%','-22%'])
  const trackX=useTransform(showcaseProgress,[0,1],[0,-travel])
  useMotionValueEvent(heroProgress,'change',value=>setScrolled(value>.08))
  useEffect(()=>{
    const element=trackRef.current
    if(!element)return
    const measure=()=>setTravel(Math.max(0,element.scrollWidth-(window.innerWidth*(window.innerWidth<=980?.92:.69))))
    const observer=new ResizeObserver(measure)
    observer.observe(element)
    const mutations=new MutationObserver(measure)
    mutations.observe(element,{childList:true,subtree:true})
    window.addEventListener('resize',measure)
    measure()
    return()=>{observer.disconnect();mutations.disconnect();window.removeEventListener('resize',measure)}
  },[])
  const track=useSpring(trackX,{stiffness:85,damping:22,mass:.35})
  const editorialClip=useTransform(editorialProgress,[0,.42,.85,1],['inset(9% 6% 9% 6% round 12px)','inset(0% 0% 0% 0% round 0px)','inset(0% 0% 0% 0% round 0px)','inset(3% 2% 3% 2% round 8px)'])
  const editorialScale=useTransform(editorialProgress,[0,1],[1.08,1])
  const editorialY=useTransform(editorialProgress,[0,1],['-4%','4%'])
  const featured=(products.filter(p=>p.active!==false&&p.new).length?products.filter(p=>p.active!==false&&p.new):products.filter(p=>p.active!==false)).slice(0,4)

  return <main className={`ph-root ph-atelier${scrolled?" atelier-scrolled":""}`}>
    <motion.div className="atelier-reading-progress" aria-hidden="true" style={{scaleX:readingProgress}}/>
    <header className={`ph-header${scrolled?' is-scrolled':''}`}>
      <Link className="ph-head-link" to="/shop">{c.shop}</Link>
      <Link className="ph-logo" to="/" aria-label="DeLù Clothes Shop"><img src="/delu-logo.svg" alt="DeLù Clothes Shop"/><span className="delu-tagline">{t('brandTagline')}</span></Link>
      <div className="ph-head-actions">
        <Link to="/shop?search=1" aria-label={c.search}><Search/></Link>
        <Link to="/account" aria-label={t('account')}><UserRound/></Link>
        <label className="ph-language"><Globe2 aria-hidden="true"/><select aria-label="Language" value={locale} onChange={e=>setLocale(e.target.value as Locale)}>{Object.entries(localeNames).map(([key,label])=><option key={key} value={key}>{key.toUpperCase()} · {label}</option>)}</select></label>
      </div>
    </header>

    <section id="home" ref={heroRef} className="ph-hero" data-testid="home-hero">
      <motion.div className="ph-hero-media" style={reducedMotion?undefined:{scale:heroScale,y:heroY}}>
        <img fetchPriority="high" src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=90" alt="DeLù editorial"/>
      </motion.div>
      <div className="ph-hero-shade"/>
      <motion.div className="ph-hero-copy" style={reducedMotion?undefined:{y:heroTextY}}>
        <motion.span initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.15,duration:.7}}>{c.season}</motion.span>
        <div className="ph-hero-title" role="heading" aria-level={1} aria-label={`${c.heroA} ${c.heroB}`}>
          <motion.div initial={{y:'115%'}} animate={{y:0}} transition={{delay:.2,duration:.9,ease:[.16,1,.3,1]}}>{c.heroA}</motion.div>
          <motion.div className="is-italic" initial={{y:'115%'}} animate={{y:0}} transition={{delay:.3,duration:.95,ease:[.16,1,.3,1]}}>{c.heroB}</motion.div>
        </div>
        <motion.p initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.75}}>{c.heroText}</motion.p>
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.5,duration:.7}}><Link className="ph-hero-cta" to="/shop">{c.discover}<ArrowDownRight/></Link></motion.div>
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

    <div id="experience" className="ph-wardrobe-entry" data-testid="wardrobe-first-experience">
      <WardrobeRail/>
    </div>

    <section id="new-icons" ref={showcaseRef} className="ph-showcase">
      <div className="ph-showcase-sticky">
        <div className="ph-showcase-title">
          <span>{c.newLabel}</span>
          <h2>{c.newTitle}</h2>
          <p>01 — {String(featured.length).padStart(2,'0')}</p>
          <Link to="/shop?new=1">{c.viewAll}<ArrowRight/></Link>
        </div>
        <motion.div ref={trackRef} className="ph-product-track" style={reducedMotion?undefined:{x:track}}>
          {featured.map((p,index)=><motion.article className="ph-card" key={p.id} whileHover={{y:-12}} transition={{type:'spring',stiffness:260,damping:22}}>
            <TiltCard><Link className="ph-card-image" to={`/product/${p.id}`}>
              <motion.img loading="lazy" decoding="async" src={p.image} alt={p.name} whileHover={{scale:1.035}} transition={{duration:.75,ease:[.16,1,.3,1]}}/>
              <span>{String(index+1).padStart(2,'0')}</span>
              {p.new&&<b>NEW</b>}
              <i>{c.open}<ArrowDownRight/></i>
            </Link></TiltCard>
            <div className="ph-card-meta"><div><small>{p.category}</small><Link to={`/product/${p.id}`}>{p.name}</Link></div><strong>{money(p.price,locale)}</strong></div>
          </motion.article>)}
        </motion.div>
      </div>
    </section>

    <motion.section id="editorial" ref={editorialRef} className="ph-editorial" style={reducedMotion?undefined:{clipPath:editorialClip}}>
      <motion.div className="ph-editorial-image" style={reducedMotion?undefined:{scale:editorialScale,y:editorialY}}><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2200&q=90" alt="DeLù style"/></motion.div>
      <div className="ph-editorial-shade"/>
      <div className="ph-editorial-copy"><span>{c.editorialLabel}</span><motion.h2 initial={{opacity:.25,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.45}} transition={{duration:1.05,ease:[.16,1,.3,1]}}>{c.editorialTitle}</motion.h2><p>{c.editorialText}</p><Link to="/shop">{c.editorialCta}<ArrowRight/></Link></div>
      <div className="ph-editorial-word">DELÙ</div>
    </motion.section>

    <section id="visit" className="ph-visit">
      <div className="ph-visit-top"><MapPin/><span>42.9257° N · 10.7616° E</span></div>
      <motion.h2 initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.5}} transition={{duration:.85,ease:[.16,1,.3,1]}}>{c.visit}</motion.h2>
      <p>{c.visitText}</p>
      <div className="ph-visit-links"><a href="https://maps.google.com/?q=Via+Roma+27+Follonica" target="_blank" rel="noreferrer">VIA ROMA 27 <ArrowRight/></a><a href="https://instagram.com/delu.clotheshop" target="_blank" rel="noreferrer"><AtSign/> @DELU.CLOTHESHOP</a></div>
      <Link className="withdrawal-link" to="/returns">{t('withdrawHere')}</Link><div className="ph-visit-ghost">DELÙ</div>
    </section>
    <div className="home-service-links"><small>Creato da Daniele Zobel</small></div>
    <div className="home-shop-dock"><QuickNavigation/></div>
  </main>
}

export default function PremiumHome(){return <LocaleProvider><HomeInner/></LocaleProvider>}
