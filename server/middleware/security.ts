// Security headers on every response, and a same-origin check on state-changing API calls.

import { randomBytes } from 'node:crypto'

// Production only: the Vite dev server needs eval and its own websocket.
// Inline scripts (Nuxt's payload and hydration scripts) run only with this request's nonce,
// added to every <script> tag by server/plugins/csp-nonce.ts; an injected script has none.
const cspFor = (nonce: string) => [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,
  // Fonts are downloaded at build time and served from the site (nuxt.config googleFonts.download)
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Menu photos may be hosted elsewhere; VietQR codes come from img.vietqr.io
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  })
  if (!import.meta.dev) {
    const nonce = randomBytes(16).toString('base64')
    event.context.cspNonce = nonce
    setResponseHeader(event, 'Content-Security-Policy', cspFor(nonce))
    if (getRequestProtocol(event, { xForwardedProto: true }) === 'https') {
      setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
  }

  // A NUL character (%00) in the path or query is never legitimate and PostgreSQL refuses it
  // in any text value: answer 400 here instead of a 500 (and an alert) from the query
  const rawUrl = event.node.req.originalUrl ?? event.node.req.url ?? event.path
  if (/%00/i.test(rawUrl) || /%00/i.test(event.path) || event.path.includes(String.fromCharCode(0))) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Đường dẫn không hợp lệ' })
  }

  // CSRF: session cookies are SameSite=Lax already; additionally refuse any browser request
  // that writes through the API from another site. Non-browser clients send neither header.
  if (SAFE_METHODS.has(event.method) || !event.path.startsWith('/api/')) return
  const origin = getRequestHeader(event, 'origin')
  const crossSite = origin
    ? safeHost(origin) !== getRequestHost(event, { xForwardedHost: true })
    : getRequestHeader(event, 'sec-fetch-site') === 'cross-site'
  if (crossSite) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Yêu cầu không hợp lệ' })
  }
})

function safeHost(url: string): string | null {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}
