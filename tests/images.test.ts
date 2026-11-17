import { describe, expect, it } from 'vitest'
import { imageAt, imageSrcset } from '#shared/utils/images'

describe('imageAt', () => {
  it('points uploaded photos at their resized WebP copy', () => {
    expect(imageAt('/uploads/0b1c-22aa.webp', 400)).toBe('/uploads/0b1c-22aa-w400.webp')
    expect(imageAt('/uploads/0b1c-22aa.jpg', 200)).toBe('/uploads/0b1c-22aa-w200.webp')
    expect(imageAt('/uploads/0b1c-22aa-w800.webp', 200)).toBe('/uploads/0b1c-22aa-w200.webp')
  })

  it('sets the width of Unsplash links', () => {
    expect(imageAt('https://images.unsplash.com/photo-1?q=80&w=800&auto=format&fit=crop', 400)).toBe(
      'https://images.unsplash.com/photo-1?q=80&w=400&auto=format&fit=crop'
    )
  })

  it('leaves anything else alone', () => {
    expect(imageAt('/images/placeholder.svg', 400)).toBe('/images/placeholder.svg')
    expect(imageAt('https://example.com/a.jpg', 400)).toBe('https://example.com/a.jpg')
    expect(imageAt(null, 400)).toBe('')
    expect(imageAt('/uploads/../secret.webp', 400)).toBe('/uploads/../secret.webp')
  })
})

describe('imageSrcset', () => {
  it('lists the copies, or nothing for images that have none', () => {
    expect(imageSrcset('/uploads/a.webp', [400, 800])).toBe('/uploads/a-w400.webp 400w, /uploads/a-w800.webp 800w')
    expect(imageSrcset('/images/placeholder.svg')).toBeUndefined()
  })
})
