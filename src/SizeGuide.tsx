import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ruler, X, ArrowUpRight } from 'lucide-react'
import { useLocale } from './i18n'

// General body-size reference, never a claim about an individual garment.
// https://www.zalando-prive.it/sizehelper/women/measure/
const rows=[
  {size:'XXS',it:36,bust:[72,75],waist:[60,62],hips:[81,84]},
  {size:'XS',it:38,bust:[76,79],waist:[63,65],hips:[85,88]},
  {size:'S',it:40,bust:[80,83],waist:[66,68],hips:[89,92]},
  {size:'M',it:42,bust:[84,87],waist:[69,71],hips:[93,96]},
  {size:'L',it:44,bust:[88,91],waist:[72,75],hips:[97,99]},
  {size:'XL',it:46,bust:[92,95],waist:[76,79],hips:[100,102]},
  {size:'XXL',it:48,bust:[96,99],waist:[80,82],hips:[103,105]},
]
export default function SizeGuide({selected,oneSize,availableSizes,onSelect}:{selected:string;oneSize:boolean;availableSizes?:string[];onSelect?:(size:string)=>void}){
  const{t,locale}=useLocale()
  const[open,setOpen]=useState(false)
  const[unit,setUnit]=useState<'cm'|'in'>('cm')

  const[height,setHeight]=useState(165)
  const[weight,setWeight]=useState(65)
  const[measurements,setMeasurements]=useState({bust:'',waist:'',hips:''})
  const[fitPreference,setFitPreference]=useState<'regular'|'relaxed'>('regular')
  const fitCopy={
    it:{title:'Il tuo Fit Finder',subtitle:'Un primo orientamento, poi la misura giusta.',height:'Altezza',weight:'Peso',measure:'Le tue misure (cm)',optional:'Facoltative, ma consigliate per una stima più affidabile',regular:'Vestibilità regolare',relaxed:'Più morbida',recommended:'Taglia indicativa',select:'SELEZIONA QUESTA TAGLIA',unavailable:'Questa taglia non è presente tra le varianti del prodotto.',need:'Inserisci almeno una misura del corpo per vedere la taglia indicativa.',outside:'Le misure inserite escono dalla tabella standard. Chiedici assistenza.',warning:'Altezza e peso non determinano da soli la taglia. La stima usa le misure inserite ed è generale, non specifica del capo.',partial:'Per una stima migliore inserisci seno, vita e fianchi.'},
    en:{title:'Your fit finder',subtitle:'A starting point for your best fit.',height:'Height',weight:'Weight',measure:'Body measurements (cm)',optional:'Optional, but recommended for a more useful estimate',regular:'Regular fit',relaxed:'Roomier fit',recommended:'Estimated size',select:'SELECT THIS SIZE',unavailable:'This size is not offered for this product.',need:'Enter at least one body measurement to estimate your size.',outside:'Your measurements fall outside this general chart. Please ask us for guidance.',warning:'Height and weight alone cannot determine size. This estimate uses entered measurements and is not garment-specific.',partial:'For a better estimate enter bust, waist and hips.'},
    fr:{title:'Trouver ma taille',subtitle:'Un premier repère pour votre tenue.',height:'Taille',weight:'Poids',measure:'Mensurations (cm)',optional:'Facultatives, recommandées pour une meilleure estimation',regular:'Coupe normale',relaxed:'Plus ample',recommended:'Taille indicative',select:'CHOISIR CETTE TAILLE',unavailable:'Cette taille n’est pas disponible pour ce produit.',need:'Saisissez au moins une mensuration.',outside:'Vos mensurations dépassent ce tableau général. Contactez-nous.',warning:'La taille et le poids seuls ne suffisent pas. Cette estimation est générale, non spécifique au vêtement.',partial:'Ajoutez poitrine, taille et hanches pour une meilleure estimation.'},
    de:{title:'Dein Größenberater',subtitle:'Eine erste Orientierung zur Passform.',height:'Körpergröße',weight:'Gewicht',measure:'Körpermaße (cm)',optional:'Optional, für genauere Schätzung empfohlen',regular:'Normal',relaxed:'Locker',recommended:'Ungefähre Größe',select:'GRÖSSE ÜBERNEHMEN',unavailable:'Diese Größe gibt es bei diesem Artikel nicht.',need:'Bitte mindestens ein Körpermaß angeben.',outside:'Die Maße liegen außerhalb der Tabelle. Kontaktiere uns.',warning:'Größe und Gewicht allein reichen nicht aus. Die Schätzung ist allgemein, nicht produktspezifisch.',partial:'Für ein besseres Ergebnis Brust, Taille und Hüfte eingeben.'},
    es:{title:'Encuentra tu talla',subtitle:'Un punto de partida para tu ajuste.',height:'Altura',weight:'Peso',measure:'Medidas corporales (cm)',optional:'Opcionales, recomendadas para mejor estimación',regular:'Normal',relaxed:'Holgado',recommended:'Talla orientativa',select:'ELEGIR ESTA TALLA',unavailable:'Esta talla no está disponible para este producto.',need:'Introduce al menos una medida corporal.',outside:'Tus medidas están fuera de esta tabla general. Consúltanos.',warning:'Altura y peso no bastan para elegir talla. Esta estimación es general, no del producto.',partial:'Para mejorar la estimación indica pecho, cintura y cadera.'},
    uk:{title:'Підбір розміру',subtitle:'Орієнтир для зручної посадки.',height:'Зріст',weight:'Вага',measure:'Параметри тіла (см)',optional:'Необов’язково, але рекомендовано',regular:'Звичайна посадка',relaxed:'Вільніша',recommended:'Орієнтовний розмір',select:'ОБРАТИ РОЗМІР',unavailable:'Цього розміру немає для товару.',need:'Введіть хоча б один параметр тіла.',outside:'Параметри виходять за межі таблиці. Зверніться до нас.',warning:'Зріст і вага самі по собі не визначають розмір. Це загальна оцінка, не для конкретного виробу.',partial:'Для точності вкажіть груди, талію і стегна.'},
    ru:{title:'Подбор размера',subtitle:'Первый ориентир по посадке.',height:'Рост',weight:'Вес',measure:'Мерки тела (см)',optional:'Необязательно, но желательно',regular:'Обычная посадка',relaxed:'Свободнее',recommended:'Примерный размер',select:'ВЫБРАТЬ РАЗМЕР',unavailable:'Этого размера нет у товара.',need:'Укажите хотя бы одну мерку тела.',outside:'Мерки выходят за таблицу. Свяжитесь с нами.',warning:'Рост и вес сами по себе не определяют размер. Оценка общая, а не для конкретного изделия.',partial:'Для точности укажите грудь, талию и бедра.'}
  }[locale]
  const measurementsEntered=(['bust','waist','hips'] as const).filter(key=>measurements[key]!==''&&Number.isFinite(Number(measurements[key]))&&Number(measurements[key])>0)
  const index=measurementsEntered.length?rows.findIndex(row=>measurementsEntered.every(key=>Number(measurements[key])<=row[key][1])):-1
  const recommendation=index<0?null:rows[Math.min(rows.length-1,index+(fitPreference==='relaxed'?1:0))]
  const sizeIsAvailable=!!recommendation&&!!onSelect&&(!availableSizes||availableSizes.some(size=>size.trim().toUpperCase()===recommendation.size))
  const dialog=useRef<HTMLDialogElement>(null)
  const trigger=useRef<HTMLButtonElement>(null)
  const title=useId(),description=useId()
  useEffect(()=>{
    if(!open)return
    const element=dialog.current
    if(!element)return
    const overflow=document.documentElement.style.overflow
    document.documentElement.style.overflow='hidden'
    element.showModal()
    return()=>{element.close();document.documentElement.style.overflow=overflow;requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}))}
  },[open])
  const range=(values:number[])=>values.map(v=>new Intl.NumberFormat(locale,{maximumFractionDigits:unit==='cm'?0:1}).format(unit==='cm'?v:v/2.54)).join('–')
  return <>
    <button ref={trigger} type="button" className="ds-size-guide-trigger" onClick={()=>setOpen(true)}><Ruler size={16}/>{t('sizeGuide')}</button>
    {open&&createPortal(<dialog ref={dialog} className="ds-size-guide" aria-labelledby={title} aria-describedby={description}
      onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)}
      onClick={event=>{
        if(event.target!==event.currentTarget)return
        const b=event.currentTarget.getBoundingClientRect()
        if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)setOpen(false)
      }}>
      <header><div><span>DELÙ / FIT GUIDE</span><h2 id={title}>{t('guideTitle')}</h2></div><button type="button" autoFocus aria-label={t('guideClose')} onClick={()=>setOpen(false)}><X/></button></header>
      <div className="ds-size-guide-content">
        <p id={description}>{oneSize?t('guideOne'):t('guideIntro')}</p>

        {!oneSize&&<section className="ds-fit-finder" aria-label={fitCopy.title}>
          <div className="ds-fit-finder-intro"><span>DELÙ / PERSONAL FIT</span><h3>{fitCopy.title}</h3><p>{fitCopy.subtitle}</p></div>
          <div className="ds-fit-finder-body">
            <div className="ds-fit-persona" aria-hidden="true">
              <svg viewBox="0 0 120 200" role="presentation"><defs><linearGradient id="fit-pink" x1="0" x2="1"><stop offset="0" stopColor="#ebabc5"/><stop offset="1" stopColor="#aa547b"/></linearGradient></defs><circle cx="60" cy="30" r="19" fill="#f3d7e1" stroke="#9c647d"/><path d="M39 56Q60 48 81 56L98 104 87 112 78 84 81 130 88 186 67 191 60 140 53 191 32 186 39 130 42 84 33 112 22 104Z" fill="url(#fit-pink)" stroke="#9c647d" strokeWidth="1.4"/><path d="M33 110H87M38 130H82" stroke="#fff6fa" strokeDasharray="3 4" opacity=".9"/></svg>
              <span>{height} cm · {weight} kg</span>
            </div>
            <div className="ds-fit-inputs">
              <div className="ds-fit-sliders">
                <label>{fitCopy.height}<strong>{height} cm</strong><input type="range" min="145" max="195" step="1" value={height} onChange={event=>setHeight(Number(event.target.value))}/></label>
                <label>{fitCopy.weight}<strong>{weight} kg</strong><input type="range" min="40" max="130" step="1" value={weight} onChange={event=>setWeight(Number(event.target.value))}/></label>
              </div>
              <h4>{fitCopy.measure}</h4><p>{fitCopy.optional}</p>
              <div className="ds-fit-measures">{(['bust','waist','hips'] as const).map(key=><label key={key}>{t('guide'+key.charAt(0).toUpperCase()+key.slice(1))}<input type="number" inputMode="decimal" min="45" max="180" step="0.5" placeholder="—" value={measurements[key]} onChange={event=>setMeasurements(current=>({...current,[key]:event.target.value}))}/></label>)}</div>
              <div className="ds-fit-preferences" role="group" aria-label={fitCopy.recommended}><button type="button" aria-pressed={fitPreference==='regular'} onClick={()=>setFitPreference('regular')}>{fitCopy.regular}</button><button type="button" aria-pressed={fitPreference==='relaxed'} onClick={()=>setFitPreference('relaxed')}>{fitCopy.relaxed}</button></div>
            </div>
          </div>
          <div className="ds-fit-result" aria-live="polite">
            {recommendation?<><span>{fitCopy.recommended}</span><strong>{recommendation.size} <small>IT {recommendation.it}</small></strong>{measurementsEntered.length<3&&<p>{fitCopy.partial}</p>}{sizeIsAvailable&&<button type="button" onClick={()=>{onSelect?.(recommendation.size);setOpen(false)}}>{fitCopy.select}<ArrowUpRight size={16}/></button>}{!sizeIsAvailable&&<p>{fitCopy.unavailable}</p>}</>:<p>{measurementsEntered.length?fitCopy.outside:fitCopy.need}</p>}
          </div><p className="ds-fit-caveat">{fitCopy.warning}</p>
        </section>}
        {!oneSize&&<>
          <div className="ds-size-guide-tools"><span>{t('guideGeneral')}</span><div aria-label={t('guideUnits')}>{(['cm','in'] as const).map(value=><button type="button" key={value} aria-pressed={unit===value} onClick={()=>setUnit(value)}>{value}</button>)}</div></div>
          <div className="ds-size-table-wrap" tabIndex={0} role="region" aria-label={t('sizeGuide')}>
            <table><thead><tr><th scope="col">{t('guideSize')}</th><th scope="col">IT</th><th scope="col">{t('guideBust')} ({unit})</th><th scope="col">{t('guideWaist')} ({unit})</th><th scope="col">{t('guideHips')} ({unit})</th></tr></thead>
            <tbody>{rows.map(row=><tr key={row.size} className={selected===row.size?'is-selected':undefined}><th scope="row">{row.size}</th><td>{row.it}</td><td>{range(row.bust)}</td><td>{range(row.waist)}</td><td>{range(row.hips)}</td></tr>)}</tbody></table>
          </div>
          <h3>{t('guideMeasure')}</h3>
          <div className="ds-measure-help">
            <svg viewBox="0 0 160 230" aria-hidden="true"><path d="M62 12 Q80 20 98 12 L102 36 131 51 145 111 127 116 113 70 105 110 Q98 130 110 156 L121 211 85 218 80 168 75 218 39 211 50 156 Q62 130 55 110 L47 70 33 116 15 111 29 51 58 36Z" fill="#fbeaf1" stroke="#6e4e5c" strokeWidth="1.5"/>{[77,120,165].map((y,i)=><g key={y}><path d={'M42 '+y+'H118'} stroke="#b14e78" strokeWidth="2" strokeDasharray="4 3"/><circle cx="130" cy={y} r="10" fill="#201a1e"/><text x="130" y={y+3} textAnchor="middle" fill="white" fontSize="9">{i+1}</text></g>)}</svg>
            <ol>{['Bust','Waist','Hips'].map(key=><li key={key}><b>{t('guide'+key)}</b><p>{t('guide'+key+'Text')}</p></li>)}</ol>
          </div>
          <p className="ds-size-tip">{t('guideTip')}</p>
          <a className="ds-size-source" href="https://www.zalando-prive.it/sizehelper/women/measure/" target="_blank" rel="noreferrer">{t('guideSource')} · Privé by Zalando <ArrowUpRight size={12}/></a>
        </>}
        <a className="ds-size-contact" href="tel:+393317862178">{t('guideHelp')} <ArrowUpRight size={16}/></a>
      </div>
    </dialog>,document.body)}
  </>
}
