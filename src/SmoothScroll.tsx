import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

export default function SmoothScroll(){
  useEffect(()=>{
    const media=window.matchMedia('(pointer: fine) and (min-width: 901px)')
    if(!media.matches)return

    const lenis=new Lenis({
      autoRaf:true,
      smoothWheel:true,
      wheelMultiplier:.88,
      anchors:true,
      stopInertiaOnNavigate:true,
      respectReducedMotion:true,
      prevent:node=>Boolean((node as HTMLElement).closest?.('.ds-drawer,.ds-search-overlay,.ds-filter-panel,.ds-mobile-menu')),
    })

    return()=>lenis.destroy()
  },[])
  return null
}
