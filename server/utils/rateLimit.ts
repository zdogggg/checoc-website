import type { H3Event } from 'h3'

// Small in-memory sliding-window limiter. Good enough for a single server process;
// move to Redis if the app ever runs on several instances.
const hits = new Map<string, number[]>()

export function rateLimit(event: H3Event, name: string, max: number, windowMs: number) {
  // Behind a reverse proxy, the proxy must set X-Forwarded-For (and strip any value sent by the client)
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const key = `${name}:${ip}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    const retryAfter = Math.ceil((windowMs - (now - recent[0]!)) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Bạn thao tác quá nhanh, vui lòng thử lại sau ${Math.ceil(retryAfter / 60)} phút`,
    })
  }
  recent.push(now)
  hits.set(key, recent)

  // Keep the map from growing forever
  if (hits.size > 10_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k)
    }
  }
}
