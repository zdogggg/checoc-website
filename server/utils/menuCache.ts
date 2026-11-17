import type { H3Event } from 'h3'

// The public menu (products, categories, options) is read on every page view but changes only
// when staff edit it. It is kept for a minute, and any successful write in the admin area
// (catalog edits, stock movements that switch dishes on or off, orders completed) drops it at
// once (before answering), so the shop never shows an edit late (server/plugins/menuCache.ts). Orders are always
// priced and checked against the database, never against this copy.
const GROUP = 'menu'

// The key never comes from the query string: Nitro's default key includes it, so
// /api/products?r=1, ?r=2... would each keep their own copy in memory until the next admin
// write (thousands of requests were enough to exhaust the server's memory). One entry per
// endpoint, or per product for the detail page, and only for products that exist (errors are
// never cached), so the cache stays as small as the menu.
export function menuCacheOptions(name: string, getKey: (event: H3Event) => string = () => 'all') {
  return {
    group: GROUP,
    name,
    maxAge: 60,
    swr: false,
    getKey: (event: H3Event) => getKey(event).slice(0, 100),
  }
}

// Entries are stored as "/cache:<group>:<name>:<key>.json" (nitropack runtime/internal/cache)
export async function clearMenuCache() {
  const storage = useStorage('cache')
  const keys = await storage.getKeys(GROUP)
  await Promise.all(keys.map((key) => storage.removeItem(key)))
}
