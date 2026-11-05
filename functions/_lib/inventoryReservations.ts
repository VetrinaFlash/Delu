/**
 * Inventory reservations for Nexi Hosted Payment Page.
 * D1 batch is transactional: a failed quantity guard rolls the whole reservation back.
 * A held unit is removed from public stock immediately, then converted to a sale on payment.
 */
export type StockLine={productId:string;variantId:number|null;qty:number;color:string;size:string}
type Env={DB:any;NEXI_XPAY_API_KEY?:string;NEXI_XPAY_BASE_URL?:string}
export const HOLD_MS=45*60*1000 // Nexi HPP URLs expire after 15 minutes; leave a margin for 3DS/callbacks.

export async function inventoryTables(env:Env){
 await env.DB.batch([
  env.DB.prepare("CREATE TABLE IF NOT EXISTS stock_reservations(order_id TEXT PRIMARY KEY,state TEXT NOT NULL DEFAULT 'HELD',expires_at INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS stock_reservation_items(order_id TEXT NOT NULL,product_id TEXT NOT NULL,variant_id INTEGER,qty INTEGER NOT NULL CHECK(qty>0),color TEXT NOT NULL DEFAULT '',size TEXT NOT NULL DEFAULT '',PRIMARY KEY(order_id,product_id,color,size),FOREIGN KEY(order_id) REFERENCES stock_reservations(order_id) ON DELETE CASCADE)")
 ])
}
export async function reserveInventory(env:Env,orderId:string,lines:StockLine[],inserts:any[]){
 await inventoryTables(env)
 const writes=[...inserts,env.DB.prepare("INSERT INTO stock_reservations(order_id,state,expires_at) VALUES(?,'HELD',?)").bind(orderId,Date.now()+HOLD_MS)]
 const variantProducts=new Set<string>()
 for(const line of lines){
  if(line.variantId!=null){
   variantProducts.add(line.productId)
   writes.push(env.DB.prepare("UPDATE product_variants SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND product_id=? AND stock>=?").bind(line.qty,line.variantId,line.productId,line.qty))
  }else{
   writes.push(env.DB.prepare("UPDATE products SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND stock>=?").bind(line.qty,line.productId,line.qty))
  }
  // This NOT NULL check detects zero-row guarded UPDATE and aborts/rolls back the whole D1 batch.
  writes.push(env.DB.prepare("INSERT INTO stock_reservation_items(order_id,product_id,variant_id,qty,color,size) VALUES(?,?,?,CASE WHEN changes()=1 THEN ? ELSE NULL END,?,?)")
   .bind(orderId,line.productId,line.variantId,line.qty,line.color,line.size))
 }
 for(const id of variantProducts)writes.push(env.DB.prepare("UPDATE products SET stock=(SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id=?),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id,id))
 await env.DB.batch(writes)
}
export async function reservationState(env:Env,orderId:string):Promise<string|null>{
 await inventoryTables(env)
 const row=await env.DB.prepare('SELECT state FROM stock_reservations WHERE order_id=?').bind(orderId).first()
 return row?.state||null
}
export async function releaseInventory(env:Env,orderId:string,reason:string){
 await inventoryTables(env)
 const {results}=await env.DB.prepare('SELECT product_id,variant_id,qty FROM stock_reservation_items WHERE order_id=?').bind(orderId).all()
 if(!results.length)return false
 const writes:any[]=[
  env.DB.prepare("UPDATE stock_reservations SET state='RELEASING',updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND state='HELD' AND EXISTS(SELECT 1 FROM payments WHERE order_id=? AND status NOT IN ('PAID','PAID_STOCK_REVIEW','PROCESSING'))").bind(orderId,orderId),
 ]
 const variants=new Set<string>()
 const guard="EXISTS(SELECT 1 FROM stock_reservations WHERE order_id=? AND state='RELEASING')"
 for(const line of results){
  if(line.variant_id!=null){
   variants.add(line.product_id)
   writes.push(env.DB.prepare("UPDATE product_variants SET stock=stock+?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND "+guard).bind(line.qty,line.variant_id,orderId))
  }else writes.push(env.DB.prepare("UPDATE products SET stock=stock+?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND "+guard).bind(line.qty,line.product_id,orderId))
 }
 for(const id of variants)writes.push(env.DB.prepare("UPDATE products SET stock=(SELECT COALESCE(SUM(stock),0) FROM product_variants WHERE product_id=?),updated_at=CURRENT_TIMESTAMP WHERE id=? AND "+guard).bind(id,id,orderId))
 writes.push(env.DB.prepare("UPDATE stock_reservations SET state='RELEASED',updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND state='RELEASING'").bind(orderId))
 // Do not overwrite a newer, verified PAID outcome.
 writes.push(env.DB.prepare("UPDATE payments SET status=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND status NOT IN ('PAID','PAID_STOCK_REVIEW','PROCESSING')").bind(reason,orderId))
 await env.DB.batch(writes)
 return (await reservationState(env,orderId))==='RELEASED'
}
export async function completeReservedOrder(env:Env,orderId:string,items:any[],operation:any){
 await inventoryTables(env)
 const writes:any[]=[
  env.DB.prepare("UPDATE stock_reservations SET state='PAID',updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND state='HELD'").bind(orderId),
 ]
 for(const item of items)writes.push(env.DB.prepare("INSERT INTO inventory_movements(product_id,quantity_delta,reason,order_id) VALUES (?,?,'paid_order',?)").bind(item.id,-item.qty,orderId))
 writes.push(env.DB.prepare("UPDATE payments SET status='PAID',operation_id=?,operation_result='EXECUTED',updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND status='PROCESSING'")
  .bind(String(operation?.operationId||'').slice(0,120),orderId))
 writes.push(env.DB.prepare("UPDATE orders SET status='Pagato - da preparare',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(orderId))
 await env.DB.batch(writes)
}
/**
 * Lazy reclamation; GET products and checkout trigger it without a separate cron service.
 * Confirm Nexi first, and never release a hold when Nexi cannot be reached.
 */
export async function reclaimExpiredInventory(env:Env,finalize:(orderId:string,operation:any)=>Promise<boolean>,max=3){
 if(!env.NEXI_XPAY_API_KEY)return
 await inventoryTables(env)
 const {results}=await env.DB.prepare("SELECT order_id FROM stock_reservations WHERE state='HELD' AND expires_at<? ORDER BY expires_at LIMIT ?").bind(Date.now(),max).all()
 const base=(String(env.NEXI_XPAY_BASE_URL||'https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp')).replace(/\/$/,'')
 for(const item of results){
  try{
   const response=await fetch(base+'/api/v1/orders/'+encodeURIComponent(item.order_id),{headers:{'X-API-KEY':env.NEXI_XPAY_API_KEY,'Correlation-Id':crypto.randomUUID()}})
   if(response.status===404){await releaseInventory(env,item.order_id,'EXPIRED');await env.DB.prepare("UPDATE orders SET status='Pagamento scaduto',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='Pagamento in attesa'").bind(item.order_id).run();continue}
   if(!response.ok)continue
   const payload:any=await response.json()
   const ops=payload?.operations||payload?.orderStatus?.operations||[]
   const all=Array.isArray(ops)?ops:[]
   const executed=[...all].reverse().find((x:any)=>x?.operationResult==='EXECUTED')
   if(executed){const payment=await env.DB.prepare('SELECT amount_cents FROM payments WHERE order_id=?').bind(item.order_id).first();if(Number(executed.operationAmount)===Number(payment?.amount_cents)&&String(executed.operationCurrency||'').toUpperCase()==='EUR')await finalize(item.order_id,executed);else console.error('Nexi amount mismatch on expired reservation',item.order_id);continue}
   // The 15-minute HPP window is well beyond expiry; no successful charge was reported.
   await releaseInventory(env,item.order_id,'EXPIRED')
   await env.DB.prepare("UPDATE orders SET status='Pagamento scaduto',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='Pagamento in attesa'").bind(item.order_id).run()
  }catch(error){console.error('Nexi reservation reconciliation deferred',error)}
 }
}
