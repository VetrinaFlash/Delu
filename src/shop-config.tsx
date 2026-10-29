import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ShippingZone = 'IT' | 'EU' | 'EUROPE' | 'WORLD'
export type ShopConfig = {
  currency: 'EUR'
  shipping: {
    italy: { price: number; freeFrom: number }
    eu: { price: number; freeFrom: number }
    europe: { price: number; freeFrom: number | null }
    world: { price: number; freeFrom: number | null }
  }
}

export const defaultShopConfig: ShopConfig = {
  currency: 'EUR',
  shipping: {
    italy: { price: 6.9, freeFrom: 79 },
    eu: { price: 14.9, freeFrom: 150 },
    europe: { price: 19.9, freeFrom: null },
    world: { price: 29.9, freeFrom: null },
  },
}

const EU = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'])
const EUROPE = new Set(['AL','AD','AM','AZ','BA','BY','CH','FO','GB','GE','GI','IS','LI','MC','MD','ME','MK','NO','RS','SM','TR','UA','VA'])
const COUNTRY_CODES=['IT','AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','CH','GB','NO','IS','AL','BA','ME','MK','RS','TR','UA','US','CA','MX','BR','AR','AE','SA','IL','MA','TN','ZA','AU','NZ','JP','KR','SG','HK','IN']
const LANGUAGE_TAGS:Record<string,string>={it:'it-IT',en:'en-GB',fr:'fr-FR',de:'de-DE',es:'es-ES'}
function selectedLanguage(){if(typeof window==='undefined')return'it';const saved=window.localStorage.getItem('delu_locale')||window.navigator.language.slice(0,2).toLowerCase();return LANGUAGE_TAGS[saved]?saved:'it'}
function countryName(code:string){try{return new Intl.DisplayNames([LANGUAGE_TAGS[selectedLanguage()]],{type:'region'}).of(code)||code}catch{return code}}
function countryTuple(code:string){const tuple=[code,code] as [string,string];Object.defineProperty(tuple,1,{enumerable:true,configurable:true,get:()=>countryName(code)});return tuple}
export const COUNTRIES:Array<[string,string]>=COUNTRY_CODES.map(countryTuple)

export function zoneFor(country: string): ShippingZone {
  const code = country.toUpperCase()
  if (code === 'IT') return 'IT'
  if (EU.has(code)) return 'EU'
  if (EUROPE.has(code)) return 'EUROPE'
  return 'WORLD'
}

export function shippingCost(config: ShopConfig, country: string, subtotal: number) {
  const zone = zoneFor(country)
  const row = zone === 'IT' ? config.shipping.italy : zone === 'EU' ? config.shipping.eu : zone === 'EUROPE' ? config.shipping.europe : config.shipping.world
  return row.freeFrom != null && subtotal >= row.freeFrom ? 0 : row.price
}

const ShopConfigContext = createContext<{config:ShopConfig; loading:boolean}>({config:defaultShopConfig,loading:false})

export function ShopConfigProvider({children}:{children:ReactNode}) {
  const [config,setConfig] = useState<ShopConfig>(defaultShopConfig)
  const [loading,setLoading] = useState(true)
  useEffect(()=>{
    let active = true
    fetch('/api/config',{headers:{accept:'application/json'}})
      .then(r=>r.ok?r.json():Promise.reject())
      .then(data=>{if(active&&data?.shipping)setConfig(data)})
      .catch(()=>{})
      .finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[])
  const value = useMemo(()=>({config,loading}),[config,loading])
  return <ShopConfigContext.Provider value={value}>{children}</ShopConfigContext.Provider>
}

export function useShopConfig(){return useContext(ShopConfigContext)}
