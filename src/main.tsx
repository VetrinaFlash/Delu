import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AdminSecure from './AdminSecure'
import { products } from './data'
import './styles.css'
import './admin-secure.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)
const isAdminRoute = window.location.pathname.startsWith('/admin')

async function bootstrap() {
  if (!isAdminRoute) {
    try {
      const response = await fetch('/api/products', { headers: { accept: 'application/json' } })
      if (response.ok) {
        const liveProducts = await response.json()
        if (Array.isArray(liveProducts) && liveProducts.length) products.splice(0, products.length, ...liveProducts)
      }
    } catch {
      // The seed catalog keeps local development and first deploy visually complete.
    }
  }

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        {isAdminRoute ? <AdminSecure /> : <App />}
      </BrowserRouter>
    </React.StrictMode>,
  )
}

bootstrap()
