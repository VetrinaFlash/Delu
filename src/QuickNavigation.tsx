import {Link} from 'react-router-dom'
import {Search,Sparkles,Heart,UserRound} from 'lucide-react'
import {useLocale} from './i18n'
export default function QuickNavigation({onSearch}:{onSearch?:()=>void}){const {t}=useLocale();return <nav className="quick-navigation" aria-label={t('service')}>{onSearch?<button onClick={onSearch}><Search/><span>{t('search')}</span></button>:<Link to="/shop?search=1"><Search/><span>{t('search')}</span></Link>}<Link to="/shop?new=1"><Sparkles/><span>{t('newIn')}</span></Link><Link to="/wishlist"><Heart/><span>{t('wishlist')}</span></Link><Link to="/account"><UserRound/><span>{t('account')}</span></Link></nav>}
