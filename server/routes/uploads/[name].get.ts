import { createReadStream } from 'node:fs'
import { rename, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { IMAGE_WIDTHS } from '#shared/utils/images'

// Serves images uploaded through /api/admin/uploads, and their smaller copies
// "<name>-w400.webp" (see shared/utils/images.ts). A copy is made the first time it is asked
// for and kept next to the original, so photos uploaded before copies existed get them too.
// Only the listed widths of files that exist can be made: nothing a visitor sends can make
// the disk grow beyond three copies per photo.
const VARIANT = new RegExp(`^([\\w-]+)-w(${IMAGE_WIDTHS.join('|')})\\.webp$`)

const isFile = async (path: string) => (await stat(path).catch(() => null))?.isFile() ?? false

async function makeVariant(name: string): Promise<boolean> {
  const match = name.match(VARIANT)
  if (!match) return false
  const [, base, width] = match
  for (const ext of Object.keys(IMAGE_TYPES)) {
    const original = join(UPLOAD_DIR, `${base}.${ext}`)
    if (!(await isFile(original))) continue
    const data = await sharp(original, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: Number(width), withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer()
    // Written under a temporary name first: two visitors asking at once never see half a file
    const tmp = join(UPLOAD_DIR, `.${randomUUID()}.tmp`)
    await writeFile(tmp, data)
    await rename(tmp, join(UPLOAD_DIR, name))
    return true
  }
  return false
}

export default defineEventHandler(async (event) => {
  // basename() drops any path segments, so only files directly in UPLOAD_DIR are reachable
  const name = basename(getRouterParam(event, 'name') ?? '')
  const type = IMAGE_TYPES[extname(name).slice(1).toLowerCase()]
  const path = join(UPLOAD_DIR, name)
  const exists = type ? (await isFile(path)) || (await makeVariant(name).catch(() => false)) : false
  if (!type || !exists) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  setHeader(event, 'Content-Type', type)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return sendStream(event, createReadStream(path))
})
