import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const MAX_BYTES = 5 * 1024 * 1024

// Accepts one image (multipart field "file") and returns its public URL
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Missing file' })

  const ext = Object.entries(IMAGE_TYPES).find(([, type]) => type === file.type)?.[0]
  if (!ext) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported', message: 'Chỉ nhận ảnh JPG, PNG, WEBP, AVIF' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Too large', message: 'Ảnh tối đa 5MB' })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  const name = `${randomUUID()}.${ext}`
  await writeFile(join(UPLOAD_DIR, name), file.data)
  return { url: `/uploads/${name}` }
})
