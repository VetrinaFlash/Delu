import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import NavigationGuard from './NavigationGuard'
import { products } from './data'
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

const App = React.lazy(()=>import('./App'))
const AdminSecure = React.lazy(()=>import('./AdminSecure'))
const PremiumHome = React.lazy(()=>import('./PremiumHome'))
const WowMotion = React.lazy(()=>import('./WowMotion'))

const root = ReactDOM.createRoot(document.getElementById('root')!)
const isAdminRoute = window.location.pathname.startsWith('/admin')

function RouteFallback(){
  return <div className="route-fallback" role="status" aria-label="Caricamento DeLù"><img src="/delu-logo.svg" alt=""/></div>
}

function PublicEntry(){
  const{pathname}=useLocation()
  return <Suspense fallback={<RouteFallback/>}><WowMotion/>{pathname==='/'?<PremiumHome/>:<><NavigationGuard/><App/></>}</Suspense>
}

function renderApp(){
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback/>}>
          {isAdminRoute ? <AdminSecure /> : <PublicEntry/>}
        </Suspense>
      </BrowserRouter>
    </React.StrictMode>,
  )
}

renderApp()

if (!isAdminRoute) {
  fetch('/api/products', { headers: { accept: 'application/json' } })
    .then(async response=>response.ok?response.json():null)
    .then(liveProducts=>{
      if (Array.isArray(liveProducts) && liveProducts.length) {
        products.splice(0, products.length, ...liveProducts)
        renderApp()
      }
    })
    .catch(()=>{
      // Seed products keep the storefront instantly usable if D1 is unavailable.
    })
}
