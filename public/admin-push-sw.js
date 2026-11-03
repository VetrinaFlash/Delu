self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json() || {} } catch {}
  event.waitUntil(self.registration.showNotification(payload.title || 'DeLù · aggiornamento ordini', {
    body: payload.body || 'Apri il pannello per controllare gli ordini.',
    icon: '/admin-icon-192.png',
    tag: payload.tag || 'delu-order-update',
    data: { path: '/admin' }
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true})
    const existing = windows.find(client => new URL(client.url).pathname === '/admin')
    if (existing) await existing.focus()
    else await self.clients.openWindow('/admin')
  })())
})
