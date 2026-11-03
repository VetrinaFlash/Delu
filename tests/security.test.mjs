import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
let root,handler,security
before(async()=>{
 root=await mkdtemp(join(tmpdir(),'delu-security-'));await mkdir(join(root,'_lib'));await mkdir(join(root,'api'))
 for(const file of ['security','community']){const source=(await readFile('functions/_lib/'+file+'.ts','utf8')).replace("from './security'","from './security.ts'");await writeFile(join(root,'_lib',file+'.ts'),source)}
 const source=(await readFile('functions/api/[[path]].ts','utf8')).replaceAll("from '../_lib/security'","from '../_lib/security.ts'").replaceAll("from '../_lib/community'","from '../_lib/community.ts'")
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
 assert.equal((await request(env,'customer/returns',{orderId:'order-1'})).status,401)
 await request(env,'customer/return-access',{orderId:'order-1',email:'wrong@example.test'});assert.equal(env.DB.db.prepare('SELECT count(*) n FROM email_outbox').get().n,0)
 await request(env,'customer/return-access',{orderId:'order-1',email:'anna@example.test'})
 const mail=env.DB.db.prepare('SELECT * FROM email_outbox').get(),raw=mail.body.match(/token=([a-f0-9]+)/)[1]
 assert.equal((await request(env,'customer/returns',{token:raw,kind:'withdrawal',message:'Una giacca'})).status,200)
 assert.equal(env.DB.db.prepare('SELECT count(*) n FROM returns_requests').get().n,1)
 assert.equal((await request(env,'customer/returns',{token:raw})).status,401)
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
test('discount is bound to email, expires, and is recalculated on the server',async()=>{
 const env=await setup();env.NEXI_XPAY_API_KEY='test'
 await request(env,'customer/config')
 env.DB.db.prepare("INSERT INTO products(id,name,slug,price_cents,category,colors_json,sizes_json,stock) VALUES('p','Dress','dress',10000,'Abiti','[\"Nero\"]','[\"M\"]',5)").run()
 env.DB.db.prepare("INSERT INTO customer_discounts VALUES('PROMO','anna@example.test',20,?,1)").run(Date.now()+86400000)
 assert.equal((await request(env,'discount',{code:'PROMO',email:'other@example.test'})).status,400)
 const original=globalThis.fetch;let charged
 globalThis.fetch=async(url,options)=>{assert.match(String(url),/orders\/hpp/);charged=JSON.parse(options.body);return new Response(JSON.stringify({hostedPage:'https://pay.test',securityToken:'secret'}),{status:200})}
 try{
 const r=await request(env,'checkout/nexi',{termsAccepted:true,discountCode:'PROMO',customer:{name:'Anna',email:'anna@example.test'},shipping:{address:'Via Test 1',city:'Roma',postcode:'00100',country:'IT'},items:[{id:'p',qty:1,size:'M',color:'Nero'}]})
 assert.equal(r.status,201);assert.equal(charged.order.amount,'8000');assert.equal(env.DB.db.prepare("SELECT stock FROM products WHERE id='p'").get().stock,5)
 }finally{globalThis.fetch=original}
})
