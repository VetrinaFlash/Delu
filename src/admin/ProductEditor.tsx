import AttributeEditor from './AttributeEditor'
import {categoryList,family,type ProductAttributes,validateAttributes} from '../../shared/catalog'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Save, Sparkles, X } from 'lucide-react'
import { motion } from 'motion/react'
import type { Product, ProductVariant, ProductColorImage } from '../data'
import { api, split } from './shared'
import {colorKey} from '../productColorGallery'

type FormState={name:string;price:string;compareAt:string;category:string;fabrics:string;colors:string;sizes:string;tags:string;description:string;featured:boolean;isNew:boolean;active:boolean}

const fabricSuggestions: Record<string, string[]> = {
  dresses: ['Raso', 'Viscosa', 'Jersey', 'Pizzo', 'Tulle', 'Lino'],
  trousers: ['Denim', 'Twill', 'Cotone', 'Lino', 'Viscosa'],
  outer: ['Lana', 'Misto lana', 'Twill', 'Pelle', 'Ecopelle'],
  jewelry: ['Acciaio inox', 'Argento 925', 'Ottone', 'Perle', 'Cristallo'],
  clothing: ['Cotone', 'Jersey', 'Maglia', 'Viscosa', 'Lino'],
}

export default function ProductEditor({product,onClose,onSaved}:{product?:Product;onClose:()=>void;onSaved:(p:Product)=>void}){
  const[f,setF]=useState<FormState>(()=>({name:product?.name||'',price:product?String(product.price):'',compareAt:product?.compareAt?String(product.compareAt):'',category:product?.category||'',fabrics:(product?.fabrics||[]).join(', '),colors:(product?.colors||[]).join(', '),sizes:(product?.sizes||[]).join(', '),tags:(product?.tags||[]).join(', '),description:product?.description||'',featured:!!product?.featured,isNew:!!product?.new,active:product?.active!==false}))
  const[attributes,setAttributes]=useState<ProductAttributes>(product?.attributes||{values:{},compositions:{}})
  const[images,setImages]=useState<string[]>(product?.images?.length?product.images:(product?.colorImages?.length?[]:product?.image?[product.image]:[]))
  const[colorImages,setColorImages]=useState<ProductColorImage[]>(product?.colorImages||[])
  const[colorImageUrls,setColorImageUrls]=useState<Record<string,string>>({})
  const[variantStocks,setVariantStocks]=useState<Record<string,string>>(()=>Object.fromEntries((product?.variants||[]).map(v=>[`${v.color}|${v.size}`,String(v.stock)])))
  const[variantSkus,setVariantSkus]=useState<Record<string,string>>(()=>Object.fromEntries((product?.variants||[]).map(v=>[`${v.color}|${v.size}`,v.sku||''])))
  const[loading,setLoading]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[manualImage,setManualImage]=useState('')
  const colors=split(f.colors),sizes=split(f.sizes)
  const combos=useMemo(()=>colors.flatMap(color=>sizes.map(size=>({color,size,key:`${color}|${size}`}))),[f.colors,f.sizes])
  const suggestions = (field: 'fabrics' | 'colors', options: string[], label: string) => {
    const selected = new Set(split(f[field]).map(value => value.toLowerCase()))
    return <div className="attribute-options" role="group" aria-label={label}>
      {options.map(option => <button type="button" key={option}
        disabled={selected.has(option.toLowerCase())}
        onClick={() => setF(current => {
          const values = split(current[field])
          if (values.some(value => value.toLowerCase() === option.toLowerCase())) return current
          const next = [...values, option].join(', ')
          return field === 'fabrics' && next.length > 800 ? current : {...current, [field]: next}
        })}>{selected.has(option.toLowerCase()) ? '✓' : '+'} {option}</button>)}
    </div>
  }
  const textField=(k:'name'|'price'|'compareAt'|'category'|'fabrics'|'colors'|'sizes'|'tags'|'description')=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setF(v=>({...v,[k]:e.target.value}))

  async function upload(files:FileList|null,color?:string){
    if(!files?.length)return
    setUploading(true);setError('')
    try{
      const added:string[]=[]
      const existing=color?colorImages.filter(image=>image.color===color).length:images.length
       for(const file of Array.from(files).slice(0,Math.min(8,12-existing))){
        const fd=new FormData();fd.append('file',file)
        const r=await api<{url:string}>('/api/admin/upload',{method:'POST',body:fd})
        added.push(r.url)
      }
      if(color)setColorImages(current=>[...current,...added.map(url=>({url,color}))]);else setImages(v=>[...v,...added].slice(0,12))
    }catch(e:any){setError(e.message)}finally{setUploading(false)}
  }
  function addManual(){const v=manualImage.trim();if(v){setImages(x=>[...x,v].slice(0,12));setManualImage('')}}
  function addColorUrl(color:string){const url=(colorImageUrls[color]||'').trim();if(!url)return;setColorImages(current=>current.filter(x=>x.color===color).length>=12?current:[...current,{color,url}]);setColorImageUrls(current=>({...current,[color]:''}))}
  function moveColorImage(color:string,index:number,direction:-1|1){setColorImages(current=>{const matches=current.filter(image=>image.color===color),target=index+direction;if(target<0||target>=matches.length)return current;[matches[index],matches[target]]=[matches[target],matches[index]];let i=0;return current.map(image=>image.color===color?matches[i++]:image)})}
  function moveImage(index:number,direction:-1|1){setImages(current=>{const target=index+direction;if(target<0||target>=current.length)return current;const result=[...current];[result[index],result[target]]=[result[target],result[index]];return result})}
  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError('')
    try{
      const variants:ProductVariant[]=combos.map(c=>({color:c.color,size:c.size,stock:Math.max(0,Number(variantStocks[c.key]||0)||0),sku:(variantSkus[c.key]||'').trim()}))
      validateAttributes(attributes)
      const payload={colorImages:colorImages.flatMap(image=>{const match=colors.find(c=>colorKey(c)===colorKey(image.color));return match?[{...image,color:match}]:[]}),attributes,name:f.name,price:Number(f.price),compareAt:f.compareAt?Number(f.compareAt):null,category:f.category,fabrics:split(f.fabrics),colors,sizes,tags:split(f.tags),description:f.description,featured:f.featured,new:f.isNew,active:f.active,images,variants,stock:variants.reduce((s,v)=>s+v.stock,0)}
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
          <label>Categoria<input required list="product-categories" value={f.category} onChange={textField('category')}/><datalist id="product-categories">{categoryList.map(c=><option key={c} value={c}/>)}</datalist></label>
          <label>Tessuti <small>separati da virgola, usati anche come filtri dello shop</small><input value={f.fabrics} onChange={textField('fabrics')} placeholder="Cotone, Lino, Viscosa" maxLength={800}/></label>
          {f.category.trim() && suggestions('fabrics', fabricSuggestions[family(f.category)], 'Materiali suggeriti per la categoria')}
          <label>Descrizione<textarea value={f.description} onChange={textField('description')} rows={5}/></label>
          <label>Tag / filtri <small>separati da virgola</small><input value={f.tags} onChange={textField('tags')} placeholder="new, elegante, sera, edit"/></label>
          <div className="admin-checks"><label><input type="checkbox" checked={f.featured} onChange={e=>setF(v=>({...v,featured:e.target.checked}))}/> In evidenza</label><label><input type="checkbox" checked={f.isNew} onChange={e=>setF(v=>({...v,isNew:e.target.checked}))}/> Novità</label><label><input type="checkbox" checked={f.active} onChange={e=>setF(v=>({...v,active:e.target.checked}))}/> Visibile nello shop</label></div>
        </div>
        <AttributeEditor materials={split(f.fabrics)} category={f.category} value={attributes} onChange={setAttributes}/>
        <div className="editor-section"><h4>Foto prodotto</h4>
          <label className="image-upload"><ImagePlus/>{uploading?'CARICAMENTO…':'CARICA FOTO'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={e=>upload(e.target.files)}/></label>
          <div className="manual-image"><input value={manualImage} onChange={e=>setManualImage(e.target.value)} placeholder="Oppure incolla URL immagine"/><button type="button" onClick={addManual}>Aggiungi</button></div>
          {images.length>0&&<div className="image-strip">{images.map((src,i)=><div key={`${src}-${i}`}><img src={src} alt=""/>{i===0&&<span>COPERTINA</span>}<div className="image-controls"><button type="button" title="Sposta foto a sinistra" aria-label="Sposta foto a sinistra" disabled={i===0} onClick={()=>moveImage(i,-1)}><ChevronLeft/></button><button type="button" title="Sposta foto a destra" aria-label="Sposta foto a destra" disabled={i===images.length-1} onClick={()=>moveImage(i,1)}><ChevronRight/></button><button type="button" title="Rimuovi foto" aria-label="Rimuovi foto" onClick={()=>setImages(v=>v.filter((_,n)=>n!==i))}><X/></button></div></div>)}</div>}
          <small className="editor-help">La prima immagine viene usata come copertina. JPG, PNG, WEBP o AVIF, massimo 8 MB per file.</small>
        </div>
        <div className="editor-section"><h4>Varianti e magazzino</h4>
          <div className="form-grid"><label>Colori <small>separati da virgola</small><input value={f.colors} onChange={textField('colors')} placeholder="Rosa, Nero, Bianco"/></label><label>Taglie <small>separate da virgola</small><input value={f.sizes} onChange={textField('sizes')} placeholder="XS, S, M, L"/></label></div>
          {f.category.trim() && suggestions('colors', family(f.category) === 'jewelry'
            ? ['Oro', 'Argento', 'Oro rosa', 'Nero']
            : ['Rosso', 'Nero', 'Marrone', 'Bianco', 'Cammello', 'Beige', 'Blu', 'Rosa'], 'Colori suggeriti')}
          {/pellicc/i.test(f.name+' '+f.category)&&<div className="color-media-presets">
            <button type="button" onClick={()=>setF(current=>{const existing=split(current.colors);const colors=['Rosso','Nero','Marrone','Bianco','Cammello'].map(label=>existing.find(value=>colorKey(value)===colorKey(label))||label);return {...current,colors:colors.join(', '),sizes:current.sizes.trim()||'Unica'}})}>Configura i 5 colori della pelliccia</button>
            <small>Se avevi creato due pellicce separate, modifica quella principale, assegna le foto e le quantità a ciascun colore, poi nascondi il duplicato dopo aver verificato le scorte. Gli ordini precedenti non vengono alterati.</small>
          </div>}
          {combos.length?<div className="variant-grid"><div className="variant-head"><span>COLORE</span><span>TAGLIA</span><span>Q.TÀ</span><span>SKU</span></div>{combos.map(c=><div className="variant-line" key={c.key}><b>{c.color}</b><span>{c.size}</span><input type="number" min="0" value={variantStocks[c.key]??'0'} onChange={e=>setVariantStocks(v=>({...v,[c.key]:e.target.value}))}/><input type="text" maxLength={64} aria-label={'SKU '+c.color+' '+c.size} placeholder="SKU" value={variantSkus[c.key]??''} onChange={e=>setVariantSkus(v=>({...v,[c.key]:e.target.value}))}/></div>)}<div className="variant-total"><span>Stock totale</span><b>{combos.reduce((s,c)=>s+(Number(variantStocks[c.key]||0)||0),0)} pezzi</b></div></div>:<div className="form-tip"><Sparkles/><span>Inserisci colori e taglie: il pannello creerà automaticamente le combinazioni e potrai impostare la disponibilità di ciascuna.</span></div>}
        </div>
        {colors.length>0&&<div className="editor-section color-media-editor"><h4>Fotografie per colore</h4>
          <p className="editor-help">Un'unica scheda prodotto con fotografie distinte per colore. Il primo scatto del primo colore può essere la copertina, se non carichi foto generali.</p>
          {colors.map(color=>{const entries=colorImages.filter(image=>image.color===color);return <div className="color-media-group" key={color}>
            <div className="color-media-heading"><strong>{color}</strong><small>{entries.length}/12 foto</small></div>
            <label className="image-upload"><ImagePlus/>{uploading?'CARICAMENTO…':`CARICA FOTO ${color.toUpperCase()}`}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading||entries.length>=12} hidden onChange={e=>{void upload(e.target.files,color);e.target.value=''}}/></label>
            <div className="manual-image"><input value={colorImageUrls[color]||''} onChange={e=>setColorImageUrls(v=>({...v,[color]:e.target.value}))} aria-label={`URL foto ${color}`} placeholder={`URL foto ${color}`}/><button type="button" disabled={entries.length>=12} onClick={()=>addColorUrl(color)}>Aggiungi</button></div>
            {entries.length>0&&<div className="image-strip">{entries.map((entry,i)=><div key={entry.url+'-'+i}><img src={entry.url} alt={`Foto ${color} ${i+1}`}/>{i===0&&<span>PRIMA FOTO</span>}<div className="image-controls"><button type="button" aria-label={`Sposta foto ${color} a sinistra`} disabled={i===0} onClick={()=>moveColorImage(color,i,-1)}><ChevronLeft/></button><button type="button" aria-label={`Sposta foto ${color} a destra`} disabled={i===entries.length-1} onClick={()=>moveColorImage(color,i,1)}><ChevronRight/></button><button type="button" aria-label={`Rimuovi foto ${color}`} onClick={()=>setColorImages(v=>v.filter(image=>image!==entry))}><X/></button></div></div>)}</div>}
          </div>})}
        </div>}
        {error&&<div className="form-error">{error}</div>}
      </div>
      <button className="save-product" disabled={loading||uploading}><Save/>{loading?'SALVATAGGIO…':product?'SALVA MODIFICHE':'CREA PRODOTTO'}</button>
    </motion.form>
  </>
}

