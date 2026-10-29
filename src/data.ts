export type Product = {
  id: string
  name: string
  price: number
  compareAt?: number
  category: string
  colors: string[]
  sizes: string[]
  tags: string[]
  stock: number
  featured?: boolean
  new?: boolean
  image: string
  imageAlt?: string
}

export type Order = {
  id: string
  customer: string
  email: string
  total: number
  status: 'Nuovo' | 'In preparazione' | 'Spedito' | 'Completato'
  createdAt: string
  items: number
}

export const products: Product[] = [
  {
    id: 'thelu-01',
    name: 'Blazer Rose Atelier',
    price: 89,
    compareAt: 109,
    category: 'Blazer',
    colors: ['Rosa', 'Nero'],
    sizes: ['XS', 'S', 'M', 'L'],
    tags: ['elegante', 'office', 'new'],
    stock: 18,
    featured: true,
    new: true,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'thelu-02',
    name: 'Dress Nuit',
    price: 74,
    category: 'Abiti',
    colors: ['Nero'],
    sizes: ['XS', 'S', 'M'],
    tags: ['sera', 'minimal', 'best-seller'],
    stock: 9,
    featured: true,
    image: 'https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'thelu-03',
    name: 'Top Lumière',
    price: 39,
    category: 'Top',
    colors: ['Bianco', 'Rosa'],
    sizes: ['S', 'M', 'L'],
    tags: ['daily', 'soft', 'new'],
    stock: 24,
    new: true,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'thelu-04',
    name: 'Denim Élan',
    price: 69,
    category: 'Jeans',
    colors: ['Denim', 'Nero'],
    sizes: ['36', '38', '40', '42', '44'],
    tags: ['denim', 'street', 'everyday'],
    stock: 31,
    featured: true,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'thelu-05',
    name: 'Co-ord Amour',
    price: 95,
    category: 'Completi',
    colors: ['Rosa', 'Bianco'],
    sizes: ['S', 'M', 'L'],
    tags: ['matching', 'occasion', 'limited'],
    stock: 7,
    new: true,
    image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'thelu-06',
    name: 'Mini Bag Icon',
    price: 49,
    category: 'Accessori',
    colors: ['Nero', 'Rosa'],
    sizes: ['Unica'],
    tags: ['accessori', 'icon', 'gift'],
    stock: 14,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
  },
]

export const orders: Order[] = [
  { id: '#TH1048', customer: 'Giulia R.', email: 'giulia@example.com', total: 148, status: 'Nuovo', createdAt: 'Oggi, 11:42', items: 2 },
  { id: '#TH1047', customer: 'Elena M.', email: 'elena@example.com', total: 89, status: 'In preparazione', createdAt: 'Oggi, 09:18', items: 1 },
  { id: '#TH1046', customer: 'Martina C.', email: 'martina@example.com', total: 193, status: 'Spedito', createdAt: 'Ieri, 17:05', items: 3 },
  { id: '#TH1045', customer: 'Sara P.', email: 'sara@example.com', total: 74, status: 'Completato', createdAt: 'Ieri, 13:20', items: 1 },
]
