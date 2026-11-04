import {useEffect,useRef} from 'react'
import {createPortal} from 'react-dom'
import {ChevronLeft,ChevronRight,X} from 'lucide-react'

type Props={images:string[];index:number;alt:string;onChange:(index:number)=>void;onClose:()=>void}
export default function ProductLightbox({images,index,alt,onChange,onClose}:Props){
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{
  const dialog=ref.current
  if(!dialog)return
  dialog.showModal()
  const before=document.documentElement.style.overflow
  document.documentElement.style.overflow='hidden'
  return()=>{if(dialog.open)dialog.close();document.documentElement.style.overflow=before}
 },[])
 const go=(delta:number)=>onChange((index+delta+images.length)%images.length)
 if(!images.length)return null
 return createPortal(<dialog ref={ref} className="ds-lightbox" aria-label={'Galleria fotografica: '+alt}
  onCancel={event=>{event.preventDefault();onClose()}}
  onClose={onClose}
  onClick={event=>{if(event.target===event.currentTarget)onClose()}}
  onKeyDown={event=>{
   if(event.key==='ArrowLeft'){event.preventDefault();go(-1)}
   if(event.key==='ArrowRight'){event.preventDefault();go(1)}
  }}>
  <div className="ds-lightbox-content">
   <div className="ds-lightbox-heading"><span>DELÙ / GALLERY</span><span>{index+1} / {images.length}</span><button type="button" autoFocus aria-label="Chiudi galleria" onClick={onClose}><X/></button></div>
   <div className="ds-lightbox-view">
    {images.length>1&&<button type="button" aria-label="Foto precedente" onClick={()=>go(-1)}><ChevronLeft/></button>}
    <img src={images[index]||images[0]} alt={alt+' — '+(index+1)+'/'+images.length}/>
    {images.length>1&&<button type="button" aria-label="Foto successiva" onClick={()=>go(1)}><ChevronRight/></button>}
   </div>
   {images.length>1&&<div className="ds-lightbox-thumbs" role="group" aria-label="Foto prodotto">{images.map((url,i)=><button key={url+'-'+i} type="button" aria-label={'Visualizza foto '+(i+1)} aria-pressed={i===index} onClick={()=>onChange(i)}><img src={url} alt=""/></button>)}</div>}
  </div>
 </dialog>,document.body)
}
