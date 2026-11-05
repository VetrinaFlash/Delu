import {chromium} from '@playwright/test'
import {strict as assert} from 'node:assert'
import {mkdir} from 'node:fs/promises'

const base=(process.env.PREVIEW_BASE||'https://feature-wardrobe-snapshot-wo.delu-49u.pages.dev').replace(/\/$/,'')
const production='https://delu-49u.pages.dev'
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
let catalog
for(let attempt=0;attempt<20;attempt++){
 try{
  const response=await fetch(base+'/wardrobe-catalog.json?probe='+Date.now(),{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)})
  if(!response.ok)throw Error('HTTP '+response.status)
  const data=await response.json()
  assert.equal(data.source,'DELU-public-D1')
  assert(Array.isArray(data.products)&&data.products.length>0)
  assert(Date.now()-Date.parse(data.fetchedAt)<90*60*1000,'Snapshot older than 90 minutes')
  catalog=data
  break
 }catch(error){console.log('Waiting for real catalogue snapshot '+(attempt+1)+'/20: '+String(error));await sleep(6000)}
}
assert(catalog,'Cloudflare preview did not publish a real catalogue snapshot')
const live=await fetch(production+'/api/products',{signal:AbortSignal.timeout(15000)}).then(r=>r.json())
assert(Array.isArray(live)&&live.length>0,'Production API must return products')
const verified=catalog.products.filter(p=>live.some(q=>q.id===p.id&&q.price===p.price))
assert(verified.length>0,'Preview products must match real product IDs and EUR prices from production D1')
console.log('Verified preview JSON: '+catalog.products.length+' public items, '+catalog.products.filter(p=>p.active&&p.stock>0).length+' available; '+verified.length+' exact ID+price matches to production')

await mkdir('test-results',{recursive:true})
const browser=await chromium.launch({headless:true})
try{
 for(const [width,height] of [[390,844],[320,740],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
  await page.addInitScript(()=>localStorage.setItem('delu_locale','it'))
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000})
  const rail=page.locator('[data-testid="live-wardrobe"]')
  await rail.scrollIntoViewIfNeeded({timeout:30000})
  await rail.locator('.dl-wardrobe-item').first().waitFor({state:'visible',timeout:25000})
  const title=await rail.locator('.dl-wardrobe-selected h3').innerText()
  const price=await rail.locator('.dl-wardrobe-selected-meta strong').innerText()
  assert(title.length>1&&price.includes('€'),'Must show real garment and EUR price')
  assert(!await rail.getByText('Non è possibile caricare ora il magazzino.').count(),'Must not show failed inventory')
  const link=await rail.getByText('SCOPRI IL CAPO').getAttribute('href')
  assert(link?.startsWith(production+'/product/'),'Preview must lead to real store checkout')
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)
  assert(overflow<=2,'Horizontal scroll at '+width+'px: '+overflow)
  const imgs=await rail.locator('.dl-wardrobe-item.is-current img').evaluateAll(nodes=>nodes.map(x=>({complete:x.complete,width:x.naturalWidth})))
  assert(imgs[0]?.width>0,'Featured garment image must be loaded at '+width+'px')
  if(width===390){
   await rail.getByRole('button',{name:'Capo successivo'}).click()
   assert.notEqual(await rail.locator('.dl-wardrobe-selected h3').innerText(),title,'Next button should move garment')
  }
  await page.screenshot({path:'test-results/wardrobe-live-'+width+'.png',fullPage:false})
  assert.deepEqual(errors,[],'No uncaught browser exceptions')
  console.log('LIVE '+width+'x'+height+': '+title+' '+price+' OK; overflow='+overflow)
  await page.close()
 }
}finally{await browser.close()}
console.log('LIVE WARDROBE PREVIEW PASS: '+base)
