import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring } from 'motion/react'
import { useLocation } from 'react-router-dom'

export default function WowMotion(){
  const location=useLocation()
  const {scrollYProgress}=useScroll()
  const progress=useSpring(scrollYProgress,{stiffness:170,damping:32,mass:.25})
  const mouseX=useMotionValue(-200),mouseY=useMotionValue(-200)
  const x=useSpring(mouseX,{stiffness:120,damping:24,mass:.25})
  const y=useSpring(mouseY,{stiffness:120,damping:24,mass:.25})
  const[intro,setIntro]=useState(true)

  useEffect(()=>{
    const timer=window.setTimeout(()=>setIntro(false),900)
    const move=(e:PointerEvent)=>{mouseX.set(e.clientX-140);mouseY.set(e.clientY-140)}
    window.addEventListener('pointermove',move,{passive:true})
    return()=>{window.clearTimeout(timer);window.removeEventListener('pointermove',move)}
  },[])

  return <>
    <motion.div className="wow-progress" style={{scaleX:progress}}/>
    <motion.div className="wow-orb" style={{x,y}}/>

    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname+location.search}
        className="wow-page-wipe"
        initial={{scaleY:1}}
        animate={{scaleY:0}}
        exit={{scaleY:1}}
        transition={{duration:.72,ease:[.76,0,.24,1]}}
      />
    </AnimatePresence>

    <AnimatePresence>
      {intro&&<motion.div className="wow-intro" exit={{y:'-100%'}} transition={{duration:.8,ease:[.76,0,.24,1]}}>
        <motion.img src="/delu-logo.svg" alt="" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} transition={{duration:.55,ease:[.16,1,.3,1]}}/>
        <motion.span initial={{opacity:0,y:8}} animate={{opacity:.62,y:0}} transition={{delay:.18,duration:.45}}>CLOTHES SHOP · FOLLONICA</motion.span>
        <motion.i initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.15,duration:.55,ease:[.16,1,.3,1]}}/>
      </motion.div>}
    </AnimatePresence>
  </>
}
