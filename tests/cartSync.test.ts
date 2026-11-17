import { describe, expect, it } from 'vitest'
import { cartKeyFor, cartSyncMessage, reconcileCart, type SyncCartItem } from '~/utils/cartSync'
import type { Product, ProductOptions } from '#shared/types/catalog'

const product = (p: Partial<Product> & Pick<Product, 'id' | 'name' | 'price'>): Product => ({
  slug: `mon-${p.id}`, shortDescription: '', description: '', originalPrice: null, image: '', galleryImages: [],
  categoryId: 1, categoryName: '', badge: null, rating: 0, reviewCount: 0, toppings: [], ingredients: [],
  nutrition: null, prepTime: '', isAvailable: true, isFeatured: false, ...p,
})

const options: ProductOptions = {
  sugar: [{ id: 's1', label: 'Bình thường', shortLabel: 'Ngọt vừa', default: true }, { id: 's2', label: 'Ít ngọt', shortLabel: 'Ít ngọt' }],
  ice: [{ id: 'i1', label: 'Đá để riêng', shortLabel: 'Đá riêng', default: true }],
  toppings: [{ id: 't1', name: 'Trân châu', price: 7000 }],
}

const item = (o: Partial<SyncCartItem> & { id: number; price: number }, opts: Partial<SyncCartItem['options']> = {}): SyncCartItem => {
  const options = { sugar: '', ice: '', toppings: [], note: '', ...opts }
  return { slug: '', name: 'cũ', basePrice: o.price, image: '', quantity: 1, cartKey: cartKeyFor(o.id, options), options, ...o }
}

describe('reconcileCart', () => {
  it('reprices from the menu, toppings included', () => {
    const r = reconcileCart([item({ id: 1, price: 30000 }, { toppings: [{ name: 'Trân châu', price: 5000 }] })], [product({ id: 1, name: 'Chè Thái', price: 35000 })], options)
    expect(r.items[0]).toMatchObject({ name: 'Chè Thái', basePrice: 35000, price: 42000, options: { toppings: [{ name: 'Trân châu', price: 7000 }] } })
    expect(r.priceChanged).toBe(true)
  })

  it('maps renamed or missing sugar/ice choices to the current default', () => {
    const r = reconcileCart([item({ id: 1, price: 35000 }, { sugar: '100% đường', ice: 'Đá riêng' })], [product({ id: 1, name: 'Chè', price: 35000 })], options)
    expect(r.items[0]!.options).toMatchObject({ sugar: 'Ngọt vừa', ice: 'Đá riêng' })
    expect(r.optionsReset).toBe(true)
    expect(r.priceChanged).toBe(false)
  })

  it('fills empty choices with the default without warning the customer', () => {
    const r = reconcileCart([item({ id: 1, price: 35000 })], [product({ id: 1, name: 'Chè', price: 35000 })], options)
    expect(r.items[0]!.options.sugar).toBe('Ngọt vừa')
    expect(cartSyncMessage(r)).toBe('')
  })

  it('drops dishes that are gone or sold out', () => {
    const r = reconcileCart(
      [item({ id: 1, price: 35000 }), item({ id: 2, price: 20000, name: 'Bánh flan' })],
      [product({ id: 1, name: 'Chè', price: 35000, isAvailable: false })],
      options
    )
    expect(r.items).toHaveLength(0)
    expect(r.removed).toEqual(['Chè', 'Bánh flan'])
    expect(cartSyncMessage(r)).toContain('Đã bỏ Chè, Bánh flan')
  })

  it('merges lines that become identical', () => {
    const r = reconcileCart(
      [item({ id: 1, price: 35000, quantity: 1 }, { toppings: [{ name: 'Thạch cũ', price: 3000 }] }), item({ id: 1, price: 35000, quantity: 2 })],
      [product({ id: 1, name: 'Chè', price: 35000 })],
      options
    )
    expect(r.items).toHaveLength(1)
    expect(r.items[0]!.quantity).toBe(3)
  })
})
