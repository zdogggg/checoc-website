import { describe, expect, it } from 'vitest'
import { couponDiscount, shippingFeeFor } from '#shared/utils/pricing'
import type { AppliedCoupon } from '#shared/types/catalog'

const base: AppliedCoupon = { code: 'X', type: 'percent', discount: 10, description: '', minOrder: 0, maxDiscount: null }

describe('couponDiscount', () => {
  it('caps a percent discount at maxDiscount', () => {
    expect(couponDiscount({ ...base, discount: 50, maxDiscount: 30000 }, 200000)).toBe(30000)
  })

  it('gives nothing below the minimum order', () => {
    expect(couponDiscount({ ...base, minOrder: 100000 }, 99000)).toBe(0)
    expect(couponDiscount({ ...base, minOrder: 100000 }, 100000)).toBe(10000)
  })

  it('never discounts more than the subtotal', () => {
    expect(couponDiscount({ ...base, type: 'fixed', discount: 50000 }, 30000)).toBe(30000)
  })

  it('gives no item discount for free-shipping coupons', () => {
    expect(couponDiscount({ ...base, type: 'free_shipping', discount: 0 }, 50000)).toBe(0)
  })
})

describe('shippingFeeFor', () => {
  it('is free for an empty cart, above the threshold, or with a free-ship coupon', () => {
    expect(shippingFeeFor(0, null)).toBe(0)
    expect(shippingFeeFor(100000, null)).toBe(0)
    expect(shippingFeeFor(50000, { ...base, type: 'free_shipping' })).toBe(0)
    expect(shippingFeeFor(50000, null)).toBe(15000)
  })
})
