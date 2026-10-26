import { describe, expect, it } from 'vitest'
import {
  OrderPricingError,
  priceOrderLines,
  totalsFor,
  type PricingOptions,
  type PricingProduct,
} from '../server/utils/orderPricing'
import { orderInput, type OrderItemInput } from '#shared/schemas/orders'
import { canTransition, nextForwardStatus, normalizePhone, vietQrImageUrl } from '#shared/utils/orders'
import type { AppliedCoupon } from '#shared/types/catalog'

const products = new Map<number, PricingProduct>([
  [1, { id: 1, name: 'Chè Thái', image: 'a.jpg', price: 35000, isAvailable: true }],
  [2, { id: 2, name: 'Chè Khúc Bạch', image: 'b.jpg', price: 42000, isAvailable: false }],
])

const options: PricingOptions = {
  sugar: [
    { label: '100% Đường', shortLabel: '100% đường', price: 0 },
    { label: '70% Ít ngọt', shortLabel: '70% đường', price: 0, isDefault: true },
  ],
  ice: [{ label: 'Đá riêng mát lạnh', shortLabel: 'Đá riêng', price: 0, isDefault: true }],
  toppings: [
    { label: 'Trân châu', shortLabel: 'Trân châu', price: 5000 },
    { label: 'Hạt sen', shortLabel: 'Hạt sen', price: 8000 },
  ],
}

const item = (over: Partial<OrderItemInput> = {}): OrderItemInput => ({
  productId: 1,
  quantity: 1,
  sugar: '',
  ice: '',
  toppings: [],
  note: '',
  ...over,
})

describe('priceOrderLines', () => {
  it('uses menu prices and adds topping prices, ignoring anything the client claims', () => {
    const [line] = priceOrderLines([item({ quantity: 2, toppings: ['Trân châu', 'Hạt sen'] })], products, options)
    expect(line).toMatchObject({ basePrice: 35000, unitPrice: 48000, quantity: 2, lineTotal: 96000 })
    expect(line!.toppings).toEqual([
      { name: 'Trân châu', price: 5000 },
      { name: 'Hạt sen', price: 8000 },
    ])
  })

  it('falls back to the default sugar/ice and keeps an explicit choice', () => {
    const [a, b] = priceOrderLines([item(), item({ sugar: '100% đường' })], products, options)
    expect(a!.sugar).toBe('70% đường')
    expect(a!.ice).toBe('Đá riêng')
    expect(b!.sugar).toBe('100% đường')
  })

  it('rejects unknown, unavailable products and removed options', () => {
    expect(() => priceOrderLines([item({ productId: 99 })], products, options)).toThrow(OrderPricingError)
    expect(() => priceOrderLines([item({ productId: 2 })], products, options)).toThrow(/tạm hết/)
    expect(() => priceOrderLines([item({ toppings: ['Thạch dừa'] })], products, options)).toThrow(/Thạch dừa/)
    expect(() => priceOrderLines([item({ sugar: '10% đường' })], products, options)).toThrow(/độ ngọt/)
  })
})

describe('totalsFor', () => {
  const coupon: AppliedCoupon = { code: 'X', type: 'percent', discount: 10, description: '', minOrder: 0, maxDiscount: null }

  it('adds shipping below the free-ship threshold and applies the coupon', () => {
    const lines = priceOrderLines([item({ quantity: 2 })], products, options) // 70.000
    expect(totalsFor(lines, null)).toMatchObject({ subtotal: 70000, discount: 0, shippingFee: 15000, total: 85000 })
    expect(totalsFor(lines, coupon)).toMatchObject({ discount: 7000, total: 78000 })
  })
})

describe('order input', () => {
  const base = {
    fullName: 'Lan',
    phone: '+84 988 123 456',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    address: '1 Xuân Thuỷ',
    paymentMethod: 'cod',
    items: [{ productId: 1, quantity: 1 }],
  }

  it('normalises the phone number', () => {
    expect(orderInput.parse(base).phone).toBe('0988123456')
    expect(normalizePhone('84988123456')).toBe('0988123456')
  })

  it('rejects bad phones, empty carts and silly quantities', () => {
    expect(orderInput.safeParse({ ...base, phone: '0123456789' }).success).toBe(false)
    expect(orderInput.safeParse({ ...base, items: [] }).success).toBe(false)
    expect(orderInput.safeParse({ ...base, items: [{ productId: 1, quantity: 500 }] }).success).toBe(false)
  })
})

describe('order status rules', () => {
  it('only allows moving forward one step or cancelling', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true)
    expect(canTransition('pending', 'shipping')).toBe(false)
    expect(canTransition('shipping', 'cancelled')).toBe(true)
    expect(canTransition('completed', 'cancelled')).toBe(false)
    expect(nextForwardStatus('preparing')).toBe('shipping')
    expect(nextForwardStatus('completed')).toBeNull()
  })
})

describe('vietQrImageUrl', () => {
  it('encodes amount and order code as the transfer description', () => {
    const url = vietQrImageUrl({ bankId: 'MB', accountNo: '0123', accountName: 'CHE COC' }, 55500, 'CC1001')
    expect(url).toBe('https://img.vietqr.io/image/MB-0123-compact2.png?amount=55500&addInfo=CC1001&accountName=CHE+COC')
  })
})
