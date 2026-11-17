// Drop the cached public menu on every write in the admin area (server/utils/menuCache.ts).
// Done before the response leaves, so the page that made the change reloads fresh data; a write
// that failed clears it too, which costs one database read and nothing else.
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', async (event) => {
    if (!WRITE_METHODS.has(event.method) || !event.path.startsWith('/api/admin/')) return
    await clearMenuCache().catch((error) => console.warn('[menu-cache] clear failed', (error as Error).message))
  })
})
