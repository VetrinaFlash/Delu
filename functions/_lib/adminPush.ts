import { clean, limit, reply } from './security'

const utf8=new TextEncoder()
const bytes=(s:string)=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/').padEnd(Math.ceil(s.length/4)*4,'=')),x=>x.charCodeAt(0))
const base64=(b:Uint8Array)=>btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')
function join(...chunks:Uint8Array[]){
 const result=new Uint8Array(chunks.reduce((total,part)=>total+part.length,0))
 let offset=0
 for(const part of chunks){result.set(part,offset);offset+=part.length}
 return result
}
function config(env:any){
 const publicKey=String(env.WEB_PUSH_PUBLIC_KEY||''),privateKey=String(env.WEB_PUSH_PRIVATE_KEY||''),subject=String(env.WEB_PUSH_SUBJECT||'')
 if(!/^B[A-Za-z0-9_-]{86}$/.test(publicKey)||!/^[A-Za-z0-9_-]{43}$/.test(privateKey)||!/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subject))return null
 return {publicKey,privateKey,subject}
}
type Subscription={endpoint:string;keys:{p256dh:string;auth:string}}
function parseSubscription(value:any):Subscription|null{
 if(typeof value?.endpoint!=='string'||value.endpoint.length>2048)return null
 try{
  const url=new URL(value.endpoint)
  const allowed=['fcm.googleapis.com','updates.push.services.mozilla.com','push.apple.com','notify.windows.com','notify.live.net']
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||
     !allowed.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))return null
  if(!/^B[A-Za-z0-9_-]{86}$/.test(value.keys?.p256dh||'')||!/^[A-Za-z0-9_-]{22}$/.test(value.keys?.auth||''))return null
  return {endpoint:url.href,keys:{p256dh:value.keys.p256dh,auth:value.keys.auth}}
 }catch{return null}
}
async function tables(env:any){
 await env.DB.batch([
  env.DB.prepare('CREATE TABLE IF NOT EXISTS admin_push_devices (endpoint TEXT PRIMARY KEY, subscription TEXT NOT NULL)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS admin_push_events (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS admin_push_deliveries (event_id TEXT NOT NULL, endpoint TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL, PRIMARY KEY(event_id,endpoint))')
 ])
}
async function hkdf(secret:Uint8Array<ArrayBuffer>,salt:Uint8Array<ArrayBuffer>,info:Uint8Array<ArrayBuffer>,length:number){
 const key=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveBits'])
 return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,length*8))
}
async function send(env:any,subscription:Subscription,payload:{title:string;body:string;tag:string}){
 const credentials=config(env)
 if(!credentials)throw new Error('Chiavi Web Push mancanti')
 let phase='crittografia'
 try{
 const userKey=bytes(subscription.keys.p256dh)
 const peer=await crypto.subtle.importKey('raw',userKey,{name:'ECDH',namedCurve:'P-256'},false,[])
 const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits'])
 const serverKey=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey))
 const secret=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:peer},pair.privateKey,256))
 const ikm=await hkdf(secret,bytes(subscription.keys.auth),join(utf8.encode('WebPush: info\0'),userKey,serverKey),32)
 const salt=crypto.getRandomValues(new Uint8Array(16))
 const cek=await hkdf(ikm,salt,utf8.encode('Content-Encoding: aes128gcm\0'),16)
 const nonce=await hkdf(ikm,salt,utf8.encode('Content-Encoding: nonce\0'),12)
 const aes=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt'])
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},aes,join(utf8.encode(JSON.stringify(payload)),new Uint8Array([2]))))
 const record=join(salt,new Uint8Array([0,0,16,0,65]),serverKey,cipher)
 phase='firma VAPID'
 const point=bytes(credentials.publicKey)
 const signingKey=await crypto.subtle.importKey('jwk',{
  kty:'EC',crv:'P-256',x:base64(point.slice(1,33)),y:base64(point.slice(33)),d:credentials.privateKey
 },{name:'ECDSA',namedCurve:'P-256'},false,['sign'])
 const jwt=base64(utf8.encode(JSON.stringify({typ:'JWT',alg:'ES256'})))+'.'+base64(utf8.encode(JSON.stringify({
  aud:new URL(subscription.endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:credentials.subject
 })))
 const signature=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},signingKey,utf8.encode(jwt)))
 phase='rete'
 const controller=new AbortController()
 const timeout=setTimeout(()=>controller.abort(),10000)
 try{return await fetch(subscription.endpoint,{
  method:'POST',redirect:'manual',signal:controller.signal,
  headers:{Authorization:`vapid t=${jwt}.${base64(signature)}, k=${credentials.publicKey}`,'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:'900',Urgency:'high'},
  body:record
 })}finally{clearTimeout(timeout)}
 }catch(error){
  const kind=error instanceof Error?error.name:'UnknownError'
  throw new Error(`Invio push interrotto nella fase ${phase} (${kind}).`)
 }
}
export async function enqueueAdminPush(env:any,id:string,title:string,body:string){
 if(!config(env))return
 try{
  await tables(env)
  await env.DB.batch([
   env.DB.prepare('INSERT OR IGNORE INTO admin_push_events(id,title,body) VALUES(?,?,?)').bind(id,title,body),
   env.DB.prepare('INSERT OR IGNORE INTO admin_push_deliveries(event_id,endpoint,expires) SELECT ?,endpoint,? FROM admin_push_devices WHERE changes()=1').bind(id,Date.now()+900000)
  ])
 }catch{console.error('Accodamento Web Push non disponibile')}
}
export async function flushAdminPush(env:any){
 if(!config(env))return
 await tables(env)
 const now=Date.now()
 await env.DB.prepare('DELETE FROM admin_push_deliveries WHERE expires<=?').bind(now).run()
 const {results}=await env.DB.prepare('SELECT d.event_id,d.endpoint,d.attempts,e.title,e.body,s.subscription FROM admin_push_deliveries d JOIN admin_push_events e ON e.id=d.event_id JOIN admin_push_devices s ON s.endpoint=d.endpoint WHERE d.next_at<=? AND d.expires>? AND d.attempts<4 ORDER BY d.next_at LIMIT 16').bind(now,now).all()
 await Promise.all(results.map(async(row:any)=>{
  const claimed=await env.DB.prepare('UPDATE admin_push_deliveries SET attempts=attempts+1,next_at=? WHERE event_id=? AND endpoint=? AND next_at<=? AND attempts=? RETURNING event_id').bind(now+30000*(row.attempts+1),row.event_id,row.endpoint,now,row.attempts).first()
  if(!claimed)return
  const sub=parseSubscription(JSON.parse(row.subscription))
  if(!sub)return
  try{
   const response=await send(env,sub,{title:row.title,body:row.body,tag:row.event_id})
   if(response.status===404||response.status===410)await removeDevice(env,row.endpoint)
   else if(response.ok)await env.DB.prepare('DELETE FROM admin_push_deliveries WHERE event_id=? AND endpoint=?').bind(row.event_id,row.endpoint).run()
  }catch{/* eligible for a retry on the next API request */}
 }))
}
async function removeDevice(env:any,endpoint:string){
 await env.DB.batch([
  env.DB.prepare('DELETE FROM admin_push_devices WHERE endpoint=?').bind(endpoint),
  env.DB.prepare('DELETE FROM admin_push_deliveries WHERE endpoint=?').bind(endpoint)
 ])
}
export async function adminPushRoute(request:Request,env:any,path:string,admin:boolean){
 if(!path.startsWith('admin/push/'))return null
 if(!admin)return reply({error:'Non autorizzato'},401)
 const credentials=config(env)
 if(path==='admin/push/config'&&request.method==='GET')return reply({publicKey:credentials?.publicKey||null})
 if(request.method!=='POST')return reply({error:'Metodo non consentito'},405)
 if(!await limit(env,'admin-push:'+(request.headers.get('cf-connecting-ip')||'unknown'),20,60))return reply({error:'Riprova tra un minuto.'},429)
 const body:any=await request.json().catch(()=>({}))
 await tables(env)
 if(path==='admin/push/unsubscribe'){
  await removeDevice(env,clean(body.endpoint,2048))
  return reply({ok:true})
 }
 if(!credentials)return reply({error:'Configura le chiavi Web Push su Cloudflare.'},503)
 if(path==='admin/push/subscribe'){
  const sub=parseSubscription(body.subscription)
  if(!sub)return reply({error:'Iscrizione push non valida o servizio non supportato.'},400)
  await env.DB.prepare('INSERT INTO admin_push_devices(endpoint,subscription) VALUES(?,?) ON CONFLICT(endpoint) DO UPDATE SET subscription=excluded.subscription').bind(sub.endpoint,JSON.stringify(sub)).run()
  return reply({ok:true})
 }
 if(path==='admin/push/test'){
  const saved=await env.DB.prepare('SELECT subscription FROM admin_push_devices WHERE endpoint=?').bind(clean(body.endpoint,2048)).first()
  const sub=saved?parseSubscription(JSON.parse(saved.subscription)):null
  if(!sub)return reply({error:'Attiva le notifiche su questo dispositivo.'},400)
  try{
   const sent=await send(env,sub,{title:'DeLù · notifica di prova',body:'Le notifiche push del pannello admin sono attive su questo dispositivo.',tag:'delu-test'})
   if(sent.ok)return reply({ok:true})
   if(sent.status>=300&&sent.status<400)return reply({error:`Il servizio push ha restituito un redirect (HTTP ${sent.status}). Disattiva e riattiva le push sul dispositivo.`},502)
   if(sent.status===404||sent.status===410){
    await removeDevice(env,sub.endpoint)
    return reply({error:'Iscrizione scaduta. Disattiva e riattiva le push su questo dispositivo.'},410)
   }
   if(sent.status===401||sent.status===403)return reply({error:`Autorizzazione push rifiutata (HTTP ${sent.status}). Verifica la coppia di chiavi Cloudflare e riattiva le push sul dispositivo.`},502)
   return reply({error:`Servizio push: HTTP ${sent.status}. Riprova e comunica questo codice se persiste.`},502)
  }catch(error){
   const message=error instanceof Error&&error.message.startsWith('Invio push interrotto')?error.message:'Errore durante la prova push.'
   return reply({error:message},502)
  }
 }
 return reply({error:'Non trovato'},404)
}
