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

export const COUNTRIES: Array<[string,string]> = [
  ['IT','Italia'],['AT','Austria'],['BE','Belgio'],['BG','Bulgaria'],['HR','Croazia'],['CY','Cipro'],['CZ','Repubblica Ceca'],['DK','Danimarca'],['EE','Estonia'],['FI','Finlandia'],['FR','Francia'],['DE','Germania'],['GR','Grecia'],['HU','Ungheria'],['IE','Irlanda'],['LV','Lettonia'],['LT','Lituania'],['LU','Lussemburgo'],['MT','Malta'],['NL','Paesi Bassi'],['PL','Polonia'],['PT','Portogallo'],['RO','Romania'],['SK','Slovacchia'],['SI','Slovenia'],['ES','Spagna'],['SE','Svezia'],
  ['CH','Svizzera'],['GB','Regno Unito'],['NO','Norvegia'],['IS','Islanda'],['AL','Albania'],['BA','Bosnia ed Erzegovina'],['ME','Montenegro'],['MK','Macedonia del Nord'],['RS','Serbia'],['TR','Turchia'],['UA','Ucraina'],
  ['US','Stati Uniti'],['CA','Canada'],['MX','Messico'],['BR','Brasile'],['AR','Argentina'],['AE','Emirati Arabi Uniti'],['SA','Arabia Saudita'],['IL','Israele'],['MA','Marocco'],['TN','Tunisia'],['ZA','Sudafrica'],['AU','Australia'],['NZ','Nuova Zelanda'],['JP','Giappone'],['KR','Corea del Sud'],['SG','Singapore'],['HK','Hong Kong'],['IN','India']
]

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
