import {useMemo,useState} from 'react'
import {ArrowDownRight,ArrowUpRight,BarChart3,Box,CheckCircle2,Clock3,PackageX,TrendingUp} from 'lucide-react'
import type {Product} from './data'
import {money,type ApiOrder} from './admin/shared'

const confirmed=(status:string)=>/^(Pagato|In preparazione|Spedito|Completato)/i.test(status)
const awaiting=(status:string)=>['Da confermare','Pagato - da preparare','Nuovo','Pagato - verifica stock'].includes(status)
function localDay(date:Date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
function finiteTotal(order:ApiOrder){const n=Number(order.total);return Number.isFinite(n)&&n>0?n:0}
export default function AdminInsights({orders,products}:{orders:ApiOrder[];products:Product[]}){
  const[period,setPeriod]=useState<7|30|90>(30)
  const data=useMemo(()=>{
    const today=new Date();today.setHours(0,0,0,0)
    const start=new Date(today);start.setDate(start.getDate()-(period-1))
    const previous=new Date(start);previous.setDate(previous.getDate()-period)
    const sums=new Map<string,number>()
    for(let day=0;day<period;day++){const date=new Date(start);date.setDate(date.getDate()+day);sums.set(localDay(date),0)}
    let revenue=0,previousRevenue=0,confirmedOrders=0
    for(const order of orders){
      if(!confirmed(order.status))continue
      const created=new Date(order.createdAt)
      if(Number.isNaN(created.valueOf()))continue
      const amount=finiteTotal(order)
      if(created>=start){revenue+=amount;confirmedOrders++;const key=localDay(created);if(sums.has(key))sums.set(key,sums.get(key)!+amount)}
      else if(created>=previous)previousRevenue+=amount
    }
    const chart=[...sums].map(([day,value])=>({day,value,label:new Date(day+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'short'})}))
    const max=Math.max(1,...chart.map(entry=>entry.value))
    const change=previousRevenue>0?((revenue-previousRevenue)/previousRevenue)*100:null
    return{chart,max,revenue,previousRevenue,change,confirmedOrders,average:confirmedOrders?revenue/confirmedOrders:0}
  },[orders,period])
  const lowStock=products.filter(product=>product.active!==false&&product.stock>0&&product.stock<=5)
  const outOfStock=products.filter(product=>product.active!==false&&product.stock<=0)
  const urgent=orders.filter(order=>awaiting(order.status))
  const showEmpty=orders.length===0
  return <section className="admin-insights" aria-label="Analisi vendite e operatività">
    <div className="admin-insights-title"><div><span>DELÙ / COMMERCE INTELLIGENCE</span><h2>Il negozio in numeri reali.</h2><p>Importi dagli ordini confermati. Nessun dato simulato.</p></div><div className="admin-insights-period" role="group" aria-label="Intervallo analisi">{([7,30,90] as const).map(days=><button key={days} type="button" aria-pressed={period===days} onClick={()=>setPeriod(days)}>{days} giorni</button>)}</div></div>
    <div className="admin-insights-metrics">
      <div><span><TrendingUp size={15}/> Valore ordini confermati</span><strong>{money(data.revenue)}</strong><small>{data.change===null?'Nessun periodo precedente confrontabile':<>{data.change>=0?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {data.change>=0?'+':''}{data.change.toFixed(1)}% rispetto ai {period} giorni precedenti</>}</small></div>
      <div><span><CheckCircle2 size={15}/> Ordini confermati</span><strong>{data.confirmedOrders}</strong><small>Periodo selezionato</small></div>
      <div><span><BarChart3 size={15}/> Valore medio ordine</span><strong>{money(data.average)}</strong><small>Solo ordini confermati</small></div>
      <div><span><Clock3 size={15}/> Da gestire</span><strong>{urgent.length}</strong><small>Richieste e ordini in coda</small></div>
    </div>
    <div className="admin-insights-bottom">
      <div className="admin-insights-panel"><div className="admin-insights-panel-head"><div><span>ANDAMENTO</span><h3>Valore ordini per giorno</h3></div><b>{period} giorni</b></div><div className="admin-insights-chart" role="img" aria-label={'Valore ordini confermati negli ultimi '+period+' giorni: '+money(data.revenue)}>{data.chart.map((point,i)=><div className="admin-insights-bar" key={point.day} title={point.label+': '+money(point.value)}><div style={{height:(point.value>0?Math.max(3,point.value/data.max*100):2)+'%'}} className={point.value>0?'has-value':''}/>{(period===7||i%Math.ceil(period/7)===0)&&<small>{point.label}</small>}</div>)}</div>{showEmpty&&<p className="admin-insights-empty">Nessun ordine disponibile. Il grafico si aggiorna con i dati del negozio.</p>}</div>
      <div className="admin-insights-panel admin-insights-stock"><div className="admin-insights-panel-head"><div><span>ATTENZIONE</span><h3>Salute del magazzino</h3></div><Box size={20}/></div><div className="admin-insights-stock-totals"><span><PackageX size={18}/> <strong>{outOfStock.length}</strong> esauriti</span><span><Box size={18}/> <strong>{lowStock.length}</strong> quasi esauriti</span></div>{[...outOfStock,...lowStock].slice(0,4).map(product=><div className="admin-insights-stock-row" key={product.id}><img src={product.image} alt=""/><div><b>{product.name}</b><small>{product.category}</small></div><strong>{product.stock} pz</strong></div>)}{!outOfStock.length&&!lowStock.length&&<p className="admin-insights-empty">Nessun prodotto con stock pari a zero o inferiore a sei pezzi.</p>}</div>
    </div>
  </section>
}
