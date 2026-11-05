/** Preview builds use a read-only proxy for the public, production catalogue.
 * The real shop keeps calling its own D1-backed endpoint. */
export function publicCatalogEndpoint(hostname:string):string{
 const host=hostname.toLowerCase()
 return host!=='delu-49u.pages.dev'&&host.endsWith('.delu-49u.pages.dev')
  ?'/api/wardrobe-products'
  :'/api/products'
}
