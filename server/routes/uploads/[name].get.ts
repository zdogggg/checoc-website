import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

// Serves images uploaded through /api/admin/uploads
export default defineEventHandler(async (event) => {
  // basename() drops any path segments, so only files directly in UPLOAD_DIR are reachable
  const name = basename(getRouterParam(event, 'name') ?? '')
  const type = IMAGE_TYPES[extname(name).slice(1).toLowerCase()]
  const path = join(UPLOAD_DIR, name)
  const info = type ? await stat(path).catch(() => null) : null
  if (!type || !info?.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  setHeader(event, 'Content-Type', type)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return sendStream(event, createReadStream(path))
})
