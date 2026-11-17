import type { AppliedCoupon } from '../types/catalog'

export const FREESHIP_THRESHOLD = 100000
export const BASE_SHIPPING_FEE = 15000

// What counts toward free shipping: the goods after the coupon. A 100.000đ cart with a 50% code
// pays 50.000đ for food, so it is a 50.000đ order for shipping too. Loyalty points do not
// lower it (they are a reward, applied after shipping is settled).
export function freeshipBase(subtotal: number, coupon: AppliedCoupon | null): number {
  return Math.max(0, subtotal - couponDiscount(coupon, subtotal))
}

export function shippingFeeFor(subtotal: number, coupon: AppliedCoupon | null): number {
  if (subtotal <= 0) return 0
  if (coupon?.type === 'free_shipping') return 0
  return freeshipBase(subtotal, coupon) >= FREESHIP_THRESHOLD ? 0 : BASE_SHIPPING_FEE
}

// Discount on the item subtotal (free-shipping coupons act through shippingFeeFor instead)
export function couponDiscount(coupon: AppliedCoupon | null, subtotal: number): number {
  if (!coupon || subtotal <= 0 || subtotal < coupon.minOrder) return 0
  let discount = 0
  if (coupon.type === 'percent') discount = Math.round((subtotal * coupon.discount) / 100)
  if (coupon.type === 'fixed') discount = coupon.discount
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount)
  return Math.min(discount, subtotal)
}

export function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')}đ`
}
