import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
let root,handler,security
before(async()=>{
 root=await mkdtemp(join(process.cwd(),'.delu-security-'));await mkdir(join(root,'_lib'));await mkdir(join(root,'api'))
 for(const filename of await readdir('functions/_lib')){if(!filename.endsWith('.ts'))continue;const source=(await readFile('functions/_lib/'+filename,'utf8')).replace(/from '(\.\/[a-zA-Z]+)'/g,"from '$1.ts'");await writeFile(join(root,'_lib',filename),source)}
 const source=(await readFile('functions/api/[[path]].ts','utf8')).replace(/from '(\.\.\/_lib\/[a-zA-Z]+)'/g,"from '$1.ts'")
 await writeFile(join(root,'api/handler.ts'),source);handler=await import('file://'+join(root,'api/handler.ts'));security=await import('file://'+join(root,'_lib/security.ts'))
})
after(async()=>{await rm(root,{recursive:true,force:true})})
class DB{
 constructor(){this.db=new DatabaseSync(':memory:')}
 prepare(sql){const db=this.db;let args=[];const obj={bind(...values){args=values;return obj},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}};return obj}
 async batch(statements){this.db.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());this.db.exec('COMMIT');return out}catch(e){this.db.exec('ROLLBACK');throw e}}
}
async function setup(){const DBi=new DB();DBi.db.exec(await readFile('database/schema.sql','utf8'));return {DB:DBi,ADMIN_EMAIL:'owner@example.test',ADMIN_PASSWORD_SHA256:await security.digest('OwnerPassword!12345'),AUTH_SECRET:'test-only-secret',SITE_URL:'https://shop.test',RESEND_API_KEY:'test-key',EMAIL_FROM:'DeLu <shop@example.test>',PRIVACY_NOTICE:'Test privacy notice',TERMS_NOTICE:'Test sale terms',RETURNS_ADDRESS:'Test return address'}}
async function request(env,path,body,sessionCookie,origin='https://shop.test'){
 const work=[];const r=new Request('https://shop.test/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json',...(sessionCookie?{cookie:sessionCookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})})
 const result=await handler.onRequest({request:r,env,params:{},waitUntil:p=>work.push(p)});await Promise.all(work);return result
}
test('admin sessions are opaque, revocable, bounded and reject CSRF',async()=>{
 const env=await setup()
 assert.equal((await request(env,'auth/login',{email:env.ADMIN_EMAIL,password:'OwnerPassword!12345'},null,'https://evil.test')).status,403)
 const r=await request(env,'auth/login',{email:env.ADMIN_EMAIL,password:'OwnerPassword!12345'});assert.equal(r.status,200)
 const c=r.headers.get('set-cookie');assert.match(c,/HttpOnly; Secure; SameSite=Lax/);assert.ok(!c.includes('OwnerPassword'))
 assert.equal((await request(env,'auth/me',undefined,c)).status,200)
 const raw=c.split(';')[0].split('=')[1],row=env.DB.db.prepare('SELECT * FROM sessions').get();assert.notEqual(row.hash,raw);assert.equal(row.hash,await security.digest(raw));assert.ok(row.absolute_expires>Date.now())
 await request(env,'auth/logout',{},c);assert.equal((await request(env,'auth/me',undefined,c)).status,401)
})
test('registration verifies email once, uses salted password and isolates customer data',async()=>{
 const env=await setup();const original=globalThis.fetch;globalThis.fetch=async()=>new Response('{"id":"test"}',{status:200})
 try{
 assert.equal((await request(env,'customer/register',{name:'Anna',email:'anna@example.test',password:'A-long-password-123',privacy:true})).status,200)
 const user=env.DB.db.prepare('SELECT * FROM customers').get();assert.equal(user.verified,0);assert.equal(user.marketing,0);assert.ok(!user.password.includes('A-long-password-123'))
 assert.equal((await request(env,'customer/login',{email:user.email,password:'A-long-password-123'})).status,401)
 const mail=env.DB.db.prepare('SELECT * FROM email_outbox').get(),raw=mail.body.match(/verify=([a-f0-9]+)/)[1]
 const verify=await request(env,'customer/verify',{token:raw});assert.equal(verify.status,200);const c=verify.headers.get('set-cookie')
 assert.equal((await request(env,'customer/verify',{token:raw})).status,400)
 assert.equal((await request(env,'customer/me',undefined,c)).status,200)
 assert.equal((await request(env,'admin/community/status',undefined,c)).status,401)
 const promo=await request(env,'admin/community/promotion',{customerId:user.id,percent:20},c);assert.equal(promo.status,401)
 assert.equal((await request(env,'customer/orders',undefined,c)).status,200)
 env.DB.db.prepare('UPDATE sessions SET expires=0').run();assert.equal((await request(env,'customer/me',undefined,c)).status,401)
 }finally{globalThis.fetch=original}
})
test('guest returns require email proof; receipt is durable and request is not rejected by purchase date',async()=>{
 const env=await setup();const original=globalThis.fetch;globalThis.fetch=async()=>new Response('{"id":"test"}',{status:200})
 try{
 env.DB.db.prepare("INSERT INTO orders(id,customer_name,customer_email,total_cents,items_json,status) VALUES('order-1','Anna','anna@example.test',5000,'[]','Spedito')").run()
 assert.equal((await request(env,'customer/returns',{orderId:'order-1',name:'Anna'})).status,401)
 await request(env,'customer/return-access',{orderId:'order-1',email:'wrong@example.test'});assert.equal(env.DB.db.prepare('SELECT count(*) n FROM email_outbox').get().n,0)
 await request(env,'customer/return-access',{orderId:'order-1',email:'anna@example.test'})
 const mail=env.DB.db.prepare('SELECT * FROM email_outbox').get(),raw=mail.body.match(/token=([a-f0-9]+)/)[1]
 assert.equal((await request(env,'customer/returns',{token:raw,name:'Anna',kind:'withdrawal',message:'Una giacca'})).status,200)
 assert.equal(env.DB.db.prepare('SELECT count(*) n FROM returns_requests').get().n,1)
 assert.equal((await request(env,'customer/returns',{name:'Anna',token:raw})).status,401)
 assert.ok(env.DB.db.prepare("SELECT * FROM email_outbox WHERE id='return-receipt-order-1-withdrawal'").get())
 }finally{globalThis.fetch=original}
})
test('Google callback rejects forged or missing state; promotions require consent',async()=>{
 const env=await setup()
 assert.equal((await request(env,'customer/google/callback')).status,400)
 const login=await request(env,'auth/login',{email:env.ADMIN_EMAIL,password:'OwnerPassword!12345'}),c=login.headers.get('set-cookie')
 env.DB.db.prepare("INSERT INTO customers(id,email,name,verified,marketing) VALUES('one','one@example.test','One',1,0)").run()
 assert.equal((await request(env,'admin/community/promotion',{customerId:'one',percent:20,message:'Ciao'},c)).status,400)
})
test('request -> review -> WhatsApp link -> verified payment, without relying on local stock',async()=>{
 const env=await setup();env.NEXI_XPAY_API_KEY='test'
 await request(env,'customer/config')
 env.DB.db.prepare(`INSERT INTO products(id,name,slug,price_cents,category,colors_json,sizes_json,stock) VALUES('p','Dress','dress',10000,'Abiti','["Nero","Rosa"]','["M","L"]',0)`).run()
 env.DB.db.prepare("INSERT INTO customer_discounts VALUES('PROMO','anna@example.test',20,?,1)").run(Date.now()+86400000)
 assert.equal((await request(env,'discount',{code:'PROMO',email:'other@example.test'})).status,400)
 const original=globalThis.fetch;let charged=null,labels=0
 globalThis.fetch=async(url,options)=>{if(String(url).includes('/api/v2/labels/'))return new Response('%PDF-1.4 test',{headers:{'content-type':'application/pdf'}});if(String(url).includes('sendcloud')){labels++;return new Response(JSON.stringify({parcel:{id:123,label:{normal_printer:['https://panel.sendcloud.sc/api/v2/labels/normal_printer/123']},tracking_number:'TRACK'}}),{status:200})}if(String(url).includes('resend'))return new Response('{"id":"test"}',{status:200});charged=JSON.parse(options.body);return new Response(JSON.stringify({hostedPage:'https://pay.test',securityToken:'secret'}),{status:200})}
 try{
 const r=await request(env,'checkout/nexi',{termsAccepted:true,discountCode:'PROMO',customer:{name:'Anna',email:'anna@example.test',phone:'+393331234567'},shipping:{address:'Via Test 1',city:'Roma',postcode:'00100',country:'IT'},items:[{id:'p',qty:1,size:'M',color:'Nero'}]})
 assert.equal(r.status,201);const {orderId}=await r.json();assert.equal(charged,null)
 assert.equal(env.DB.db.prepare('SELECT count(*) n FROM payments').get().n,0)
 const login=await request(env,'auth/login',{email:env.ADMIN_EMAIL,password:'OwnerPassword!12345'}),c=login.headers.get('set-cookie')
 assert.equal((await request(env,'admin/order-requests/'+orderId+'/approve',{version:1})).status,401)
 assert.equal((await request(env,'admin/order-requests/'+orderId+'/edit',{version:1,items:[{id:'p',qty:2,unitPrice:90,color:'Rosa',size:'L'}],shippingCost:5,discount:10},c)).status,200)
 assert.equal((await request(env,'admin/order-requests/'+orderId+'/approve',{version:1},c)).status,409)
 const approved=await request(env,'admin/order-requests/'+orderId+'/approve',{version:2},c);assert.equal(approved.status,200);const share=await approved.json();assert.match(share.whatsappUrl,/wa.me\/393331234567/)
 assert.equal(env.DB.db.prepare('SELECT total_cents FROM orders WHERE id=?').get(orderId).total_cents,17500)
 assert.equal((await request(env,'admin/order-requests/'+orderId+'/edit',{version:3,items:[]},c)).status,409)
 assert.equal((await request(env,'admin/order-requests/'+orderId+'/label',{},c)).status,409)
 const raw=share.paymentUrl.split('/').pop();const summary=await (await request(env,'order-requests/'+raw)).json();assert.equal(summary.total,175)
 const pay=await request(env,'order-requests/'+raw,{accepted:true});assert.equal(pay.status,200);assert.equal(charged.order.amount,'17500')
 await request(env,'order-requests/'+raw,{accepted:true});assert.equal(env.DB.db.prepare('SELECT count(*) n FROM payments').get().n,1)
 const callback={securityToken:'secret',operation:{orderId,operationId:'op',operationResult:'EXECUTED',operationAmount:'17500',operationCurrency:'EUR'}}
 assert.equal((await request(env,'payments/nexi/notification',{...callback,securityToken:'wrong'})).status,401)
 assert.equal((await request(env,'payments/nexi/notification',{...callback,operation:{...callback.operation,operationAmount:'1'}})).status,400)
 await request(env,'payments/nexi/notification',{...callback,operation:{...callback.operation,operationResult:'FAILED'}});assert.ok(env.DB.db.prepare("SELECT id FROM email_outbox WHERE id LIKE 'failed-admin-%'").get());assert.equal((await request(env,'payments/nexi/notification',callback)).status,200)
 assert.equal(env.DB.db.prepare('SELECT status FROM orders WHERE id=?').get(orderId).status,'Pagato - da preparare')
 assert.equal(env.DB.db.prepare('SELECT stock FROM products').get().stock,0)
 assert.equal(env.DB.db.prepare('SELECT state FROM shipping_labels').get().state,'READY');env.SENDCLOUD_PUBLIC_KEY='test';env.SENDCLOUD_SECRET_KEY='test';env.SENDCLOUD_SENDER_ID='1';const labelBody={street:'Via Test',houseNumber:'1',weight:1,shippingMethod:1};assert.equal((await request(env,'admin/order-requests/'+orderId+'/label',labelBody,c)).status,200);assert.equal((await request(env,'admin/order-requests/'+orderId+'/label',labelBody,c)).status,409);assert.equal(labels,1);const pdf=await request(env,'admin/order-requests/'+orderId+'/label',undefined,c);assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf')
 await request(env,'payments/nexi/notification',{...callback,operation:{...callback.operation,operationResult:'FAILED'}})
 assert.equal(env.DB.db.prepare('SELECT status FROM payments').get().status,'PAID')
 assert.equal((await handler.onRequest({request:new Request('https://shop.test/api/admin/orders/'+orderId,{method:'PATCH',headers:{origin:'https://shop.test','content-type':'application/json',cookie:c},body:JSON.stringify({status:'Annullato'})}),env,params:{},waitUntil:()=>{}})).status,409)
 }finally{globalThis.fetch=original}
})
test('first API request bootstraps schema and preserves existing records',async()=>{
 const env=await setup();env.DB=new DB()
 assert.equal((await request(env,'config')).status,200)
 assert.ok(env.DB.db.prepare('SELECT name FROM sqlite_master WHERE name=\'products\'').get())
 assert.equal(env.DB.db.prepare('SELECT count(*) n FROM customers').get().n,0)
 assert.equal((await request(env,'config')).status,200)
 assert.equal(env.DB.db.prepare('SELECT count(*) n FROM shop_settings').get().n,1)
})

test('Fidelity enrollment is separate from marketing; native Apple and Samsung payloads are signed',async()=>{
 const env=await setup();env.FIDELITY_TERMS='Tessera personale; benefici definiti dal negozio.'
 await request(env,'customer/config')
 env.DB.db.prepare("INSERT INTO customers(id,email,name,verified,marketing) VALUES('fidelity-user','fidelity@example.test','Anna',1,0)").run()
 const c=await security.createSession(env,'fidelity-user','customer')
 assert.equal((await request(env,'fidelity/join',{accepted:false},c)).status,400)
 assert.equal((await request(env,'fidelity/join',{accepted:true},c)).status,200)
 await request(env,'fidelity/join',{accepted:true},c)
 assert.equal(env.DB.db.prepare('SELECT count(*) n FROM fidelity_members').get().n,1)
 assert.equal(env.DB.db.prepare("SELECT marketing FROM customers WHERE id='fidelity-user'").get().marketing,0)
 assert.equal((await request(env,'fidelity/apple',undefined,c)).status,503)
 const {default:forge}=await import('node-forge'),{unzipSync,strFromU8}=await import('fflate')
 const keys=forge.pki.rsa.generateKeyPair(2048),cert=forge.pki.createCertificate();cert.publicKey=keys.publicKey;cert.serialNumber='01';cert.validity.notBefore=new Date(Date.now()-1000);cert.validity.notAfter=new Date(Date.now()+86400000)
 cert.setSubject([{name:'commonName',value:'Test DeLu'},{name:'organizationalUnitName',value:'TEAMTEST'},{type:'0.9.2342.19200300.100.1.1',value:'pass.test.delu'}]);cert.setIssuer(cert.subject.attributes);cert.sign(keys.privateKey,forge.md.sha256.create())
 env.APPLE_PASS_CERT_PEM=forge.pki.certificateToPem(cert);env.APPLE_WWDR_CERT_PEM=env.APPLE_PASS_CERT_PEM;env.APPLE_PASS_KEY_PEM=forge.pki.privateKeyToPem(keys.privateKey);env.APPLE_PASS_TYPE_ID='pass.test.delu';env.APPLE_TEAM_ID='TEAMTEST'
 const response=await request(env,'fidelity/apple',undefined,c);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/vnd.apple.pkpass')
 const archive=unzipSync(new Uint8Array(await response.arrayBuffer())),pass=JSON.parse(strFromU8(archive['pass.json'])),manifest=JSON.parse(strFromU8(archive['manifest.json']))
 assert.equal(pass.passTypeIdentifier,'pass.test.delu');assert.equal(pass.barcodes[0].message,env.DB.db.prepare('SELECT id FROM fidelity_members').get().id)
 for(const [name,hash]of Object.entries(manifest))assert.equal(forge.md.sha1.create().update(String.fromCharCode(...archive[name])).digest().toHex(),hash)
 await writeFile(join(root,'signature.der'),archive.signature);await writeFile(join(root,'manifest.json'),archive['manifest.json'])
 const {execFileSync}=await import('node:child_process');execFileSync('openssl',['cms','-verify','-binary','-inform','DER','-in',join(root,'signature.der'),'-content',join(root,'manifest.json'),'-noverify'],{stdio:'pipe'})
 env.SAMSUNG_PARTNER_KEY_PEM=env.APPLE_PASS_KEY_PEM;env.SAMSUNG_PUBLIC_KEY_PEM=forge.pki.publicKeyToPem(keys.publicKey);env.SAMSUNG_CARD_ID='CARD';env.SAMSUNG_PARTNER_ID='PARTNER';env.SAMSUNG_CERTIFICATE_ID='CERT'
 const samsung=await (await request(env,'fidelity/samsung',{},c)).json();assert.ok(samsung.url.startsWith('https://a.swallet.link/atw/v3/CARD#Clip?cdata='))
 const data=samsung.url.split('cdata=')[1],parts=data.split('.'),decode=v=>Buffer.from(v,'base64url').toString('binary')
 assert.equal(JSON.parse(decode(parts[0])).cty,'CARD');assert.ok(keys.publicKey.verify(forge.md.sha256.create().update(parts[0]+'.'+parts[1]).digest().bytes(),decode(parts[2])))
 const inner=decode(parts[1]).split('.'),cek=keys.privateKey.decrypt(decode(inner[1]),'RSAES-PKCS1-V1_5'),cipher=forge.cipher.createDecipher('AES-GCM',cek);cipher.start({iv:decode(inner[2]),additionalData:inner[0],tag:forge.util.createBuffer(decode(inner[4])),tagLength:128});cipher.update(forge.util.createBuffer(decode(inner[3])));assert.ok(cipher.finish());assert.equal(JSON.parse(forge.util.decodeUtf8(cipher.output.bytes())).card.type,'loyalty')
})
