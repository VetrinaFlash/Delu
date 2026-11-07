import RenderBoundary from './RenderBoundary'
import { MotionConfig } from 'motion/react'
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import NavigationGuard from './NavigationGuard'
import SmoothScroll from './SmoothScroll'
import './styles.css'
import './admin-secure.css'
import './storefront.css'
import './polish.css'
import './admin-commerce.css'
import './luxury-home.css'
import './wow-motion.css'
import './premium-home.css'
import './unified-storefront.css'
import './navigation-guard.css'
import './performance.css'
import './conversion-ux.css'
import './wow-v3.css'
import './immersive-v4.css'
import './experience-details.css'
import './brand-fit.css'
import './fit-finder.css'
import './admin-insights.css'
import './product-gallery.css'
import './community.css'
import './catalog-refinement.css'
import './final-layout.css'
import './atelier.css'
import './wardrobe-rail.css'

const App = React.lazy(()=>import('./App'))
const AdminSecure = React.lazy(()=>import('./AdminSecure'))
const PremiumHome = React.lazy(()=>import('./PremiumHome'))
const WowMotion = React.lazy(()=>import('./WowMotion'))

// A tab opened before a deployment may still reference retired lazy chunks.
window.addEventListener('vite:preloadError',event=>{
  if(!navigator.onLine)return
  try{
    const key='delu-chunk-retry'
    const previous=Number(sessionStorage.getItem(key)||0)
    if(Date.now()-previous<30000)return
    sessionStorage.setItem(key,String(Date.now()))
    event.preventDefault()
    window.location.reload()
  }catch{
    // Storage can be unavailable; the error boundary supplies a manual retry.
  }
})

const root = ReactDOM.createRoot(document.getElementById('root')!)
const isAdminRoute = window.location.pathname.startsWith('/admin')
if(isAdminRoute){
 document.querySelector('link[rel=manifest]')?.setAttribute('href','/admin.webmanifest')
 const icon=document.createElement('link');icon.rel='apple-touch-icon';icon.href='/admin-icon-192.png';document.head.append(icon)
}

function RouteFallback(){
  return <div className="route-fallback" role="status" aria-label="Caricamento DeLù"><img src="/delu-logo.svg" alt=""/></div>
}

function PublicEntry(){
  const{pathname}=useLocation()
  return <Suspense fallback={<RouteFallback/>}><SmoothScroll/><WowMotion/>{pathname==='/'?<PremiumHome/>:<><NavigationGuard/><App/></>}</Suspense>
}

function renderApp(){
  root.render(
    <React.StrictMode>
      <RenderBoundary><MotionConfig reducedMotion="user"><BrowserRouter>
        <Suspense fallback={<RouteFallback/>}>
          {isAdminRoute ? <AdminSecure /> : <PublicEntry/>}
        </Suspense>
      </BrowserRouter></MotionConfig></RenderBoundary>
    </React.StrictMode>,
  )
}

renderApp()

// Each storefront route reads the public D1 catalogue via useLiveCatalog.
// Never replace real inventory with demo data or remount the whole app after checkout starts.

