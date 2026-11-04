import type { Product } from '../data'
import type { ApiOrder } from './shared'

/** All CSV exports are created explicitly by a signed-in admin in their own browser. */
export function csvCell(value:unknown):string{
  const raw=String(value??'')
  // Avoid spreadsheet formula execution on any untrusted input (names, notes, SKUs, etc).
  const safe=/^[\s\u0000-\u001f]*[=+\-@]/u.test(raw)?"'"+raw:raw
  return '"'+safe.replace(/"/g,'""').replace(/\r?\n/g,' ')+'"'
}
export function buildCsv(headers:string[],rows:unknown[][]):string{
  return [headers,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n'
}
function downloadCsv(name:string,headers:string[],rows:unknown[][]){
  const contents='\uFEFF'+buildCsv(headers,rows)
  const url=URL.createObjectURL(new Blob([contents],{type:'text/csv;charset=utf-8'}))
  const link=document.createElement('a')
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function exportOrders(orders:ApiOrder[]){
  const rows=orders.map(o=>[o.id,o.createdAt,o.customer,o.email,o.phone,o.status,
    Number(o.total||0).toFixed(2).replace('.',','),o.items?.reduce((sum,item)=>sum+(Number(item.qty)||1),0)||0,
    (o.items||[]).map(item=>(item.name||item.productName||item.product?.name||item.id||'Articolo')+' × '+(Number(item.qty)||1)).join(' | '),
    o.shipping?.city||'',o.shipping?.country||'',o.fulfillment?.carrier||'',o.fulfillment?.trackingCode||''])
  downloadCsv('delu-ordini.csv',['Ordine','Data','Cliente','Email','Telefono','Stato','Totale EUR','Quantità','Articoli','Città','Paese','Corriere','Tracking'],rows)
}
export function exportProducts(products:Product[]){
  const rows=products.flatMap(p=>(p.variants?.length?p.variants:[null]).map(v=>[
    p.id,p.name,p.category,p.active===false?'Nascosto':'Attivo',p.price.toFixed(2).replace('.',','),p.stock,
    v?.color||'',v?.size||'',v?.stock??p.stock,v?.sku||'',p.fabrics?.join(' | ')||'',p.tags.join(' | '),p.image
  ]))
  downloadCsv('delu-catalogo-magazzino.csv',['ID','Prodotto','Categoria','Stato','Prezzo EUR','Stock totale','Colore','Taglia','Stock variante','SKU','Tessuti','Tag','Immagine'],rows)
}
