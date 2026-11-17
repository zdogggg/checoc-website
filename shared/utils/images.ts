// Smaller copies of menu photos for the size they are shown at. Pure, unit-tested.
//
// Uploaded photos (/uploads/<name>.<ext>) have resized copies at /uploads/<name>-w<width>.webp,
// made on first request by server/routes/uploads/[name].get.ts. Unsplash links (sample menu)
// take a width parameter. Anything else (the placeholder, other hosts) is used as it is.

export const IMAGE_WIDTHS = [200, 400, 800] as const
export type ImageWidth = (typeof IMAGE_WIDTHS)[number]

const UPLOAD = /^\/uploads\/([\w-]+?)(?:-w\d+)?\.(?:jpg|png|webp|avif)$/
const UNSPLASH = /^https:\/\/images\.unsplash\.com\//

export function imageAt(url: string | null | undefined, width: ImageWidth): string {
  if (!url) return ''
  const upload = url.match(UPLOAD)
  if (upload) return `/uploads/${upload[1]}-w${width}.webp`
  if (UNSPLASH.test(url)) {
    const u = new URL(url)
    u.searchParams.set('w', String(width))
    if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format')
    return u.toString()
  }
  return url
}

// srcset for <img>, or undefined when the image has no smaller copies
export function imageSrcset(url: string | null | undefined, widths: readonly ImageWidth[] = IMAGE_WIDTHS): string | undefined {
  if (!url || (!UPLOAD.test(url) && !UNSPLASH.test(url))) return undefined
  return widths.map((w) => `${imageAt(url, w)} ${w}w`).join(', ')
}
