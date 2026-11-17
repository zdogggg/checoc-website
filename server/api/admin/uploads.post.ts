import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

// What the browser may send (Caddy refuses bodies above 10 MB anyway)
const MAX_BYTES = 8 * 1024 * 1024
// Longest side of the stored image: sharp on large screens, still small on phones
const MAX_SIDE = 1600

// Accepts one image (multipart field "file") and returns its public URL
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Missing file' })

  // The file's own bytes decide its type (and the extension it is served with), not the
  // type the browser declared: an HTML or SVG file renamed .jpg is refused
  const ext = sniffImageType(file.data)
  if (!ext || !(ext in IMAGE_TYPES)) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported', message: 'Chỉ nhận ảnh JPG, PNG, WEBP, AVIF' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Too large', message: 'Ảnh tối đa 8MB' })
  }

  // Phone photos are often 4-12 MB: shrink them once here so every visitor does not download
  // the original. Turned upright from the EXIF orientation, then saved without metadata
  // (camera details and GPS position are dropped).
  let image: Buffer
  try {
    image = await sharp(file.data, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported', message: 'Không đọc được ảnh này, vui lòng thử ảnh khác' })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  const name = `${randomUUID()}.webp`
  await writeFile(join(UPLOAD_DIR, name), image)
  return { url: `/uploads/${name}` }
})
