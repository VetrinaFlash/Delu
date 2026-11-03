import { Link, useLocation } from 'react-router-dom'
import { Heart, Search, Sparkles, UserRound } from 'lucide-react'
import { useLocale } from './i18n'

export default function QuickNavigation({onSearch}:{onSearch?:()=>void}){
 const {t}=useLocale()
 const {pathname,search}=useLocation()
 const newArrivals=pathname==='/shop'&&new URLSearchParams(search).get('new')==='1'
 return <nav className="quick-navigation" aria-label={t('service')}>
  {onSearch?<button type="button" onClick={onSearch}><Search aria-hidden="true"/><span>{t('search')}</span></button>:<Link to="/shop?search=1"><Search aria-hidden="true"/><span>{t('search')}</span></Link>}
  <Link to="/shop?new=1" aria-current={newArrivals?'page':undefined}><Sparkles aria-hidden="true"/><span>{t('newIn')}</span></Link>
  <Link to="/wishlist" aria-current={pathname==='/wishlist'?'page':undefined}><Heart aria-hidden="true"/><span>{t('wishlist')}</span></Link>
  <Link to="/account" aria-current={pathname==='/account'?'page':undefined}><UserRound aria-hidden="true"/><span>{t('account')}</span></Link>
 </nav>
}
