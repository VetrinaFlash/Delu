import { useEffect, useRef, useState } from 'react'
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
  const[routeSignal,setRouteSignal]=useState(0)
  const firstRoute=useRef(true)

  useEffect(()=>{
    const timer=window.setTimeout(()=>setIntro(false),900)
    const move=(e:PointerEvent)=>{mouseX.set(e.clientX-140);mouseY.set(e.clientY-140)}
    window.addEventListener('pointermove',move,{passive:true})
    return()=>{window.clearTimeout(timer);window.removeEventListener('pointermove',move)}
  },[])

  useEffect(()=>{
    if(firstRoute.current){firstRoute.current=false;return}
    setRouteSignal(v=>v+1)
  },[location.pathname,location.search])

  const routeLabel=location.pathname.startsWith('/shop')?'SHOP':location.pathname.startsWith('/product')?'DETAIL':location.pathname.startsWith('/checkout')?'CHECKOUT':location.pathname.startsWith('/wishlist')?'WISHLIST':'DELÙ'

  return <>
    <motion.div className="wow-progress" style={{scaleX:progress}}/>
    <motion.div className="wow-orb" style={{x,y}}/>

    {routeSignal>0&&<motion.div key={routeSignal} className="wow-route-accent" initial={{opacity:1}} animate={{opacity:0}} transition={{duration:.72,ease:[.16,1,.3,1]}}>
      <motion.i className="wow-route-accent__line" initial={{scaleX:0}} animate={{scaleX:[0,1,0],x:['-18%','0%','18%']}} transition={{duration:.62,ease:[.76,0,.24,1]}}/>
      <motion.span className="wow-route-accent__ghost" initial={{opacity:0,y:30,scale:.97}} animate={{opacity:[0,.14,0],y:[30,0,-12],scale:[.97,1,1.015]}} transition={{duration:.68,ease:[.16,1,.3,1]}}>DELÙ</motion.span>
      <motion.b className="wow-route-accent__label" initial={{opacity:0,y:-7}} animate={{opacity:[0,.75,0],y:[-7,0,4]}} transition={{duration:.58,ease:[.16,1,.3,1]}}>{routeLabel}</motion.b>
    </motion.div>}

    <AnimatePresence>
      {intro&&<motion.div className="wow-intro" exit={{y:'-100%'}} transition={{duration:.8,ease:[.76,0,.24,1]}}>
        <motion.img src="/delu-logo.svg" alt="" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} transition={{duration:.55,ease:[.16,1,.3,1]}}/>
        <motion.span initial={{opacity:0,y:8}} animate={{opacity:.62,y:0}} transition={{delay:.18,duration:.45}}>CLOTHES SHOP · FOLLONICA</motion.span>
        <motion.i initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.15,duration:.55,ease:[.16,1,.3,1]}}/>
      </motion.div>}
    </AnimatePresence>
  </>
}
