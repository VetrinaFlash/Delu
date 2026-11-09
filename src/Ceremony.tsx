import type {ReactNode} from 'react'
import {Link} from 'react-router-dom'
import {ArrowRight} from 'lucide-react'
import type {Product} from './data'
import {useLocale} from './i18n'
import {ceremonyCategories} from '../shared/catalog'
import './ceremony.css'

const copy={
 it:{eyebrow:'DELÙ EXCLUSIVE',title:'Cerimonia',claim:'Il lusso, a modo tuo.',text:'Abiti straordinari. Prezzi sorprendenti. Una selezione esclusiva per le occasioni più importanti.',cta:'Scopri la collezione',sections:'Scegli il tuo momento',all:'Tutta la collezione',soon:'La collezione è in arrivo.',pieces:'capi'},
 en:{eyebrow:'DELÙ EXCLUSIVE',title:'Ceremony',claim:'Luxury, your way.',text:'Extraordinary dresses. Surprising prices. An exclusive selection for life’s most important occasions.',cta:'Discover the collection',sections:'Choose your moment',all:'Full collection',soon:'The collection is coming soon.',pieces:'pieces'}
}
const names:Record<string,string>={'Abiti da cerimonia':'Abiti da cerimonia importanti','Mamma degli sposi':'Mamma degli sposi','Madrine e testimoni':'Madrine e testimoni','Abiti gioiello':'Abiti gioiello','Abiti lunghi da sera':'Abiti lunghi da sera','Collezioni esclusive':'Collezioni esclusive'}
const namesEn:Record<string,string>={'Abiti da cerimonia':'Statement ceremony dresses','Mamma degli sposi':'Mother of the bride & groom','Madrine e testimoni':'Bridesmaids & witnesses','Abiti gioiello':'Jewel dresses','Abiti lunghi da sera':'Long evening gowns','Collezioni esclusive':'Exclusive collections'}

export function CeremonyBanner(){
 const {locale}=useLocale(),c=locale==='it'?copy.it:copy.en
 return <section className="ceremony-banner" aria-label={c.title}><div><span>{c.eyebrow}</span><h2>{c.title}</h2><p>{c.claim} {c.text}</p></div><Link to="/cerimonia" className="ceremony-banner-cta">{c.cta}<ArrowRight/></Link></section>
}

export default function Ceremony({products,renderProduct}:{products:Product[];renderProduct:(p:Product)=>ReactNode}){
 const {locale}=useLocale(),c=locale==='it'?copy.it:copy.en,label=(k:string)=>(locale==='it'?names:namesEn)[k]||k
 const live=products.filter(p=>p.active!==false&&ceremonyCategories.includes(p.category))
 return <main className="ceremony">
  <section className="ceremony-hero"><span>{c.eyebrow}</span><h1>{c.title}</h1><strong>{c.claim}</strong><p>{c.text}</p><a href="#ceremony-collection" className="ds-button ds-button--light">{c.cta}<ArrowRight/></a></section>
  <section className="ceremony-sections" aria-label={c.sections}><h2>{c.sections}</h2><div>{ceremonyCategories.map(cat=>{const n=live.filter(p=>p.category===cat).length;return <Link key={cat} to={'/shop?category='+encodeURIComponent(cat)}><b>{label(cat)}</b><small>{n} {c.pieces}</small><ArrowRight/></Link>})}</div></section>
  <section className="ds-section ceremony-collection" id="ceremony-collection"><h2>{c.all}</h2>{live.length?<div className="ds-products">{live.map(p=>renderProduct(p))}</div>:<p className="ceremony-empty">{c.soon}</p>}</section>
 </main>
}
