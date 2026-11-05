import {useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react'
import {Link} from 'react-router-dom'
import {ArrowLeft,ArrowRight,ArrowUpRight,MoveHorizontal} from 'lucide-react'
import {useLocale,type Locale} from './i18n'
import type {Product} from './data'


const translations:Record<Locale,{title:string;subtitle:string;prev:string;next:string;view:string;stock:string;swipe:string;loading:string;empty:string;error:string;shop:string}>={
 it:{title:'Il guardaroba prende vita.',subtitle:'Scorri i capi della nostra selezione. Scegli il tuo stile.',prev:'Capo precedente',next:'Capo successivo',view:'SCOPRI IL CAPO',stock:'disponibili',swipe:'Trascina o usa le frecce',loading:'Prepariamo il guardaroba…',empty:'La selezione è in aggiornamento.',error:'Non è possibile caricare ora il magazzino.',shop:'ESPLORA LO SHOP'},
 en:{title:'The wardrobe comes alive.',subtitle:'Browse the edit. Find your next favorite piece.',prev:'Previous piece',next:'Next piece',view:'EXPLORE THE PIECE',stock:'available',swipe:'Swipe or use the arrows',loading:'Preparing your wardrobe…',empty:'The selection is being updated.',error:'Stock is temporarily unavailable.',shop:'EXPLORE THE SHOP'},
 fr:{title:'Le dressing prend vie.',subtitle:'Faites défiler notre sélection.',prev:'Article précédent',next:'Article suivant',view:'DÉCOUVRIR LA PIÈCE',stock:'disponibles',swipe:'Glissez ou utilisez les flèches',loading:'Préparation du dressing…',empty:'La sélection est mise à jour.',error:'Stock momentanément indisponible.',shop:'VOIR LA BOUTIQUE'},
 de:{title:'Dein Kleiderschrank lebt.',subtitle:'Entdecke deine nächsten Lieblingsstücke.',prev:'Vorheriger Artikel',next:'Nächster Artikel',view:'ARTIKEL ENTDECKEN',stock:'verfügbar',swipe:'Wischen oder Pfeile nutzen',loading:'Wir bereiten die Auswahl vor…',empty:'Die Auswahl wird aktualisiert.',error:'Bestand derzeit nicht verfügbar.',shop:'ZUM SHOP'},
 es:{title:'El armario cobra vida.',subtitle:'Descubre nuestra selección.',prev:'Prenda anterior',next:'Prenda siguiente',view:'DESCUBRIR PRENDA',stock:'disponibles',swipe:'Desliza o usa las flechas',loading:'Preparando el armario…',empty:'Estamos renovando la selección.',error:'El stock no está disponible ahora.',shop:'VER LA TIENDA'},
 uk:{title:'Гардероб оживає.',subtitle:'Знайдіть новий улюблений образ.',prev:'Попередній товар',next:'Наступний товар',view:'ПЕРЕГЛЯНУТИ ТОВАР',stock:'в наявності',swipe:'Гортайте або натискайте стрілки',loading:'Готуємо гардероб…',empty:'Добірка оновлюється.',error:'Немає даних про залишки.',shop:'ДО МАГАЗИНУ'},
 ru:{title:'Гардероб оживает.',subtitle:'Выбирайте свои любимые вещи.',prev:'Предыдущий товар',next:'Следующий товар',view:'СМОТРЕТЬ ТОВАР',stock:'в наличии',swipe:'Листайте или нажимайте стрелки',loading:'Готовим гардероб…',empty:'Подборка обновляется.',error:'Данные о наличии недоступны.',shop:'В МАГАЗИН'}
}
const currencyLocales:Record<Locale,string>={it:'it-IT',en:'en-GB',fr:'fr-FR',de:'de-DE',es:'es-ES',uk:'uk-UA',ru:'ru-RU'}
const currency=(value:number,locale:Locale)=>new Intl.NumberFormat(currencyLocales[locale],{style:'currency',currency:'EUR'}).format(value)

/** Never display demo catalogue products or made-up prices: only API-returned D1 records. */
export function availableRailProducts(input:unknown):Product[]{
 if(!Array.isArray(input))return []
 return input.filter((raw):raw is Product=>{
  if(!raw||typeof raw!=='object')return false
  const p=raw as Partial<Product>
  return p.active!==false&&typeof p.id==='string'&&!!p.id&&typeof p.name==='string'&&!!p.name&&typeof p.image==='string'&&!!p.image&&
   typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0&&typeof p.stock==='number'&&Number.isInteger(p.stock)&&p.stock>0
 }).sort((a,b)=>Number(!!b.new)-Number(!!a.new)||Number(!!b.featured)-Number(!!a.featured)).slice(0,8)
}
function offsetFor(index:number,active:number,count:number){
 let offset=(index-active+count)%count
 if(offset>Math.floor(count/2))offset-=count
 return offset
}
function Hanger(){
 return <svg viewBox="0 0 160 50" width="160" height="50" aria-hidden="true"><path d="M79 13c-2-12 14-12 14-1 0 7-9 9-9 14M80 26 15 44q-8 2-8-3t9-7l59-17q5-2 11 0l59 17q10 4 7 9-2 5-11 1Z" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
}
export default function WardrobeRail({hero=false}:{hero?:boolean}){
 const hostname=typeof window==='undefined'?'':window.location.hostname
 const preview=hostname==='localhost'||hostname==='127.0.0.1'||(hostname.endsWith('.delu-49u.pages.dev')&&hostname!=='delu-49u.pages.dev')
 const linkFor=(id:string)=>preview?'https://delu-49u.pages.dev/product/'+encodeURIComponent(id):'/product/'+encodeURIComponent(id)
 const {locale}=useLocale(),t=translations[locale]
 const section=useRef<HTMLElement|null>(null),drag=useRef<{x:number;y:number}|null>(null),swiped=useRef(false)
 const [near,setNear]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(false)
 const [items,setItems]=useState<Product[]>([]),[active,setActive]=useState(0)
 useEffect(()=>{
  const el=section.current
  if(!el)return
  if(!('IntersectionObserver' in window)){setNear(true);return}
  const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){setNear(true);observer.disconnect()}},{rootMargin:'350px 0px'})
  observer.observe(el)
  return()=>observer.disconnect()
 },[])
 useEffect(()=>{
  if(!near)return
  const controller=new AbortController()
  fetch(preview?'/wardrobe-catalog.json':'/api/products',{signal:controller.signal,cache:'no-store',headers:{accept:'application/json'}})
   .then(async r=>{if(!r.ok)throw new Error('Products unavailable');return r.json()})
   .then(data=>{if(controller.signal.aborted)return;const rows=preview?data?.products:data;if(!Array.isArray(rows))throw new Error('Invalid catalogue format');setItems(availableRailProducts(rows));setActive(0);setLoading(false)})
   .catch(e=>{if(controller.signal.aborted)return;console.error('DELÙ wardrobe API',e);setError(true);setLoading(false)})
  return()=>controller.abort()
 },[near])
 const total=items.length,product=items[active]
 const go=(direction:number)=>setActive(current=>(current+direction+total)%total)
 const pointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(event.pointerType==='mouse'&&event.button!==0)return
  drag.current={x:event.clientX,y:event.clientY};swiped.current=false
 }
 const pointerUp=(event:ReactPointerEvent<HTMLDivElement>)=>{
  const started=drag.current;drag.current=null
  if(!started||total<2)return
  const dx=event.clientX-started.x,dy=event.clientY-started.y
  if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.2){swiped.current=true;go(dx<0?1:-1)}
 }
 return <section ref={section} id="wardrobe" className={"dl-wardrobe"+(hero?" dl-wardrobe--hero":"")} data-testid="live-wardrobe" aria-label="DELÙ digital wardrobe">
  <header className="dl-wardrobe-heading"><span>DELÙ / DIGITAL WARDROBE</span>{hero?<h1>{t.title}</h1>:<h2>{t.title}</h2>}<p>{t.subtitle}</p></header>
  {loading||error||!total?<div className="dl-wardrobe-placeholder" aria-live="polite"><Hanger/><p>{loading?t.loading:error?t.error:t.empty}</p>{!loading&&<Link to="/shop">{t.shop}<ArrowUpRight size={16}/></Link>}</div>:<>
   <div className="dl-wardrobe-stage" role="region" aria-roledescription="carousel" aria-label="DELÙ wardrobe products" tabIndex={0}
     onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null}}
     onKeyDown={event=>{if(event.key==='ArrowRight'){event.preventDefault();go(1)}if(event.key==='ArrowLeft'){event.preventDefault();go(-1)}}}>
     <div className="dl-wardrobe-rod" aria-hidden="true"/>
     {items.map((item,index)=>{
      const offset=offsetFor(index,active,total),current=index===active
      const style={'--rail-index':offset,'--rail-turn':(offset===0?0:offset<0?34:-34)+'deg','--rail-scale':current?1:Math.abs(offset)===1?.83:.65,'--rail-depth':(current?0:Math.abs(offset)===1?-24:-70)+'px','--rail-opacity':Math.abs(offset)<=2?1:0,zIndex:10-Math.abs(offset)} as CSSProperties
      return <div key={item.id} className={'dl-wardrobe-item'+(current?' is-current':'')} style={style} data-offset={offset} aria-hidden={!current}>
       <div className="dl-wardrobe-hook"><Hanger/></div>
       <a href={linkFor(item.id)} tabIndex={current?0:-1} className="dl-wardrobe-photo"
        onClick={event=>{if(swiped.current||!current){event.preventDefault();swiped.current=false;if(!current)setActive(index)}}}
        aria-label={item.name+' · '+currency(item.price,locale)}>
        <img src={item.image} alt={item.imageAlt||item.name} loading="lazy" decoding="async" draggable={false}/>
        <span className="dl-wardrobe-photo-tag">DELÙ · {String(index+1).padStart(2,'0')}</span>
       </a>
      </div>
     })}
     <div className="dl-wardrobe-stage-bottom" aria-hidden="true">DELÙ <span>FOLLONICA — ITALY</span></div>
   </div>
   <div className="dl-wardrobe-controls">
    <button type="button" aria-label={t.prev} disabled={total<2} onClick={()=>go(-1)}><ArrowLeft size={21}/></button>
    <div className="dl-wardrobe-selected" aria-live="polite" aria-atomic="true">
     <span>{String(active+1).padStart(2,'0')} / {String(total).padStart(2,'0')} · {product.category}</span>
     <h3>{product.name}</h3>
     <div className="dl-wardrobe-selected-meta"><strong>{currency(product.price,locale)}</strong><span>{product.stock} {t.stock}</span></div>
     <a href={linkFor(product.id)}>{t.view}<ArrowUpRight size={17}/></a>
    </div>
    <button type="button" aria-label={t.next} disabled={total<2} onClick={()=>go(1)}><ArrowRight size={21}/></button>
   </div>
   {preview&&<p className="dl-wardrobe-preview-note">Disponibilità indicativa della preview. Prezzo e quantità aggiornati vengono verificati nello shop ufficiale prima dell'acquisto.</p>}
   <div className="dl-wardrobe-bottom"><span><MoveHorizontal size={17}/>{t.swipe}</span><div className="dl-wardrobe-dots" role="group" aria-label="Garment selection">{items.map((item,index)=><button type="button" aria-label={(index+1)+' / '+total+': '+item.name} key={item.id} aria-pressed={active===index} onClick={()=>setActive(index)}/>)}</div></div>
  </>}
 </section>
}
