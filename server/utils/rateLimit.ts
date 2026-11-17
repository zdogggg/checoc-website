import type { H3Event } from 'h3'
import { and, eq, gte, sql, sum } from 'drizzle-orm'

// Request limits kept in PostgreSQL (table rate_limits), so they hold across restarts and
// are shared when several app processes run. Fixed windows: a counter per key and window.
//
// Behind a reverse proxy, the proxy must set X-Forwarded-For (and strip any value sent by the client).

const windowStartOf = (windowMs: number, now = Date.now()) => new Date(Math.floor(now / windowMs) * windowMs)

const tooMany = (event: H3Event | null, retryAfterMs: number, message: (minutes: number) => string) => {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  if (event) setResponseHeader(event, 'Retry-After', seconds)
  return createError({ statusCode: 429, statusMessage: 'Too Many Requests', message: message(Math.ceil(seconds / 60)) })
}

// Add one hit for this key in the current window and return the window's total
async function hit(key: string, windowMs: number): Promise<{ hits: number; windowStart: Date }> {
  const { rateLimits } = schema
  const windowStart = windowStartOf(windowMs)
  const [row] = await useDb()
    .insert(rateLimits)
    .values({ key, windowStart, hits: 1 })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { hits: sql`${rateLimits.hits} + 1` } })
    .returning({ hits: rateLimits.hits })
  return { hits: row!.hits, windowStart }
}

// At most `max` calls of `name` per IP in each window of `windowMs`
export async function rateLimit(event: H3Event, name: string, max: number, windowMs: number) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const { hits, windowStart } = await hit(`${name}:${ip}`, windowMs)
  if (hits > max) {
    throw tooMany(event, windowStart.getTime() + windowMs - Date.now(), (m) => `Bạn thao tác quá nhanh, vui lòng thử lại sau ${m} phút`)
  }
}

// Failed sign-ins per account, whatever IP they come from: the IP limit alone lets someone
// with many addresses keep guessing one password. Only failures count, so the real owner
// signing in normally is never slowed down. Counted over the current and previous window,
// so failures just before a window boundary still count.
export async function assertNotLocked(key: string, max: number, windowMs: number) {
  const { rateLimits } = schema
  const current = windowStartOf(windowMs)
  const [row] = await useDb()
    .select({ hits: sum(rateLimits.hits).mapWith(Number) })
    .from(rateLimits)
    .where(and(eq(rateLimits.key, `fail:${key}`), gte(rateLimits.windowStart, new Date(current.getTime() - windowMs))))
  if ((row?.hits ?? 0) >= max) {
    throw tooMany(null, current.getTime() + windowMs - Date.now(), (m) => `Tài khoản tạm khoá do nhập sai nhiều lần. Vui lòng thử lại sau ${m} phút.`)
  }
}

// Returns the failures counted in the current window
export async function recordFailure(key: string, windowMs = 15 * 60 * 1000): Promise<number> {
  return (await hit(`fail:${key}`, windowMs)).hits
}

export async function clearFailures(key: string) {
  const { rateLimits } = schema
  await useDb().delete(rateLimits).where(eq(rateLimits.key, `fail:${key}`))
}
