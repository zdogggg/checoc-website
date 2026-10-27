import type { H3Event } from 'h3'

// Public origin for absolute links built on the server (sitemap, robots, notifications)
export function siteOrigin(event: H3Event): string {
  const configured = useRuntimeConfig(event).public.siteUrl
  return (configured || getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin).replace(
    /\/+$/,
    '',
  )
}

// Indexable storefront pages. Private pages (checkout, account, order tracking, admin) are excluded.
export const STATIC_PAGES = ['/', '/products', '/about', '/news', '/contact']
