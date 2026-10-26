import { join } from 'node:path'

// Uploaded images live outside the build output so they survive redeploys.
// In Docker, mount a volume on /app/.data in production.
export const UPLOAD_DIR = join(process.cwd(), '.data', 'uploads')

export const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
}
