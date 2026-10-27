// Security headers on every response, and a same-origin check on state-changing API calls.

// Production only: the Vite dev server needs eval and its own websocket.
// Nuxt inlines its payload and hydration scripts, hence 'unsafe-inline' for scripts.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
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
    setResponseHeader(event, 'Content-Security-Policy', CSP)
    if (getRequestProtocol(event, { xForwardedProto: true }) === 'https') {
      setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
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
