import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AdminSecure from './AdminSecure'
import './styles.css'
import './admin-secure.css'

const isAdminRoute = window.location.pathname.startsWith('/admin')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {isAdminRoute ? <AdminSecure /> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
)
