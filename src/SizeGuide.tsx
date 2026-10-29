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
export default function SizeGuide({selected,oneSize}:{selected:string;oneSize:boolean}){
  const{t,locale}=useLocale()
  const[open,setOpen]=useState(false)
  const[unit,setUnit]=useState<'cm'|'in'>('cm')
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
