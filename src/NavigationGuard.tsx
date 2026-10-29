import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NavigationGuard(){
  return <Link className="commerce-home-link" to="/" aria-label="Torna alla home DeLù"><Home/><span>HOME</span></Link>
}
