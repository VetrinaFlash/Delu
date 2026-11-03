import { clean, digest, email, limit, reply, token, validEmail } from './security'
import { discountFor, enqueue, paidEmails } from './community'
export async function requestTables(env:any){await env.DB.batch([
 env.DB.prepare("CREATE TABLE IF NOT EXISTS order_reviews (order_id TEXT PRIMARY KEY,state TEXT NOT NULL DEFAULT 'REVIEW',version INTEGER NOT NULL DEFAULT 1,reason TEXT NOT NULL DEFAULT '',payment_hash TEXT UNIQUE,payment_expires INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS order_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT NOT NULL,action TEXT NOT NULL,snapshot TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS shipping_labels (order_id TEXT PRIMARY KEY,state TEXT NOT NULL,parcel_id TEXT,label_url TEXT,tracking TEXT,error TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
])}
const base=(env:any)=>(env.SITE_URL||'').replace(/\/$/,'')
export async function requestedOrder(request:Request,env:any,shippingFor:(env:any,country:string,subtotal:number)=>Promise<number>){
 await requestTables(env)
 if(!env.PRIVACY_NOTICE)return reply({error:'Il negozio deve completare l’informativa privacy prima di ricevere richieste.'},503)
 if(!await limit(env,'order-request:'+(request.headers.get('cf-connecting-ip')||'unknown'),10,900))return reply({error:'Troppi invii. Riprova più tardi.'},429)
 const b:any=await request.json().catch(()=>({})),phone=clean(b.customer?.phone,30).replace(/[\s()-]/g,'')
 if(!b.termsAccepted||!validEmail(email(b.customer?.email))||!clean(b.customer?.name,160)||!/^\+[1-9]\d{7,14}$/.test(phone)||!clean(b.shipping?.address,250)||!clean(b.shipping?.postcode,30)||!clean(b.shipping?.city,120)||!Array.isArray(b.items)||!b.items.length||b.items.length>40)return reply({error:'Completa contatti e indirizzo. Per WhatsApp inserisci il telefono con prefisso internazionale, ad esempio +39.'},400)
 const country=clean(b.shipping.country,2).toUpperCase();if(!/^[A-Z]{2}$/.test(country))return reply({error:'Paese non valido'},400)
 const items=[]
 for(const x of b.items){const p=await env.DB.prepare('SELECT * FROM products WHERE id=? AND active=1').bind(clean(x.id,80)).first();const qty=Number(x.qty);if(!p||!Number.isInteger(qty)||qty<1||qty>20)return reply({error:'Articolo o quantità non valido'},400)
 const colors=JSON.parse(p.colors_json||'[]'),sizes=JSON.parse(p.sizes_json||'[]');if((colors.length&&!colors.includes(x.color))||(sizes.length&&!sizes.includes(x.size)))return reply({error:'Variante non valida'},400)
 items.push({id:p.id,name:p.name,unitPrice:p.price_cents/100,qty,size:clean(x.size,40),color:clean(x.color,80)})}
 const subtotal=items.reduce((s,i)=>s+Math.round(i.unitPrice*100)*i.qty,0),promo=await discountFor(env,clean(b.discountCode,80),b.customer.email)
 if(b.discountCode&&!promo)return reply({error:'Codice sconto non valido'},400)
 const shippingCost=await shippingFor(env,country,subtotal);const id='DL'+Date.now().toString(36).toUpperCase()+token().slice(0,12).toUpperCase(),discount=promo?Math.floor(subtotal*promo.percent/100):0
 const shipping={...b.shipping,address:clean(b.shipping.address,250),city:clean(b.shipping.city,120),postcode:clean(b.shipping.postcode,30),province:clean(b.shipping.province,80),country,cost:shippingCost/100,discount:discount/100,requestedDiscountPercent:promo?.percent||0,termsSnapshot:env.TERMS_NOTICE||'',returnsAddress:env.RETURNS_ADDRESS||''}
 await env.DB.batch([
 env.DB.prepare("INSERT INTO orders(id,customer_name,customer_email,customer_phone,total_cents,status,items_json,shipping_json,notes) VALUES(?,?,?,?,?,'Da confermare',?,?,?)").bind(id,clean(b.customer.name,160),email(b.customer.email),phone,subtotal-discount+shippingCost,JSON.stringify(items),JSON.stringify(shipping),clean(b.notes,1000)),
 env.DB.prepare('INSERT INTO order_reviews(order_id) VALUES(?)').bind(id),
 env.DB.prepare("INSERT INTO order_audit(order_id,action,snapshot) VALUES(?,'REQUEST',?)").bind(id,JSON.stringify({items,shipping}))
 ])
 await enqueue(env,'request-customer-'+id,email(b.customer.email),'DeLù · richiesta ricevuta '+id,'Richiesta '+id+' ricevuta. Non è ancora confermata e non è stato richiesto alcun pagamento. Verificheremo la disponibilità nei magazzini. Lo staff ti comunicherà conferma, eventuali variazioni e importo finale su WhatsApp. Nessuna sostituzione è vincolante senza la tua accettazione.')
 if(env.ADMIN_EMAIL)await enqueue(env,'request-admin-'+id,env.ADMIN_EMAIL,'DeLù · richiesta da verificare '+id,'Verifica disponibilità e importo nella dashboard: '+base(env)+'/admin')
 return reply({orderId:id,status:'Da confermare',message:'Richiesta inviata. Attendi la verifica dello staff su WhatsApp: non devi pagare ora.'},201)
}
export async function reviewPaid(env:any,id:string,operation:any){
 await requestTables(env);const review=await env.DB.prepare('SELECT * FROM order_reviews WHERE order_id=?').bind(id).first();if(!review)return false
 const p=await env.DB.prepare('SELECT * FROM payments WHERE order_id=?').bind(id).first()
 if(!p||!['APPROVED','PAYMENT','PAID'].includes(review.state))throw new Error('Ordine non approvato')
 if(review.state!=='PAID'){await env.DB.batch([
 env.DB.prepare("UPDATE order_reviews SET state='PAID' WHERE order_id=?").bind(id),
 env.DB.prepare("UPDATE payments SET status='PAID',operation_id=?,operation_result='EXECUTED',updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(clean(operation.operationId,120),id),
 env.DB.prepare("UPDATE orders SET status='Pagato - da preparare',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id),
 env.DB.prepare("INSERT OR IGNORE INTO shipping_labels(order_id,state) VALUES(?,'READY')").bind(id)
 ])}
 await paidEmails(env,id,base(env));return true
}
export async function orderRequestRoute(r:Request,env:any,path:string,admin:boolean):Promise<Response|null>{
 if(!path.startsWith('order-requests/')&&!path.startsWith('admin/order-requests/'))return null
 await requestTables(env);const method=r.method,b:any=method==='POST'?await r.json().catch(()=>({})):{}
 if(path.startsWith('admin/')){
 if(!admin)return reply({error:'Non autorizzato'},401)
 const match=path.match(/^admin\/order-requests\/([^/]+)(?:\/(approve|reject|edit|label|methods))?$/);if(!match)return reply({error:'Non trovato'},404)
 const id=match[1],action=match[2],o=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first(),review=await env.DB.prepare('SELECT * FROM order_reviews WHERE order_id=?').bind(id).first()
 if(!o||!review)return reply({error:'Richiesta non trovata'},404)
 if(method==='GET'&&action==='methods'){if(!env.SENDCLOUD_PUBLIC_KEY||!env.SENDCLOUD_SECRET_KEY)return reply({error:'Collega Sendcloud per scegliere il servizio corriere.'},503);const res=await fetch('https://panel.sendcloud.sc/api/v2/shipping_methods',{headers:{authorization:'Basic '+btoa(env.SENDCLOUD_PUBLIC_KEY+':'+env.SENDCLOUD_SECRET_KEY)}}),d:any=await res.json();if(!res.ok)return reply({error:'Servizi corriere non disponibili. Verifica Sendcloud.'},502);return reply((d.shipping_methods||[]).map((m:any)=>({id:m.id,name:m.name,carrier:m.carrier,minWeight:m.min_weight,maxWeight:m.max_weight})))}
 if(method==='GET'&&action==='label')return downloadLabel(env,id)
 if(method==='GET')return reply({review,items:JSON.parse(o.items_json),shipping:JSON.parse(o.shipping_json),total:o.total_cents/100,label:await env.DB.prepare('SELECT * FROM shipping_labels WHERE order_id=?').bind(id).first(),share:JSON.parse((await env.DB.prepare("SELECT snapshot FROM order_audit WHERE order_id=? AND action='SHARE' ORDER BY id DESC LIMIT 1").bind(id).first())?.snapshot||'null')})
 if(action==='label'&&method==='POST')return createLabel(env,o,b)
 if(method!=='POST')return reply({error:'Metodo non consentito'},405)
 if(review.state!=='REVIEW'||review.version!==Number(b.version))return reply({error:'Ordine già confermato o modificato: aggiorna la schermata. Il totale di un link emesso non è modificabile.'},409)
 if(action==='edit'){
  if(!Array.isArray(b.items)||!b.items.length||b.items.length>40)return reply({error:'Seleziona almeno un articolo'},400)
  const items=[];for(const x of b.items){const p=await env.DB.prepare('SELECT * FROM products WHERE id=? AND active=1').bind(clean(x.id,80)).first();const qty=Number(x.qty),cents=Math.round(Number(x.unitPrice)*100);if(!p||!Number.isInteger(qty)||qty<1||qty>20||!Number.isSafeInteger(cents)||cents<0||cents>10000000)return reply({error:'Prezzo o quantità non valido'},400);if(!JSON.parse(p.colors_json||'[]').includes(x.color)||!JSON.parse(p.sizes_json||'[]').includes(x.size))return reply({error:'Variante non valida nel catalogo'},400);items.push({id:p.id,name:p.name,qty,unitPrice:cents/100,size:x.size,color:x.color})}
  const shipping=JSON.parse(o.shipping_json),cost=Math.round(Number(b.shippingCost)*100),discount=Math.round(Number(b.discount||0)*100),subtotal=items.reduce((s,i)=>s+Math.round(i.unitPrice*100)*i.qty,0)
  if(!Number.isSafeInteger(cost)||cost<0||cost>100000||!Number.isSafeInteger(discount)||discount<0||discount>subtotal)return reply({error:'Spedizione o sconto non valido'},400)
  shipping.cost=cost/100;shipping.discount=discount/100
  const result=await env.DB.batch([env.DB.prepare("UPDATE orders SET items_json=?,shipping_json=?,total_cents=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM order_reviews WHERE order_id=? AND version=? AND state='REVIEW')").bind(JSON.stringify(items),JSON.stringify(shipping),subtotal-discount+cost,id,id,b.version),env.DB.prepare("UPDATE order_reviews SET version=version+1 WHERE order_id=? AND version=? AND state='REVIEW'").bind(id,b.version)])
  if(!Number(result[0]?.meta?.changes))return reply({error:'Richiesta modificata da un altro operatore'},409)
  await env.DB.prepare("INSERT INTO order_audit(order_id,action,snapshot) VALUES(?,'EDIT',?)").bind(id,JSON.stringify({items,shipping,reason:clean(b.reason,500)})).run()
  return reply({ok:true})
 }
 if(action==='reject'){const cas=await env.DB.prepare("UPDATE order_reviews SET state='REJECTED',reason=?,version=version+1 WHERE order_id=? AND state='REVIEW' AND version=? RETURNING order_id").bind(clean(b.reason,1000),id,b.version).first();if(!cas)return reply({error:'Stato modificato'},409);await env.DB.prepare("UPDATE orders SET status='Rifiutato',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();await enqueue(env,'rejected-'+id,o.customer_email,'DeLù · richiesta non confermata '+id,'La richiesta '+id+' non è stata confermata. Nessun pagamento richiesto. '+clean(b.reason,1000));return reply({ok:true})}
 if(action==='approve'){
 if(!env.NEXI_XPAY_API_KEY||!env.SITE_URL||!env.TERMS_NOTICE||!env.RETURNS_ADDRESS)return reply({error:'Completa Nexi, dominio, condizioni e indirizzo resi prima di confermare.'},503)
 if(o.total_cents<=0)return reply({error:'Importo finale non valido'},400)
 const raw=token(),expires=Date.now()+7*86400000,cas=await env.DB.prepare("UPDATE order_reviews SET state='APPROVED',payment_hash=?,payment_expires=?,version=version+1 WHERE order_id=? AND state='REVIEW' AND version=? RETURNING order_id").bind(await digest(raw),expires,id,b.version).first()
 if(!cas)return reply({error:'Richiesta già modificata'},409)
 await env.DB.prepare("UPDATE orders SET status='Confermato - da pagare',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run()
 const link=base(env)+'/pay/'+raw,summary=JSON.parse(o.items_json).map((i:any)=>i.name+' · '+i.color+' '+i.size+' × '+i.qty).join('\n'),message='DeLù · richiesta '+id+' confermata.\n'+summary+'\nSpedizione EUR '+Number(JSON.parse(o.shipping_json).cost||0).toFixed(2)+'\nTotale EUR '+(o.total_cents/100).toFixed(2)+'.\nControlla i dettagli e paga su Nexi: '+link+'\nIl link è valido 7 giorni. Se ci sono variazioni, accettale solo se desideri procedere.'
 await env.DB.prepare("INSERT INTO order_audit(order_id,action,snapshot) VALUES(?,'APPROVE',?)").bind(id,JSON.stringify({total:o.total_cents,items:JSON.parse(o.items_json)})).run()
 const share={paymentUrl:link,whatsappUrl:'https://wa.me/'+o.customer_phone.replace(/\D/g,'')+'?text='+encodeURIComponent(message),message,expires};await env.DB.prepare("INSERT INTO order_audit(order_id,action,snapshot) VALUES(?,'SHARE',?)").bind(id,JSON.stringify(share)).run();return reply(share)
 }
 return reply({error:'Operazione non valida'},400)
 }
 const raw=path.split('/')[1],review=await env.DB.prepare('SELECT * FROM order_reviews WHERE payment_hash=?').bind(await digest(raw||'')).first()
 if(!review||review.payment_expires<Date.now())return reply({error:'Link scaduto o non valido. Contatta DeLù.'},404)
 const o=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(review.order_id).first()
 if(method==='GET')return reply({orderId:o.id,items:JSON.parse(o.items_json),shipping:JSON.parse(o.shipping_json).cost||0,discount:JSON.parse(o.shipping_json).discount||0,total:o.total_cents/100,state:review.state,terms:env.TERMS_NOTICE||''})
 if(method!=='POST'||!b.accepted)return reply({error:'Conferma i dettagli prima di pagare'},400)
 if(review.state==='PAID')return reply({error:'Ordine già pagato'},409)
 const existing=await env.DB.prepare('SELECT * FROM payments WHERE order_id=?').bind(o.id).first()
 if(existing){const audit=await env.DB.prepare("SELECT snapshot FROM order_audit WHERE order_id=? AND action='HPP' ORDER BY id DESC LIMIT 1").bind(o.id).first();if(audit&&existing.status==='PENDING')return reply({hostedPage:JSON.parse(audit.snapshot).hostedPage});return reply({error:'Sessione di pagamento già avviata. Contatta il negozio prima di riprovare.'},409)}
 const cas=await env.DB.prepare("UPDATE order_reviews SET state='PAYMENT' WHERE order_id=? AND state='APPROVED' RETURNING order_id").bind(o.id).first();if(!cas)return reply({error:'Pagamento già in avvio. Attendi e aggiorna.'},409)
 const origin=base(env),payload={order:{orderId:o.id,amount:String(o.total_cents),currency:'EUR',description:'DeLù '+o.id,customerInfo:{cardHolderName:o.customer_name,cardHolderEmail:o.customer_email}},paymentSession:{actionType:'PAY',amount:String(o.total_cents),captureType:'IMPLICIT',language:'ita',resultUrl:origin+'/payment/result?orderId='+o.id,cancelUrl:origin+'/pay/'+raw,notificationUrl:origin+'/api/payments/nexi/notification'}}
 await env.DB.prepare("INSERT INTO payments(order_id,provider,status,amount_cents) VALUES(?,'NEXI_XPAY','CREATING',?)").bind(o.id,o.total_cents).run()
 try{const res=await fetch((env.NEXI_XPAY_BASE_URL||'https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp').replace(/\/$/,'')+'/api/v1/orders/hpp',{method:'POST',headers:{'content-type':'application/json','X-API-KEY':env.NEXI_XPAY_API_KEY,'Correlation-Id':crypto.randomUUID()},body:JSON.stringify(payload)}),d:any=await res.json();if(!res.ok||!d.hostedPage||!d.securityToken)throw new Error('Nexi non ha restituito una sessione valida')
 if(!/^https:\/\//.test(d.hostedPage))throw new Error('URL Nexi non valido')
 await env.DB.batch([env.DB.prepare("UPDATE payments SET status='PENDING',security_token=? WHERE order_id=?").bind(d.securityToken,o.id),env.DB.prepare("INSERT INTO order_audit(order_id,action,snapshot) VALUES(?,'HPP',?)").bind(o.id,JSON.stringify({hostedPage:d.hostedPage}))]);return reply({hostedPage:d.hostedPage})
 }catch{await env.DB.prepare("UPDATE payments SET status='CHECK_REQUIRED' WHERE order_id=? AND status='CREATING'").bind(o.id).run();return reply({error:'Esito creazione pagamento incerto. Lo staff deve verificare Nexi prima di un nuovo tentativo.'},502)}
}
async function createLabel(env:any,o:any,b:any){
 const paid=await env.DB.prepare("SELECT status FROM payments WHERE order_id=? AND status='PAID'").bind(o.id).first();if(!paid)return reply({error:'Etichetta disponibile solo dopo pagamento verificato.'},409)
 if(!env.SENDCLOUD_PUBLIC_KEY||!env.SENDCLOUD_SECRET_KEY||!env.SENDCLOUD_SENDER_ID)return reply({error:'Configura account Sendcloud, mittente e servizio corriere.'},503)
 const address=JSON.parse(o.shipping_json),weight=Number(b.weight),method=Number(b.shippingMethod),house=clean(b.houseNumber,30),street=clean(b.street,200)
 if(!Number.isFinite(weight)||weight<=0||weight>100||!Number.isInteger(method)||method<1||!house||!street)return reply({error:'Conferma via, civico, peso in kg e ID servizio Sendcloud.'},400)
 const countries='IT FR DE ES PT AT BE NL LU IE FI SE DK PL CZ SK SI HR HU RO BG GR CY MT EE LV LT'.split(' ');if(!countries.includes(address.country))return reply({error:'Per extra UE servono dati doganali: genera la spedizione nel pannello del corriere.'},400)
 const claim=await env.DB.prepare("UPDATE shipping_labels SET state='CREATING' WHERE order_id=? AND state='READY' RETURNING order_id").bind(o.id).first();if(!claim)return reply({error:'Etichetta già richiesta. Verifica il pannello corriere prima di riprovare.'},409)
 try{const res=await fetch('https://panel.sendcloud.sc/api/v2/parcels',{method:'POST',headers:{authorization:'Basic '+btoa(env.SENDCLOUD_PUBLIC_KEY+':'+env.SENDCLOUD_SECRET_KEY),'content-type':'application/json'},body:JSON.stringify({parcel:{name:o.customer_name,address:street,house_number:house,city:address.city,postal_code:address.postcode,country:address.country,email:o.customer_email,telephone:o.customer_phone,weight:weight.toFixed(3),order_number:o.id,shipment:{id:method},sender_address:Number(env.SENDCLOUD_SENDER_ID),request_label:true}})}),data:any=await res.json(),p=data.parcel
 if(!res.ok||!p?.id)throw new Error('Etichetta non confermata')
 const label=p.label?.normal_printer?.[0]||null;await env.DB.batch([env.DB.prepare("UPDATE shipping_labels SET state=?,parcel_id=?,label_url=?,tracking=? WHERE order_id=?").bind(label?'CREATED':'PROCESSING',String(p.id),label,p.tracking_number||'',o.id),env.DB.prepare("INSERT INTO order_fulfillment(order_id,carrier,tracking_code,tracking_url) VALUES(?,'Sendcloud',?,?) ON CONFLICT(order_id) DO UPDATE SET carrier=excluded.carrier,tracking_code=excluded.tracking_code,tracking_url=excluded.tracking_url").bind(o.id,p.tracking_number||'',p.tracking_url||'')]);return reply({message:label?'Etichetta generata.':'Spedizione creata; etichetta in elaborazione. Verifica Sendcloud.',labelUrl:label,parcelId:p.id})
 }catch{await env.DB.prepare("UPDATE shipping_labels SET state='CHECK_REQUIRED',error='Verificare Sendcloud prima di ripetere' WHERE order_id=?").bind(o.id).run();return reply({error:'Esito incerto: verifica la spedizione su Sendcloud. Nessun secondo acquisto automatico di etichette.'},502)}
}

export async function paymentFailed(env:any,id:string,operation:any){
 const current=await env.DB.prepare('SELECT status FROM payments WHERE order_id=?').bind(id).first();if(!current||['PAID','PAID_STOCK_REVIEW'].includes(current.status))return
 await env.DB.prepare("UPDATE orders SET status='Pagamento fallito',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run()
 if(env.ADMIN_EMAIL)await enqueue(env,'failed-admin-'+id+'-'+clean(operation?.operationId,100),env.ADMIN_EMAIL,'DeLù · pagamento non riuscito '+id,'Il pagamento per ordine '+id+' non è riuscito: '+clean(operation?.operationResult,80)+'. Verifica Nexi prima di creare un nuovo tentativo. Dashboard: '+base(env)+'/admin')
}

async function downloadLabel(env:any,id:string){
 const paid=await env.DB.prepare("SELECT status FROM payments WHERE order_id=? AND status='PAID'").bind(id).first();if(!paid)return reply({error:'Pagamento non verificato'},409)
 let label=await env.DB.prepare('SELECT * FROM shipping_labels WHERE order_id=?').bind(id).first();if(!label?.parcel_id)return reply({error:'Etichetta non disponibile'},404)
 const headers={authorization:'Basic '+btoa(env.SENDCLOUD_PUBLIC_KEY+':'+env.SENDCLOUD_SECRET_KEY)}
 if(!label.label_url){const res=await fetch('https://panel.sendcloud.sc/api/v2/parcels/'+encodeURIComponent(label.parcel_id),{headers}),d:any=await res.json();const url=d.parcel?.label?.normal_printer?.[0];if(!res.ok||!url)return reply({error:'Etichetta in elaborazione. Riprova più tardi o verifica Sendcloud.'},409);await env.DB.prepare("UPDATE shipping_labels SET state='CREATED',label_url=? WHERE order_id=?").bind(url,id).run();label={...label,label_url:url}}
 const url=new URL(label.label_url);if(url.protocol!=='https:'||url.hostname!=='panel.sendcloud.sc'||!url.pathname.startsWith('/api/v2/labels/'))return reply({error:'Formato link etichetta non riconosciuto. Apri il pannello Sendcloud.'},409)
 const res=await fetch(url.toString(),{headers,redirect:'error'});if(!res.ok)return reply({error:'Download etichetta non riuscito. Verifica Sendcloud.'},502)
 return new Response(await res.arrayBuffer(),{headers:{'content-type':'application/pdf','content-disposition':'inline; filename="delu-'+id+'.pdf"','cache-control':'no-store'}})
}
