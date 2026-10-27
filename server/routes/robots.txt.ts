// Generated so the sitemap line carries the real domain. Set NUXT_PUBLIC_INDEXABLE=false on
// staging / preview deployments to keep them out of search results.
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  if (!useRuntimeConfig(event).public.indexable) {
    return 'User-agent: *\nDisallow: /\n'
  }
  return [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /account',
    'Disallow: /checkout',
    'Disallow: /orders/',
    '',
    `Sitemap: ${siteOrigin(event)}/sitemap.xml`,
    '',
  ].join('\n')
})
