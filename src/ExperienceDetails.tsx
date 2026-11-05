import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import QuickNavigation from './QuickNavigation'

export function TiltCard({children}:{children:ReactNode}){
  const reduced=useReducedMotion()
  const rx=useMotionValue(0),ry=useMotionValue(0)
  const rotateX=useSpring(rx,{stiffness:180,damping:24})
  const rotateY=useSpring(ry,{stiffness:180,damping:24})
  return <motion.div className="ph-tilt-card" style={reduced?undefined:{rotateX,rotateY,transformPerspective:1200}}
    onPointerMove={event=>{
      if(reduced||event.pointerType!=='mouse'||!window.matchMedia('(hover: hover)').matches)return
      const box=event.currentTarget.getBoundingClientRect()
      rx.set((.5-(event.clientY-box.top)/box.height)*5)
      ry.set(((event.clientX-box.left)/box.width-.5)*5)
    }}
    onPointerLeave={()=>{rx.set(0);ry.set(0)}}
    onPointerCancel={()=>{rx.set(0);ry.set(0)}}>{children}</motion.div>
}

export function ScrollSignature({words}:{words:string[]}){
  const ref=useRef<HTMLDivElement>(null)
  const reduced=useReducedMotion()
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']})
  const x=useTransform(scrollYProgress,[0,1],['3%','-18%'])
  return <div className="ph-signature" ref={ref} aria-hidden="true">
    <span className="ph-signature-label">FOLLONICA, TOSCANA / DELÙ</span>
    <motion.div style={reduced?undefined:{x}}><span>{words[0]}</span><i>{words[1]}</i><span>{words[2]}</span><b>✳</b><span>DeLù.</span></motion.div>
  </div>
}

/** The home dock uses the very same shopping links as the catalogue.
 * Preserve deep links to editorial chapters without dedicating the fixed bar to them. */
export function HomeShopDock(){
  useEffect(()=>{
    const targets=new Set(['experience','new-icons','editorial','visit'])
    const target=window.location.hash.slice(1)
    if(!targets.has(target))return
    const frame=requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({behavior:'instant',block:'start'}))
    return()=>cancelAnimationFrame(frame)
  },[])
  return <div className="ph-home-shop-dock"><QuickNavigation/></div>
}
