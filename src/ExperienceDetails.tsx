import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

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

export function ScrollSignature(){
  const ref=useRef<HTMLDivElement>(null)
  const reduced=useReducedMotion()
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']})
  const x=useTransform(scrollYProgress,[0,1],['3%','-18%'])
  return <div className="ph-signature" ref={ref} aria-hidden="true">
    <span className="ph-signature-label">FOLLONICA, TOSCANA / DELÙ</span>
    <motion.div style={reduced?undefined:{x}}><span>Femminile.</span><i>Decisa.</i><span>Tua.</span><b>✳</b><span>DeLù.</span></motion.div>
  </div>
}

export function ChapterNav({labels}:{labels:string[]}){
  const [active,setActive]=useState('')
  const ids=['experience','new-icons','editorial','visit']
  useEffect(()=>{
    // One observer; no per-frame React state or document-wide mutations.
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting)setActive(entry.target.id)
    },{rootMargin:'-25% 0px -65% 0px',threshold:0})
    const elements=['home',...ids].map(id=>document.getElementById(id)).filter(Boolean) as HTMLElement[]
    elements.forEach(el=>observer.observe(el))
    return()=>observer.disconnect()
  },[])
  return <nav className="ph-chapters" aria-label="DeLù chapters">
    {ids.map((id,index)=><a href={'#'+id} key={id} aria-current={active===id?'location':undefined}>
      <span>{String(index+1).padStart(2,'0')}</span><b>{labels[index]}</b>
      {active===id&&<motion.i layoutId="chapter-indicator" transition={{type:'spring',stiffness:340,damping:32}}/>}
    </a>)}
  </nav>
}
