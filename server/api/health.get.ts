import { sql } from 'drizzle-orm'

// For Docker HEALTHCHECK and uptime monitors: 200 when the app can reach the database
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    await useDb().execute(sql`select 1`)
    return { ok: true }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Service Unavailable', message: 'Database unreachable' })
  }
})
