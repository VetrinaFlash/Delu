import { clean, cookie, cookieValue, createSession, digest, email, limit, logoutSession, passwordHash, passwordMatches, reply, session, token, validEmail } from './security'

export async function communityTables(env:any){await env.DB.batch([
 env.DB.prepare("CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password TEXT NOT NULL DEFAULT '',verified INTEGER NOT NULL DEFAULT 0,google_sub TEXT UNIQUE,marketing INTEGER NOT NULL DEFAULT 0,consent_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_contacts (customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,phone TEXT NOT NULL)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS social_identities (provider TEXT NOT NULL,subject TEXT NOT NULL,customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,PRIMARY KEY(provider,subject),UNIQUE(provider,customer_id))"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS auth_tokens (hash TEXT PRIMARY KEY,kind TEXT NOT NULL,subject TEXT NOT NULL,expires INTEGER NOT NULL)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS email_outbox (id TEXT PRIMARY KEY,recipient TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,customer_id TEXT,marketing INTEGER NOT NULL DEFAULT 0,sent INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS returns_requests (id TEXT PRIMARY KEY,order_id TEXT NOT NULL,email TEXT NOT NULL,kind TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Ricevuto',tracking TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(order_id,kind))"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS order_delivery (order_id TEXT PRIMARY KEY,delivered_at TEXT NOT NULL)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_discounts (code TEXT PRIMARY KEY,email TEXT NOT NULL,percent INTEGER NOT NULL,expires INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1)"),
 env.DB.prepare("CREATE TABLE IF NOT EXISTS communication_events (key TEXT PRIMARY KEY,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
])}
const demoEmail='cliente.demo@delu.example'
const demoId='delu-customer-demo'
function contactPhone(value:unknown){
 const phone=clean(value,50).replace(/[\s()-]/g,'')
 return !phone||/^\+[1-9]\d{7,14}$/.test(phone)?phone:null
}
function savePhone(env:any,id:string,phone:string){
 return phone
  ?env.DB.prepare('INSERT INTO customer_contacts(customer_id,phone) VALUES(?,?) ON CONFLICT(customer_id) DO UPDATE SET phone=excluded.phone').bind(id,phone)
  :env.DB.prepare('DELETE FROM customer_contacts WHERE customer_id=?').bind(id)
}
const origin=(r:Request,env:any)=>(env.SITE_URL||new URL(r.url).origin).replace(/\/$/,'')
export async function enqueue(env:any,id:string,to:string,subject:string,body:string,customerId?:string,marketing=false){await communityTables(env);await env.DB.prepare('INSERT OR IGNORE INTO email_outbox(id,recipient,subject,body,customer_id,marketing) VALUES(?,?,?,?,?,?)').bind(id,to,subject,body,customerId||null,marketing?1:0).run()}
export async function flushMail(env:any){if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return;await communityTables(env);const {results}=await env.DB.prepare('SELECT * FROM email_outbox WHERE sent=0 AND attempts<12 ORDER BY created_at LIMIT 15').all();for(const row of results){
 if(row.marketing){const c=await env.DB.prepare('SELECT marketing FROM customers WHERE id=? AND verified=1').bind(row.customer_id).first();if(!c?.marketing){await env.DB.prepare('UPDATE email_outbox SET sent=2 WHERE id=?').bind(row.id).run();continue}}
 // Retry only within Resend's idempotency window; older failures require manual review.
 if(Date.now()-Date.parse(row.created_at+'Z')>23*3600000)continue
 await env.DB.prepare('UPDATE email_outbox SET attempts=attempts+1 WHERE id=?').bind(row.id).run()
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':row.id},body:JSON.stringify({from:env.EMAIL_FROM,to:[row.recipient],subject:row.subject,text:row.body})});if(response.ok)await env.DB.prepare('UPDATE email_outbox SET sent=1 WHERE id=?').bind(row.id).run()}catch{/* retained for retry */}
}}
async function issue(env:any,kind:string,subject:string,ttl=3600000){const raw=token();await env.DB.prepare('INSERT INTO auth_tokens VALUES(?,?,?,?)').bind(await digest(raw),kind,subject,Date.now()+ttl).run();return raw}
async function consume(env:any,kind:string,raw:string){return env.DB.prepare('DELETE FROM auth_tokens WHERE hash=? AND kind=? AND expires>? RETURNING subject').bind(await digest(raw),kind,Date.now()).first()}
export async function customer(r:Request,env:any){await communityTables(env);const s=await session(r,env,'customer');if(!s||(s.subject===demoId&&!env.DEMO_CUSTOMER_PASSWORD_HASH))return null;return env.DB.prepare('SELECT id,email,name,marketing,verified,(SELECT phone FROM customer_contacts WHERE customer_id=customers.id) AS phone FROM customers WHERE id=? AND verified=1').bind(s.subject).first()}
async function customerCookie(env:any,id:string){return {'set-cookie':await createSession(env,id,'customer')}}
export async function discountFor(env:any,code:string,mail:string){if(!code)return null;await communityTables(env);return env.DB.prepare('SELECT * FROM customer_discounts WHERE code=? AND email=? AND expires>? AND active=1').bind(clean(code,80).toUpperCase(),email(mail),Date.now()).first()}
export async function paidEmails(env:any,id:string,base:string){await communityTables(env);const o=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();if(!o)return;await enqueue(env,'paid-customer-'+id,o.customer_email,'DeLù · pagamento ricevuto '+id,'Abbiamo ricevuto il pagamento del tuo ordine '+id+'. Totale EUR '+(o.total_cents/100).toFixed(2)+'.\nArticoli: '+JSON.parse(o.items_json||'[]').map((i:any)=>i.name+' × '+i.qty).join(', ')+'.\nPuoi consultare ordini e resi su '+base+'/account. Puoi richiedere assistenza senza creare un account su '+base+'/returns.\nRecesso: 14 giorni dalla consegna; costo diretto di restituzione a tuo carico per ripensamento. Difetti e non conformità sono gestiti a carico del venditore.\nIndirizzo resi: '+(JSON.parse(o.shipping_json||'{}').returnsAddress||env.RETURNS_ADDRESS||'contatta il negozio')+'\nCondizioni di vendita accettate:\n'+(JSON.parse(o.shipping_json||'{}').termsSnapshot||env.TERMS_NOTICE||'Contatta il negozio per la copia delle condizioni.'));if(env.ADMIN_EMAIL)await enqueue(env,'paid-admin-'+id,env.ADMIN_EMAIL,'DeLù · nuovo ordine pagato '+id,'Nuovo ordine pagato: '+id+'. Apri la dashboard: '+base+'/admin')}

function socialConfig(env:any,provider:string){
 const prefix=provider==='facebook'?'FACEBOOK':'GITHUB'
 const id=env[prefix+'_CLIENT_ID'],secret=env[prefix+'_CLIENT_SECRET']
 const version=env.FACEBOOK_GRAPH_VERSION||'v23.0'
 if(provider==='facebook'&&!/^v[0-9]+\.[0-9]+$/.test(version))return null
 return id&&secret&&env.PRIVACY_NOTICE&&(provider!=='facebook'||(env.RESEND_API_KEY&&env.EMAIL_FROM))?{id,secret,version}:null
}

type SocialProfile={sub:string;mail:string;name:string}
async function socialProfile(provider:string,params:URLSearchParams,version:string):Promise<SocialProfile|null>{
 const facebook=provider==='facebook'
 const headers={accept:'application/json','user-agent':'DeLu storefront'}
 const response=facebook
  ?await fetch('https://graph.facebook.com/'+version+'/oauth/access_token?'+params)
  :await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers,body:params})
 const data:any=await response.json()
 if(!response.ok||typeof data.access_token!=='string')return null
 const auth={...headers,authorization:'Bearer '+data.access_token}
 const profileResponse=await fetch(facebook?'https://graph.facebook.com/'+version+'/me?fields=id,name,email':'https://api.github.com/user',{headers:auth})
 if(!profileResponse.ok)return null
 const profile:any=await profileResponse.json()
 let mail=email(profile.email)
 if(!facebook){
  const addresses=await fetch('https://api.github.com/user/emails',{headers:auth})
  if(!addresses.ok)return null
  const rows:any=await addresses.json()
  mail=email(Array.isArray(rows)?rows.find(x=>x.primary===true&&x.verified===true)?.email:'')
 }
 const sub=String(profile.id??'')
 if(!/^\d{1,40}$/.test(sub))return null
 return {sub,mail,name:clean(profile.name||profile.login,120)||'Cliente DeLù'}
}

async function findSocial(env:any,provider:string,sub:string){
 return env.DB.prepare('SELECT customer_id FROM social_identities WHERE provider=? AND subject=?').bind(provider,sub).first()
}

async function createSocialCustomer(env:any,provider:string,profile:SocialProfile){
 const id=crypto.randomUUID()
 await env.DB.batch([
  env.DB.prepare('INSERT OR IGNORE INTO customers(id,email,name,verified) SELECT ?,?,?,1 WHERE NOT EXISTS (SELECT 1 FROM social_identities WHERE provider=? AND subject=?)').bind(id,profile.mail,profile.name,provider,profile.sub),
  env.DB.prepare('INSERT INTO social_identities(provider,subject,customer_id) SELECT ?,?,id FROM customers WHERE id=?').bind(provider,profile.sub,id)
 ])
 return (await findSocial(env,provider,profile.sub))?.customer_id
}

async function socialRoute(r:Request,env:any,provider:string,callback:boolean){
 const config=socialConfig(env,provider)
 if(!config)return reply({error:'Accesso social non ancora attivo.'},503)
 if(!await limit(env,'social:'+provider+':'+(r.headers.get('cf-connecting-ip')||'unknown'),30,900))return reply({error:'Troppi tentativi.'},429)
 const redirect=origin(r,env)+'/api/customer/'+provider+'/callback'
 const facebook=provider==='facebook',cookieName='delu_oauth_'+provider
 if(!callback){
  const state=await issue(env,provider,'login',600000)
  const authorize=new URL(facebook?'https://www.facebook.com/'+config.version+'/dialog/oauth':'https://github.com/login/oauth/authorize')
  const params=new URLSearchParams({client_id:config.id,redirect_uri:redirect,state,response_type:'code',scope:facebook?'public_profile,email':'read:user user:email'})
  const verifier=token()
  if(!facebook){
   const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)))
   params.set('code_challenge',btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=',''))
   params.set('code_challenge_method','S256')
  }
  authorize.search=params.toString()
  return new Response(null,{status:302,headers:{location:authorize.toString(),'set-cookie':cookie(cookieName,state+'.'+verifier,600),'cache-control':'no-store'}})
 }
 const query=new URL(r.url).searchParams
 const [state,verifier]=cookieValue(r,cookieName).split('.')
 if(!state||state!==query.get('state')||!await consume(env,provider,state))return reply({error:'Accesso social scaduto. Riprova.'},400)
 const code=query.get('code')
 if(!code)return Response.redirect(new URL('/account?social=cancelled',r.url),302)
 const params=new URLSearchParams({client_id:config.id,client_secret:config.secret,redirect_uri:redirect,code,grant_type:'authorization_code'})
 if(!facebook)params.set('code_verifier',verifier)
 const profile=await socialProfile(provider,params,config.version).catch(()=>null)
 if(!profile)return reply({error:'Accesso social non riuscito.'},400)
 let id=(await findSocial(env,provider,profile.sub))?.customer_id
 if(!id){
  if(profile.mail===demoEmail||!validEmail(profile.mail))return reply({error:'Il provider non ha fornito una email utilizzabile.'},400)
  const existing=await env.DB.prepare('SELECT id FROM customers WHERE email=?').bind(profile.mail).first()
  if(existing){
   const current=await customer(r,env)
   if(current?.id!==existing.id)return reply({error:'Email già registrata. Accedi al tuo account e collega il provider da lì.'},409)
   await env.DB.prepare('INSERT OR IGNORE INTO social_identities(provider,subject,customer_id) VALUES(?,?,?)').bind(provider,profile.sub,current.id).run()
   id=(await findSocial(env,provider,profile.sub))?.customer_id
   if(id!==current.id)return reply({error:'Questo provider è già collegato.'},409)
  }else if(facebook){
   if(!await limit(env,'facebook-confirm:'+profile.mail,3,3600))return reply({error:'Attendi prima di richiedere un altro link.'},429)
   const browserProof=token()
   const raw=await issue(env,'facebook-verify:'+await digest(browserProof),JSON.stringify(profile),86400000)
   await enqueue(env,'facebook-'+await digest(raw),profile.mail,'Conferma il tuo account DeLù','Completa la registrazione con Facebook entro 24 ore: '+origin(r,env)+'/account#socialVerify='+raw)
   return new Response(null,{status:302,headers:{location:'/account?social=verify','set-cookie':cookie('delu_facebook_verify',browserProof,86400),'cache-control':'no-store'}})
  }else id=await createSocialCustomer(env,provider,profile)
 }
 if(!id)return reply({error:'Email già registrata. Accedi al tuo account.'},409)
 return new Response(null,{status:302,headers:{location:'/account','set-cookie':await createSession(env,id,'customer'),'cache-control':'no-store'}})
}

export async function communityRoute(r:Request,env:any,path:string,admin:boolean):Promise<Response|null>{
 const method=r.method,url=new URL(r.url)
 if(!path.startsWith('customer/')&&!path.startsWith('admin/community'))return null
 await communityTables(env)
 if(method==='POST'&&!await limit(env,'community:'+path+':'+(r.headers.get('cf-connecting-ip')||'unknown'),30,900))return reply({error:'Troppi tentativi. Riprova tra qualche minuto.'},429)
 const b:any=method==='POST'||method==='PATCH'?await r.json().catch(()=>({})):{}
 if(path==='customer/terms')return reply({notice:env.TERMS_NOTICE||''});if(path==='customer/privacy')return reply({notice:env.PRIVACY_NOTICE||''});if(path==='customer/config')return reply({email:!!(env.RESEND_API_KEY&&env.EMAIL_FROM&&env.PRIVACY_NOTICE),google:!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET&&env.PRIVACY_NOTICE),facebook:!!socialConfig(env,"facebook"),github:!!socialConfig(env,"github")})
 const social=path.match(/^customer\/(facebook|github)(\/callback)?$/)
 if(social&&method==='GET')return socialRoute(r,env,social[1],!!social[2])
 if(path==='customer/socialVerify'&&method==='POST'){
  const browserProof=cookieValue(r,'delu_facebook_verify')
  if(!browserProof)return reply({error:'Apri il link nel browser usato per registrarti con Facebook.'},400)
  const proof=await consume(env,'facebook-verify:'+await digest(browserProof),clean(b.token,100))
  if(!proof)return reply({error:'Link non valido o scaduto.'},400)
  const profile:SocialProfile=JSON.parse(proof.subject)
  const id=await createSocialCustomer(env,'facebook',profile)
  if(!id)return reply({error:'Email già registrata. Accedi al tuo account.'},409)
  return reply({ok:true},200,await customerCookie(env,id))
 }
 if(path==='customer/register'&&method==='POST'){
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM||!env.PRIVACY_NOTICE)return reply({error:'Registrazione email non ancora attivata dal negozio.'},503)
  const phone=contactPhone(b.phone);if(phone===null)return reply({error:'Inserisci il cellulare con prefisso internazionale, ad esempio +39.'},400)
  const mail=email(b.email);if(mail===demoEmail||!validEmail(mail)||String(b.password||'').length<12||String(b.password||'').length>200||!clean(b.name,120)||b.privacy!==true)return reply({error:'Inserisci nome, email, password di almeno 12 caratteri e presa visione della privacy.'},400)
  if(!await limit(env,'register:'+mail,3,3600))return reply({error:'Attendi prima di riprovare.'},429)
  const existing=await env.DB.prepare('SELECT * FROM customers WHERE email=?').bind(mail).first()
  if(!existing){const id=crypto.randomUUID();await env.DB.batch([env.DB.prepare('INSERT INTO customers(id,email,name,password,marketing,consent_at) VALUES(?,?,?,?,?,?)').bind(id,mail,clean(b.name,120),await passwordHash(b.password),b.marketing===true?1:0,b.marketing===true?new Date().toISOString():null),savePhone(env,id,phone)]);const raw=await issue(env,'verify',id,86400000);await enqueue(env,'verify-'+await digest(raw),mail,'Conferma il tuo account DeLù','Conferma la tua email entro 24 ore: '+origin(r,env)+'/account#verify='+raw)}
  return reply({message:'Se la registrazione può essere completata riceverai una email. Se hai già un account, accedi o recupera la password.'})
 }
 if(path==='customer/verify'&&method==='POST'){const row=await consume(env,'verify',clean(b.token,100));if(!row)return reply({error:'Link non valido o scaduto. Richiedi una nuova email.'},400);await env.DB.prepare('UPDATE customers SET verified=1 WHERE id=?').bind(row.subject).run();return reply({ok:true},200,await customerCookie(env,row.subject))}
 if(path==='customer/login'&&method==='POST'){
  const mail=email(b.email);if(!await limit(env,'customer-login:'+mail,8,900))return reply({error:'Troppi tentativi. Riprova più tardi.'},429)
  if(mail===demoEmail){
   const hash=env.DEMO_CUSTOMER_PASSWORD_HASH
   if(!hash||!await passwordMatches(String(b.password||'').slice(0,201),hash))return reply({error:'Credenziali non valide.'},401)
   await env.DB.prepare("INSERT OR IGNORE INTO customers(id,email,name,verified) VALUES(?,?,'Cliente demo DeLù',1)").bind(demoId,demoEmail).run()
   const demo=await env.DB.prepare('SELECT id FROM customers WHERE id=? AND email=?').bind(demoId,demoEmail).first()
   if(!demo)return reply({error:'Account demo non disponibile.'},409)
   return reply({ok:true},200,await customerCookie(env,demoId))
  }
  const c=await env.DB.prepare('SELECT * FROM customers WHERE email=?').bind(mail).first()
  const matches=await passwordMatches(String(b.password||'').slice(0,201),c?.password||('0'.repeat(64)+':'+'0'.repeat(64)))
  if(!c||!matches||!c.verified)return reply({error:'Credenziali non valide o email non confermata.'},401)
  return reply({ok:true},200,await customerCookie(env,c.id))
 }
 if((path==='customer/forgot'||path==='customer/resend')&&method==='POST'){
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return reply({error:'Email non ancora configurata.'},503)
  const mail=email(b.email);if(!await limit(env,'email-link:'+mail,3,3600))return reply({error:'Attendi prima di richiedere un altro link.'},429)
  const c=await env.DB.prepare('SELECT * FROM customers WHERE email=?').bind(mail).first()
  const kind=path.endsWith('resend')?'verify':'reset'
  if(mail!==demoEmail&&c&&(kind==='reset'||!c.verified)){const raw=await issue(env,kind,c.id);await enqueue(env,kind+'-'+await digest(raw),mail,'DeLù · '+(kind==='reset'?'recupero password':'conferma email'),origin(r,env)+'/account#'+kind+'='+raw+'\nIl link è valido per un’ora.')}
  return reply({message:'Se esiste un account compatibile riceverai una email.'})
 }
 if(path==='customer/reset'&&method==='POST'){if(String(b.password||'').length<12||String(b.password||'').length>200)return reply({error:'La password deve contenere da 12 a 200 caratteri.'},400);const row=await consume(env,'reset',clean(b.token,100));if(!row)return reply({error:'Link scaduto o già utilizzato.'},400);await env.DB.batch([env.DB.prepare('UPDATE customers SET password=?,verified=1 WHERE id=?').bind(await passwordHash(b.password),row.subject),env.DB.prepare("DELETE FROM sessions WHERE subject=? AND role='customer'").bind(row.subject)]);return reply({ok:true},200,await customerCookie(env,row.subject))}
 if(path==='customer/logout'&&method==='POST')return reply({ok:true},200,{'set-cookie':await logoutSession(r,env,'customer')})
 if(path==='customer/google'&&method==='GET'){
  if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.PRIVACY_NOTICE)return reply({error:'Accesso Google non attivo.'},503)
  const state=await issue(env,'google','login',600000),verifier=token(),challenge=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')
  const google=new URL('https://accounts.google.com/o/oauth2/v2/auth');google.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:origin(r,env)+'/api/customer/google/callback',response_type:'code',scope:'openid email profile',state,code_challenge:challenge,code_challenge_method:'S256'}).toString()
  return new Response(null,{status:302,headers:{location:google.toString(),'set-cookie':cookie('delu_oauth',state+'.'+verifier,600),'cache-control':'no-store'}})
 }
 if(path==='customer/google/callback'&&method==='GET'){
  const [state,verifier]=cookieValue(r,'delu_oauth').split('.');if(!state||state!==url.searchParams.get('state')||!await consume(env,'google',state))return reply({error:'Accesso Google scaduto. Riprova.'},400)
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,code:url.searchParams.get('code')||'',grant_type:'authorization_code',redirect_uri:origin(r,env)+'/api/customer/google/callback',code_verifier:verifier})});const data:any=await response.json();if(!response.ok||!data.access_token)return reply({error:'Accesso Google non riuscito.'},400)
  const u=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{authorization:'Bearer '+data.access_token}}),profile:any=await u.json()
  if(!u.ok||profile.email_verified!==true||!profile.sub||!validEmail(email(profile.email)))return reply({error:'Google non ha confermato la email.'},400)
  // Linking an existing local account requires its own authenticated session.
  let c=await env.DB.prepare('SELECT * FROM customers WHERE google_sub=?').bind(profile.sub).first()
  if(!c){const byEmail=await env.DB.prepare('SELECT * FROM customers WHERE email=?').bind(email(profile.email)).first();if(byEmail){const current=await customer(r,env);if(current?.id!==byEmail.id)return reply({error:'Email già registrata: accedi con la password e collega Google dal tuo account.'},409);await env.DB.prepare('UPDATE customers SET google_sub=? WHERE id=?').bind(profile.sub,byEmail.id).run();c=byEmail}else{c={id:crypto.randomUUID()};await env.DB.prepare('INSERT INTO customers(id,email,name,verified,google_sub) VALUES(?,?,?,1,?)').bind(c.id,email(profile.email),clean(profile.name,120),profile.sub).run()}}
  return new Response(null,{status:302,headers:{location:'/account','set-cookie':await createSession(env,c.id,'customer'),'cache-control':'no-store'}})
 }
 if(path==='customer/return-access'&&method==='POST'){
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return reply({error:'Contatta il negozio: email automatica non configurata.'},503)
  const order=await env.DB.prepare('SELECT id FROM orders WHERE id=? AND lower(customer_email)=?').bind(clean(b.orderId,80),email(b.email)).first()
  if(order){const raw=await issue(env,'return',order.id,86400000);await enqueue(env,'return-access-'+await digest(raw),email(b.email),'DeLù · accesso al reso',origin(r,env)+'/returns#token='+raw+'\nLink valido per 24 ore. La richiesta sarà registrata quando confermerai il modulo.')}
  return reply({message:'Se ordine ed email corrispondono riceverai il link per procedere. Puoi sempre comunicare il recesso direttamente al negozio.'})
 }
 if(path==='customer/unsubscribe'&&method==='POST'){const row=await consume(env,'unsubscribe',clean(b.token,100));if(!row)return reply({message:'Link già usato o scaduto. Puoi verificare o revocare il consenso dal tuo account.'});await env.DB.prepare('UPDATE customers SET marketing=0,consent_at=? WHERE id=?').bind(new Date().toISOString(),row.subject).run();return reply({message:'Non riceverai più email promozionali.'})}
 const c=await customer(r,env)
 if(path==='customer/returns'&&method==='POST'){
  if(!clean(b.name,120))return reply({error:'Indica il tuo nome e cognome per confermare la comunicazione.'},400);let orderId=clean(b.orderId,80)
  if(!c){const row=await consume(env,'return',clean(b.token,100));if(!row)return reply({error:'Accedi oppure richiedi un nuovo link per il tuo ordine.'},401);orderId=row.subject}
  const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?'+(c?' AND lower(customer_email)=?':'')).bind(...(c?[orderId,c.email]:[orderId])).first()
  if(!order)return reply({error:'Ordine non trovato.'},404)
  const kind=b.kind==='defect'?'defect':'withdrawal',id=crypto.randomUUID()
  await env.DB.prepare('INSERT OR IGNORE INTO returns_requests(id,order_id,email,kind,message) VALUES(?,?,?,?,?)').bind(id,order.id,order.customer_email,kind,clean(b.message,2000)).run()
  await enqueue(env,'return-receipt-'+order.id+'-'+kind,order.customer_email,'DeLù · richiesta di reso ricevuta','Abbiamo ricevuto la tua comunicazione di reso per ordine '+order.id+'. Nome: '+clean(b.name,120)+'. Tipo: '+kind+'. Data e ora UTC: '+new Date().toISOString()+'.\n'+clean(b.message,2000)+'\nPer ripensamento, rispedisci entro 14 giorni da questa comunicazione; il costo diretto di restituzione è a tuo carico. Per difetti, contatta il negozio per la gestione a carico del venditore.\nIndirizzo e istruzioni di reso: '+(env.RETURNS_ADDRESS||'contatta il negozio al +39 331 786 2178')+'. Non inviare carte di pagamento o dati sensibili.')
  if(env.ADMIN_EMAIL)await enqueue(env,'return-admin-'+order.id+'-'+kind,env.ADMIN_EMAIL,'DeLù · nuovo reso '+order.id,'Apri '+origin(r,env)+'/admin per gestire la richiesta.')
  const receipt=await env.DB.prepare('SELECT created_at FROM returns_requests WHERE order_id=? AND kind=?').bind(order.id,kind).first();return reply({message:'Comunicazione ricevuta. La conferma email è in invio. Conserva ordine e data di questa comunicazione.',receivedAt:receipt.created_at+'Z',orderId:order.id})
 }
 if(path.startsWith('customer/')){
  if(!c)return reply({error:'Accedi al tuo account.'},401)
  if(path==='customer/me')return reply(c)
  if(path==='customer/preferences'&&method==='POST'){
   const phone=contactPhone(b.phone)
   if(phone===null)return reply({error:'Inserisci il cellulare con prefisso internazionale, ad esempio +39.'},400)
   const writes=[env.DB.prepare('UPDATE customers SET marketing=?,consent_at=? WHERE id=?').bind(b.marketing===true?1:0,new Date().toISOString(),c.id)]
   if(Object.hasOwn(b,'phone'))writes.push(savePhone(env,c.id,phone))
   await env.DB.batch(writes)
   return reply({ok:true})
  }
  if(path==='customer/orders'){const {results}=await env.DB.prepare("SELECT id,total_cents,status,items_json,created_at FROM orders WHERE lower(customer_email)=? ORDER BY created_at DESC LIMIT 100").bind(c.email).all();return reply(results.map((o:any)=>({id:o.id,total:o.total_cents/100,status:o.status,createdAt:o.created_at,items:JSON.parse(o.items_json)})))}
  if(path==='customer/returns'){const {results}=await env.DB.prepare('SELECT * FROM returns_requests WHERE email=? ORDER BY created_at DESC').bind(c.email).all();return reply(results)}
 }
 if(path.startsWith('admin/community')){
  if(!admin)return reply({error:'Non autorizzato'},401)
  if(path==='admin/community/status'){const {results:returns}=await env.DB.prepare('SELECT r.*,d.delivered_at FROM returns_requests r LEFT JOIN order_delivery d ON d.order_id=r.order_id ORDER BY created_at DESC LIMIT 100').all();const {results:customers}=await env.DB.prepare('SELECT id,email,name,verified,marketing,created_at FROM customers ORDER BY created_at DESC LIMIT 250').all();const mail=await env.DB.prepare('SELECT count(*) AS pending FROM email_outbox WHERE sent=0').first();return reply({returns,customers,emailConfigured:!!(env.RESEND_API_KEY&&env.EMAIL_FROM),pendingEmail:mail.pending})}
  if(path==='admin/community/return'&&method==='POST'){const states=['Ricevuto','Istruzioni inviate','In transito','Ricevuto in negozio','Rimborso da eseguire','Rimborsato','Assistenza'];if(!states.includes(b.status))return reply({error:'Stato non valido'},400);await env.DB.prepare('UPDATE returns_requests SET status=?,tracking=? WHERE id=?').bind(b.status,clean(b.tracking,160),clean(b.id,80)).run();return reply({ok:true})}
  if(path==='admin/community/delivery'&&method==='POST'){const date=clean(b.deliveredAt,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||Date.parse(date)>Date.now())return reply({error:'Data di consegna non valida.'},400);const order=await env.DB.prepare('SELECT id FROM orders WHERE id=?').bind(clean(b.orderId,80)).first();if(!order)return reply({error:'Ordine non trovato'},404);await env.DB.prepare('INSERT INTO order_delivery VALUES(?,?) ON CONFLICT(order_id) DO UPDATE SET delivered_at=excluded.delivered_at').bind(order.id,date).run();return reply({ok:true})}
  if(path==='admin/community/promotion'&&method==='POST'){
   if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return reply({error:'Configura Resend e mittente prima di inviare.'},503)
   const c=await env.DB.prepare('SELECT * FROM customers WHERE id=? AND verified=1 AND marketing=1').bind(clean(b.customerId,80)).first()
   const percent=Number(b.percent);if(!c||!Number.isInteger(percent)||percent<1||percent>50)return reply({error:'Seleziona un cliente con consenso e uno sconto fra 1 e 50%.'},400)
   const code='DELU'+token().slice(0,12).toUpperCase(),expires=Date.now()+30*86400000,raw=await issue(env,'unsubscribe',c.id,365*86400000)
   await env.DB.prepare('INSERT INTO customer_discounts(code,email,percent,expires) VALUES(?,?,?,?)').bind(code,c.email,percent,expires).run()
   await enqueue(env,'promotion-'+code,c.email,'DeLù · il tuo sconto personale',clean(b.message,1500)+'\nIl tuo codice: '+code+' · '+percent+'% sui prodotti, spedizione esclusa. Riutilizzabile per 30 giorni con la tua email; non cumulabile con altri codici.\nAcquista: '+origin(r,env)+'/shop\nDisiscriviti: '+origin(r,env)+'/account#unsubscribe='+raw,c.id,true)
   return reply({message:'Sconto creato e email messa in coda.',code})
  }
 }
 return reply({error:'Endpoint non trovato'},404)
}
