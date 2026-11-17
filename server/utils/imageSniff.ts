// Identify an image from its first bytes. Pure, unit-tested.
// The browser's declared type is whatever the client says; the bytes are what gets served.
export function sniffImageType(data: Uint8Array): 'jpg' | 'png' | 'webp' | 'avif' | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...data.subarray(from, to))
  if (data.length < 12) return null
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpg'
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => data[i] === b)) return 'png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  // ISO-BMFF: [size]['ftyp'][major brand][minor version][compatible brands...]
  if (ascii(4, 8) === 'ftyp') {
    const size = Math.min(((data[0]! << 24) | (data[1]! << 16) | (data[2]! << 8) | data[3]!) >>> 0, data.length, 64)
    const brands = [ascii(8, 12)]
    for (let i = 16; i + 4 <= size; i += 4) brands.push(ascii(i, i + 4))
    if (brands.some((b) => b === 'avif' || b === 'avis')) return 'avif'
  }
  return null
}
