// Service worker for the installable web app (registered in app/plugins/sw.client.ts, production only).
//  - Build assets (/_nuxt/*, hashed file names) are served from cache: instant repeat visits.
//  - Menu photos are served from cache and refreshed in the background.
//  - Pages always come from the network (they carry live prices, stock and account data);
//    without a connection the offline page is shown instead of the browser error.
//  - API and admin requests are never touched.
//  - Push messages about an order open its tracking page.

const VERSION = 'v1'
const STATIC_CACHE = `checoc-static-${VERSION}`
const IMAGE_CACHE = `checoc-images-${VERSION}`
const OFFLINE_URL = '/offline.html'
const MAX_IMAGES = 80

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('checoc-') && ![STATIC_CACHE, IMAGE_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }
  if (url.pathname.startsWith('/_nuxt/')) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone())
        trimImages(cache)
      }
      return response
    })
    .catch(() => cached)
  return cached || refresh
}

async function trimImages(cache) {
  const keys = await cache.keys()
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) await cache.delete(key)
}

// Payload sent by server/utils/push.ts: { title, body, url, tag }
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Chè Cốc', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      // One notification per order: a newer status replaces the older one
      tag: data.tag,
      renotify: !!data.tag,
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url === target)
      if (open) return open.focus()
      return self.clients.openWindow(target)
    }),
  )
})
