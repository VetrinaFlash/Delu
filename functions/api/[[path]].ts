type Env = {
  DB: any
  ADMIN_EMAIL: string
  ADMIN_PASSWORD_SHA256: string
  AUTH_SECRET: string
}

type Ctx = { request: Request; env: Env; params: Record<string, unknown> }

const json = (data: unknown, status = 200, headers: Record<string,string> = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
})

const enc = new TextEncoder()
const bytesToHex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2,'0')).join('')
const toBase64Url = (value: string) => btoa(value).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')
const fromBase64Url = (value: string) => atob(value.replaceAll('-','+').replaceAll('_','/').padEnd(Math.ceil(value.length/4)*4,'='))

async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))))
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign'])
  return toBase64Url(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value)))))
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i=0;i<a.length;i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function makeSession(email: string, secret: string) {
  const payload = toBase64Url(JSON.stringify({ email, exp: Date.now() + 1000*60*60*12 }))
  return `${payload}.${await hmac(payload, secret)}`
}

async function getSession(request: Request, env: Env) {
  const cookie = request.headers.get('cookie') || ''
  const token = cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('thelu_session='))?.slice('thelu_session='.length)
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = await hmac(payload, env.AUTH_SECRET)
  if (!safeEqual(sig, expected)) return null
  try {
    const data = JSON.parse(fromBase64Url(payload))
    if (!data?.email || !data?.exp || Date.now() > data.exp) return null
    return data as {email:string;exp:number}
  } catch { return null }
}

const sessionCookie = (token: string) => `thelu_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`
const clearSessionCookie = 'thelu_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'

function mapProduct(row: any) {
  return {
    id: row.id, name: row.name, slug: row.slug, description: row.description,
    price: row.price_cents / 100, compareAt: row.compare_at_cents == null ? undefined : row.compare_at_cents / 100,
    category: row.category, colors: JSON.parse(row.colors_json || '[]'), sizes: JSON.parse(row.sizes_json || '[]'),
    tags: JSON.parse(row.tags_json || '[]'), stock: row.stock, image: row.image_url,
    featured: !!row.featured, new: !!row.is_new, active: !!row.active,
  }
}

const slugify = (v:string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
const array = (v:unknown) => Array.isArray(v) ? v.map(String).map(x=>x.trim()).filter(Boolean).slice(0,50) : []
const text = (v:unknown,max=500) => String(v ?? '').trim().slice(0,max)
const int = (v:unknown,min=0,max=99999999) => Math.max(min,Math.min(max,Math.round(Number(v)||0)))

async function requireAdmin(request: Request, env: Env) {
  return await getSession(request, env)
}

async function login(request: Request, env: Env) {
  const body:any = await request.json().catch(()=>null)
  if (!body) return json({error:'Richiesta non valida'},400)
  const email = text(body.email,200).toLowerCase()
  const passwordHash = await sha256(String(body.password ?? ''))
  const validEmail = safeEqual(email, String(env.ADMIN_EMAIL || '').toLowerCase())
  const validPassword = safeEqual(passwordHash, String(env.ADMIN_PASSWORD_SHA256 || '').toLowerCase())
  if (!validEmail || !validPassword) return json({error:'Credenziali non valide'},401)
  const token = await makeSession(email, env.AUTH_SECRET)
  return json({ok:true,user:{email}},200,{'set-cookie':sessionCookie(token)})
}

async function listProducts(env: Env, includeInactive=false) {
  const q = includeInactive ? 'SELECT * FROM products ORDER BY created_at DESC' : 'SELECT * FROM products WHERE active=1 ORDER BY featured DESC, created_at DESC'
  const { results } = await env.DB.prepare(q).all()
  return results.map(mapProduct)
}

async function createProduct(request: Request, env: Env) {
  const b:any = await request.json().catch(()=>null)
  if (!b?.name || b.price == null || !b.category) return json({error:'Nome, prezzo e categoria sono obbligatori'},400)
  const id = crypto.randomUUID()
  const name = text(b.name,180)
  const baseSlug = slugify(text(b.slug || name,180)) || id
  const slug = `${baseSlug}-${id.slice(0,6)}`
  await env.DB.prepare(`INSERT INTO products (id,name,slug,description,price_cents,compare_at_cents,category,colors_json,sizes_json,tags_json,stock,image_url,featured,is_new,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`)
    .bind(id,name,slug,text(b.description,4000),int(Number(b.price)*100),b.compareAt==null?null:int(Number(b.compareAt)*100),text(b.category,100),JSON.stringify(array(b.colors)),JSON.stringify(array(b.sizes)),JSON.stringify(array(b.tags)),int(b.stock,0,100000),text(b.image,1500),b.featured?1:0,b.new?1:0).run()
  const row = await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first()
  return json(mapProduct(row),201)
}

async function updateProduct(request: Request, env: Env, id: string) {
  const current = await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first()
  if (!current) return json({error:'Prodotto non trovato'},404)
  const b:any = await request.json().catch(()=>({}))
  const name = b.name == null ? current.name : text(b.name,180)
  const fields = {
    name,
    description: b.description == null ? current.description : text(b.description,4000),
    price: b.price == null ? current.price_cents : int(Number(b.price)*100),
    compareAt: b.compareAt === undefined ? current.compare_at_cents : (b.compareAt==null?null:int(Number(b.compareAt)*100)),
    category: b.category == null ? current.category : text(b.category,100),
    colors: b.colors == null ? current.colors_json : JSON.stringify(array(b.colors)),
    sizes: b.sizes == null ? current.sizes_json : JSON.stringify(array(b.sizes)),
    tags: b.tags == null ? current.tags_json : JSON.stringify(array(b.tags)),
    stock: b.stock == null ? current.stock : int(b.stock,0,100000),
    image: b.image == null ? current.image_url : text(b.image,1500),
    featured: b.featured == null ? current.featured : (b.featured?1:0),
    isNew: b.new == null ? current.is_new : (b.new?1:0),
    active: b.active == null ? current.active : (b.active?1:0),
  }
  await env.DB.prepare(`UPDATE products SET name=?,description=?,price_cents=?,compare_at_cents=?,category=?,colors_json=?,sizes_json=?,tags_json=?,stock=?,image_url=?,featured=?,is_new=?,active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(fields.name,fields.description,fields.price,fields.compareAt,fields.category,fields.colors,fields.sizes,fields.tags,fields.stock,fields.image,fields.featured,fields.isNew,fields.active,id).run()
  const row = await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first()
  return json(mapProduct(row))
}

async function placeOrder(request: Request, env: Env) {
  const b:any = await request.json().catch(()=>null)
  if (!b || !Array.isArray(b.items) || !b.items.length || !b.customer?.email || !b.customer?.name) return json({error:'Ordine non valido'},400)
  const items = b.items.slice(0,40).map((x:any)=>({id:text(x.id,80),qty:int(x.qty,1,20),size:text(x.size,30),color:text(x.color,60)}))
  const ids = [...new Set(items.map((x:any)=>x.id))]
  const placeholders = ids.map(()=>'?').join(',')
  const {results} = await env.DB.prepare(`SELECT * FROM products WHERE active=1 AND id IN (${placeholders})`).bind(...ids).all()
  if (results.length !== ids.length) return json({error:'Uno o più prodotti non sono disponibili'},409)
  const byId = new Map(results.map((r:any)=>[r.id,r]))
  let total = 0
  for (const item of items) {
    const p:any = byId.get(item.id)
    if (!p || p.stock < item.qty) return json({error:`Stock insufficiente per ${p?.name || 'un prodotto'}`},409)
    total += p.price_cents * item.qty
  }
  const id = `TH${String(Date.now()).slice(-8)}`
  const orderItems = items.map((i:any)=>{ const p:any=byId.get(i.id); return {...i,name:p.name,unitPrice:p.price_cents/100} })
  const statements:any[] = [env.DB.prepare(`INSERT INTO orders (id,customer_name,customer_email,customer_phone,total_cents,status,items_json,shipping_json,notes) VALUES (?,?,?,?,?,'Nuovo',?,?,?)`).bind(id,text(b.customer.name,160),text(b.customer.email,220).toLowerCase(),text(b.customer.phone,80),total,JSON.stringify(orderItems),JSON.stringify(b.shipping||{}),text(b.notes,1000))]
  for (const item of items) {
    statements.push(env.DB.prepare('UPDATE products SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND stock>=?').bind(item.qty,item.id,item.qty))
    statements.push(env.DB.prepare(`INSERT INTO inventory_movements (product_id,quantity_delta,reason,order_id) VALUES (?,?,'order',?)`).bind(item.id,-item.qty,id))
  }
  await env.DB.batch(statements)
  return json({ok:true,orderId:id,total:total/100},201)
}

export async function onRequest({request,env}: Ctx) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api\/?/,'').replace(/\/$/,'')
    const method = request.method.toUpperCase()

    if (path === 'auth/login' && method === 'POST') return await login(request,env)
    if (path === 'auth/logout' && method === 'POST') return json({ok:true},200,{'set-cookie':clearSessionCookie})
    if (path === 'auth/me' && method === 'GET') {
      const s = await getSession(request,env)
      return s ? json({authenticated:true,user:{email:s.email}}) : json({authenticated:false},401)
    }
    if (path === 'products' && method === 'GET') return json(await listProducts(env,false),200,{'cache-control':'public, max-age=60'})
    if (path === 'orders' && method === 'POST') return await placeOrder(request,env)

    if (path.startsWith('admin/')) {
      if (!await requireAdmin(request,env)) return json({error:'Non autorizzato'},401)
      if (path === 'admin/products' && method === 'GET') return json(await listProducts(env,true))
      if (path === 'admin/products' && method === 'POST') return await createProduct(request,env)
      const productMatch = path.match(/^admin\/products\/([^/]+)$/)
      if (productMatch && method === 'PATCH') return await updateProduct(request,env,productMatch[1])
      if (productMatch && method === 'DELETE') {
        await env.DB.prepare('UPDATE products SET active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(productMatch[1]).run()
        return json({ok:true})
      }
      if (path === 'admin/orders' && method === 'GET') {
        const {results} = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 250').all()
        return json(results.map((r:any)=>({id:r.id,customer:r.customer_name,email:r.customer_email,phone:r.customer_phone,total:r.total_cents/100,status:r.status,items:JSON.parse(r.items_json||'[]'),shipping:JSON.parse(r.shipping_json||'{}'),notes:r.notes,createdAt:r.created_at})))
      }
      const orderMatch = path.match(/^admin\/orders\/([^/]+)$/)
      if (orderMatch && method === 'PATCH') {
        const b:any = await request.json().catch(()=>({}))
        const allowed=['Nuovo','In preparazione','Spedito','Completato','Annullato']
        if (!allowed.includes(b.status)) return json({error:'Stato non valido'},400)
        await env.DB.prepare('UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.status,orderMatch[1]).run()
        return json({ok:true})
      }
    }
    return json({error:'Endpoint non trovato'},404)
  } catch (error:any) {
    console.error(error)
    return json({error:'Errore interno'},500)
  }
}
