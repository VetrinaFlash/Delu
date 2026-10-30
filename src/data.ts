export type ProductVariant = {
  sku?: string
  color: string
  size: string
  stock: number
}

export type Product = {
  id: string
  name: string
  slug?: string
  description?: string
  price: number
  compareAt?: number
  fabrics?: string[]
  category: string
  colors: string[]
  sizes: string[]
  tags: string[]
  stock: number
  featured?: boolean
  new?: boolean
  active?: boolean
  image: string
  images?: string[]
  variants?: ProductVariant[]
  imageAlt?: string
}

export type Order = {
  id: string
  customer: string
  email: string
  total: number
  status: 'Pagamento in attesa' | 'Pagamento fallito' | 'Pagato - verifica stock' | 'Nuovo' | 'In preparazione' | 'Spedito' | 'Completato' | 'Annullato'
  createdAt: string
  items: number
}

const variants = (colors:string[], sizes:string[], stock:number):ProductVariant[] => {
  const combos = colors.length * sizes.length
  const base = Math.floor(stock / Math.max(1, combos))
  let extra = stock - base * combos
  return colors.flatMap(color=>sizes.map(size=>({color,size,stock:base+(extra-->0?1:0)})))
}

export const products: Product[] = [
  {
    id: 'delu-01', name: 'Blazer Rose Atelier', price: 89, compareAt: 109, category: 'Blazer',
    colors: ['Rosa', 'Nero'], sizes: ['XS', 'S', 'M', 'L'], tags: ['elegante', 'office', 'new', 'edit'], stock: 18,
    featured: true, new: true,
    description: 'Blazer femminile dalla linea pulita e contemporanea, selezionato da DeLù per look eleganti e versatili.',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1600&q=90'],
    variants: variants(['Rosa','Nero'],['XS','S','M','L'],18),
  },
  {
    id: 'delu-02', name: 'Dress Nuit', price: 74, category: 'Abiti', colors: ['Nero'], sizes: ['XS', 'S', 'M'],
    tags: ['sera', 'minimal', 'best-seller', 'edit'], stock: 9, featured: true,
    description: 'Abito essenziale e deciso, pensato per la sera e per tutte le occasioni in cui il look deve parlare da solo.',
    image: 'https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=1200&q=85',
    variants: variants(['Nero'],['XS','S','M'],9),
  },
  {
    id: 'delu-03', name: 'Top Lumière', price: 39, category: 'Top', colors: ['Bianco', 'Rosa'], sizes: ['S', 'M', 'L'],
    tags: ['daily', 'soft', 'new'], stock: 24, new: true,
    description: 'Top leggero e femminile da abbinare facilmente a denim, gonne e completi.',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=85',
    variants: variants(['Bianco','Rosa'],['S','M','L'],24),
  },
  {
    id: 'delu-04', name: 'Denim Élan', price: 69, category: 'Jeans', colors: ['Denim', 'Nero'], sizes: ['36', '38', '40', '42', '44'],
    tags: ['denim', 'street', 'everyday'], stock: 31, featured: true,
    description: 'Denim contemporaneo con vestibilità pensata per l’uso quotidiano e un look immediatamente riconoscibile.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=85',
    variants: variants(['Denim','Nero'],['36','38','40','42','44'],31),
  },
  {
    id: 'delu-05', name: 'Co-ord Amour', price: 95, category: 'Completi', colors: ['Rosa', 'Bianco'], sizes: ['S', 'M', 'L'],
    tags: ['matching', 'occasion', 'limited', 'edit'], stock: 7, new: true,
    description: 'Completo coordinato dal carattere romantico e moderno, in quantità limitata.',
    image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85',
    variants: variants(['Rosa','Bianco'],['S','M','L'],7),
  },
  {
    id: 'delu-06', name: 'Mini Bag Icon', price: 49, category: 'Accessori', colors: ['Nero', 'Rosa'], sizes: ['Unica'],
    tags: ['accessori', 'icon', 'gift'], stock: 14,
    description: 'Mini bag compatta e versatile, scelta per completare i look DeLù.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
    variants: variants(['Nero','Rosa'],['Unica'],14),
  },
]

export const orders: Order[] = [
  { id: '#DL1048', customer: 'Giulia R.', email: 'giulia@example.com', total: 148, status: 'Nuovo', createdAt: 'Oggi, 11:42', items: 2 },
  { id: '#DL1047', customer: 'Elena M.', email: 'elena@example.com', total: 89, status: 'In preparazione', createdAt: 'Oggi, 09:18', items: 1 },
  { id: '#DL1046', customer: 'Martina C.', email: 'martina@example.com', total: 193, status: 'Spedito', createdAt: 'Ieri, 17:05', items: 3 },
  { id: '#DL1045', customer: 'Sara P.', email: 'sara@example.com', total: 74, status: 'Completato', createdAt: 'Ieri, 13:20', items: 1 },
]
