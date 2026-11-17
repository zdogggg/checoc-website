import { describe, expect, it } from 'vitest'
import { sniffImageType } from '../server/utils/imageSniff'

describe('sniffImageType', () => {
  const bytes = (...parts: Array<number[] | string>) =>
    new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)).concat(Array(16).fill(0)))
  it('recognises the four accepted formats from their bytes', () => {
    expect(sniffImageType(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg')
    expect(sniffImageType(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png')
    expect(sniffImageType(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))).toBe('webp')
    expect(sniffImageType(bytes([0, 0, 0, 0x1c], 'ftypavif', [0, 0, 0, 0], 'mif1miaf'))).toBe('avif')
    expect(sniffImageType(bytes([0, 0, 0, 0x1c], 'ftypmif1', [0, 0, 0, 0], 'avifmiaf'))).toBe('avif')
  })
  it('refuses anything else, whatever its name', () => {
    expect(sniffImageType(bytes('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull()
    expect(sniffImageType(bytes('<!doctype html><script>'))).toBeNull()
    expect(sniffImageType(bytes([0, 0, 0, 0x18], 'ftypmp42'))).toBeNull()
    expect(sniffImageType(new Uint8Array([0xff, 0xd8]))).toBeNull()
  })
})
