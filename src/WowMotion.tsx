import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useLocation } from 'react-router-dom'

const continueCopy:Record<string,string>={it:'CONTINUA GLI ACQUISTI',en:'CONTINUE SHOPPING',fr:'CONTINUER LES ACHATS',de:'WEITER EINKAUFEN',es:'SEGUIR COMPRANDO'}

export default function WowMotion(){
  const location=useLocation()
  const {scrollYProgress}=useScroll()
  const progress=useSpring(scrollYProgress,{stiffness:170,damping:32,mass:.25})
  const homeGhostX=useTransform(scrollYProgress,[0,.16,.34],['5vw','-20vw','-48vw'])
  const homeGhostOpacity=useTransform(scrollYProgress,[0,.16,.3],[.2,.1,0])
  const mouseX=useMotionValue(-220),mouseY=useMotionValue(-220)
  const x=useSpring(mouseX,{stiffness:120,damping:24,mass:.25})
  const y=useSpring(mouseY,{stiffness:120,damping:24,mass:.25})
  const[intro,setIntro]=useState(()=>location.pathname==='/')
  const[routeSignal,setRouteSignal]=useState(0)
  const[cartTarget,setCartTarget]=useState<HTMLElement|null>(null)
  const[cartLabel,setCartLabel]=useState(continueCopy.it)
  const firstRoute=useRef(true)

  useEffect(()=>{
    const timer=intro?window.setTimeout(()=>setIntro(false),900):undefined
    const move=(e:PointerEvent)=>{mouseX.set(e.clientX-150);mouseY.set(e.clientY-150)}
    window.addEventListener('pointermove',move,{passive:true})
    return()=>{if(timer)window.clearTimeout(timer);window.removeEventListener('pointermove',move)}
  },[])

  useEffect(()=>{
    const sync=()=>{
      setCartTarget(document.querySelector('.ds-cart-footer') as HTMLElement|null)
      const lang=(document.documentElement.lang||'it').slice(0,2)
      setCartLabel(continueCopy[lang]||continueCopy.it)
    }
    sync()
    const observer=new MutationObserver(sync)
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>observer.disconnect()
  },[])

  useEffect(()=>{
    if(firstRoute.current){firstRoute.current=false;return}
    setRouteSignal(v=>v+1)
  },[location.pathname,location.search])

  const routeLabel=location.pathname.startsWith('/shop')?'SHOP':location.pathname.startsWith('/product')?'DETAIL':location.pathname.startsWith('/checkout')?'CHECKOUT':location.pathname.startsWith('/wishlist')?'WISHLIST':'DELÙ'
  const isHome=location.pathname==='/'
  const closeCart=()=>{(document.querySelector('.ds-drawer-head .ds-icon') as HTMLButtonElement|null)?.click()}

  return <>
    <motion.div className="wow-progress" style={{scaleX:progress}}/>
    <motion.div className="wow-orb" style={{x,y}}/>

    {cartTarget&&createPortal(<button type="button" data-testid="continue-shopping" className="wow-cart-continue" onClick={closeCart}>{cartLabel}</button>,cartTarget)}

    {isHome&&<motion.div data-testid="home-kinetic" className="wow-home-kinetic" style={{x:homeGhostX,opacity:homeGhostOpacity}} aria-hidden="true">
      <span>DELÙ</span><i>FOLLONICA / 2026</i>
    </motion.div>}

    <AnimatePresence mode="popLayout">
      {routeSignal>0&&<motion.div data-testid="route-transition" key={routeSignal} className="wow-route-v3" initial={{opacity:1}} animate={{opacity:0}} exit={{opacity:0}} transition={{duration:.82,ease:[.16,1,.3,1]}}>
        <motion.div className="wow-route-v3__ribbon" initial={{x:'-118%',rotate:-7}} animate={{x:'118%',rotate:-7}} transition={{duration:.66,ease:[.76,0,.24,1]}}>
          <span>DELÙ · {routeLabel} · DELÙ · {routeLabel} · DELÙ</span>
        </motion.div>
        <motion.div className="wow-route-v3__word" initial={{opacity:0,scale:.9,y:24}} animate={{opacity:[0,.2,0],scale:[.9,1.02,1.07],y:[24,0,-16]}} transition={{duration:.72,ease:[.16,1,.3,1]}}>DELÙ</motion.div>
        <motion.div className="wow-route-v3__tag" initial={{opacity:0,y:-8}} animate={{opacity:[0,1,0],y:[-8,0,5]}} transition={{duration:.62,ease:[.16,1,.3,1]}}>{routeLabel}</motion.div>
      </motion.div>}
    </AnimatePresence>

    <AnimatePresence>
      {intro&&<motion.div data-testid="intro" className="wow-intro" exit={{y:'-100%'}} transition={{duration:.8,ease:[.76,0,.24,1]}}>
        <motion.img src="/delu-logo.svg" alt="" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} transition={{duration:.55,ease:[.16,1,.3,1]}}/>
        <motion.span initial={{opacity:0,y:8}} animate={{opacity:.62,y:0}} transition={{delay:.18,duration:.45}}>CLOTHES SHOP · FOLLONICA</motion.span>
        <motion.i initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.15,duration:.55,ease:[.16,1,.3,1]}}/>
      </motion.div>}
    </AnimatePresence>
  </>
}
