import { useMemo, useState } from 'react'
import { ImagePlus, Save, Sparkles, X } from 'lucide-react'
import { motion } from 'motion/react'
import type { Product, ProductVariant } from '../data'
import { api, split } from './shared'

type FormState={name:string;price:string;compareAt:string;category:string;fabrics:string;colors:string;sizes:string;tags:string;description:string;featured:boolean;isNew:boolean;active:boolean}

export default function ProductEditor({product,onClose,onSaved}:{product?:Product;onClose:()=>void;onSaved:(p:Product)=>void}){
  const[f,setF]=useState<FormState>(()=>({name:product?.name||'',price:product?String(product.price):'',compareAt:product?.compareAt?String(product.compareAt):'',category:product?.category||'',fabrics:(product?.fabrics||[]).join(', '),colors:(product?.colors||[]).join(', '),sizes:(product?.sizes||[]).join(', '),tags:(product?.tags||[]).join(', '),description:product?.description||'',featured:!!product?.featured,isNew:!!product?.new,active:product?.active!==false}))
  const[images,setImages]=useState<string[]>(product?.images?.length?product.images:(product?.image?[product.image]:[]))
  const[variantStocks,setVariantStocks]=useState<Record<string,string>>(()=>Object.fromEntries((product?.variants||[]).map(v=>[`${v.color}|${v.size}`,String(v.stock)])))
  const[loading,setLoading]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[manualImage,setManualImage]=useState('')
  const colors=split(f.colors),sizes=split(f.sizes)
  const combos=useMemo(()=>colors.flatMap(color=>sizes.map(size=>({color,size,key:`${color}|${size}`}))),[f.colors,f.sizes])
  const textField=(k:'name'|'price'|'compareAt'|'category'|'fabrics'|'colors'|'sizes'|'tags'|'description')=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setF(v=>({...v,[k]:e.target.value}))

  async function upload(files:FileList|null){
    if(!files?.length)return
    setUploading(true);setError('')
    try{
      const added:string[]=[]
      for(const file of Array.from(files).slice(0,8)){
        const fd=new FormData();fd.append('file',file)
        const r=await api<{url:string}>('/api/admin/upload',{method:'POST',body:fd})
        added.push(r.url)
      }
      setImages(v=>[...v,...added].slice(0,12))
    }catch(e:any){setError(e.message)}finally{setUploading(false)}
  }
  function addManual(){const v=manualImage.trim();if(v){setImages(x=>[...x,v].slice(0,12));setManualImage('')}}
  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError('')
    try{
      const variants:ProductVariant[]=combos.map(c=>({color:c.color,size:c.size,stock:Math.max(0,Number(variantStocks[c.key]||0)||0),sku:''}))
      const payload={name:f.name,price:Number(f.price),compareAt:f.compareAt?Number(f.compareAt):null,category:f.category,fabrics:split(f.fabrics),colors,sizes,tags:split(f.tags),description:f.description,featured:f.featured,new:f.isNew,active:f.active,images,variants,stock:variants.reduce((s,v)=>s+v.stock,0)}
      const p=await api<Product>(product?`/api/admin/products/${product.id}`:'/api/admin/products',{method:product?'PATCH':'POST',body:JSON.stringify(payload)})
      onSaved(p)
    }catch(e:any){setError(e.message)}finally{setLoading(false)}
  }

  return <>
    <motion.div className="drawer-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
    <motion.form className="product-form product-form-wide" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} onSubmit={submit}>
      <div className="drawer-head"><div><span>CATALOGO DELÙ</span><b>{product?'Modifica prodotto':'Nuovo prodotto'}</b></div><button type="button" className="icon-btn" onClick={onClose}><X/></button></div>
      <div className="form-scroll">
        <div className="editor-section"><h4>Informazioni</h4>
          <label>Nome prodotto<input required value={f.name} onChange={textField('name')}/></label>
          <div className="form-grid"><label>Prezzo €<input required type="number" min="0" step="0.01" value={f.price} onChange={textField('price')}/></label><label>Prezzo precedente €<input type="number" min="0" step="0.01" value={f.compareAt} onChange={textField('compareAt')}/></label></div>
          <label>Categoria<input required value={f.category} onChange={textField('category')}/></label>
          <label>Tessuti <small>separati da virgola, usati anche come filtri dello shop</small><input value={f.fabrics} onChange={textField('fabrics')} placeholder="Cotone, Lino, Viscosa" maxLength={800}/></label>
          <label>Descrizione<textarea value={f.description} onChange={textField('description')} rows={5}/></label>
          <label>Tag / filtri <small>separati da virgola</small><input value={f.tags} onChange={textField('tags')} placeholder="new, elegante, sera, edit"/></label>
          <div className="admin-checks"><label><input type="checkbox" checked={f.featured} onChange={e=>setF(v=>({...v,featured:e.target.checked}))}/> In evidenza</label><label><input type="checkbox" checked={f.isNew} onChange={e=>setF(v=>({...v,isNew:e.target.checked}))}/> Novità</label><label><input type="checkbox" checked={f.active} onChange={e=>setF(v=>({...v,active:e.target.checked}))}/> Visibile nello shop</label></div>
        </div>
        <div className="editor-section"><h4>Foto prodotto</h4>
          <label className="image-upload"><ImagePlus/>{uploading?'CARICAMENTO…':'CARICA FOTO'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={e=>upload(e.target.files)}/></label>
          <div className="manual-image"><input value={manualImage} onChange={e=>setManualImage(e.target.value)} placeholder="Oppure incolla URL immagine"/><button type="button" onClick={addManual}>Aggiungi</button></div>
          {images.length>0&&<div className="image-strip">{images.map((src,i)=><div key={`${src}-${i}`}><img src={src} alt=""/>{i===0&&<span>COPERTINA</span>}<button type="button" onClick={()=>setImages(v=>v.filter((_,n)=>n!==i))}><X/></button></div>)}</div>}
          <small className="editor-help">La prima immagine viene usata come copertina. JPG, PNG, WEBP o AVIF, massimo 8 MB per file.</small>
        </div>
        <div className="editor-section"><h4>Varianti e magazzino</h4>
          <div className="form-grid"><label>Colori <small>separati da virgola</small><input value={f.colors} onChange={textField('colors')} placeholder="Rosa, Nero, Bianco"/></label><label>Taglie <small>separate da virgola</small><input value={f.sizes} onChange={textField('sizes')} placeholder="XS, S, M, L"/></label></div>
          {combos.length?<div className="variant-grid"><div className="variant-head"><span>COLORE</span><span>TAGLIA</span><span>Q.TÀ</span></div>{combos.map(c=><div className="variant-line" key={c.key}><b>{c.color}</b><span>{c.size}</span><input type="number" min="0" value={variantStocks[c.key]??'0'} onChange={e=>setVariantStocks(v=>({...v,[c.key]:e.target.value}))}/></div>)}<div className="variant-total"><span>Stock totale</span><b>{combos.reduce((s,c)=>s+(Number(variantStocks[c.key]||0)||0),0)} pezzi</b></div></div>:<div className="form-tip"><Sparkles/><span>Inserisci colori e taglie: il pannello creerà automaticamente le combinazioni e potrai impostare la disponibilità di ciascuna.</span></div>}
        </div>
        {error&&<div className="form-error">{error}</div>}
      </div>
      <button className="save-product" disabled={loading||uploading}><Save/>{loading?'SALVATAGGIO…':product?'SALVA MODIFICHE':'CREA PRODOTTO'}</button>
    </motion.form>
  </>
}
