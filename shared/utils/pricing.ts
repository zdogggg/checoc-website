import type { AppliedCoupon } from '../types/catalog'

export const FREESHIP_THRESHOLD = 100000
export const BASE_SHIPPING_FEE = 15000

export function shippingFeeFor(subtotal: number, coupon: AppliedCoupon | null): number {
  if (subtotal <= 0) return 0
  if (coupon?.type === 'free_shipping') return 0
  return subtotal >= FREESHIP_THRESHOLD ? 0 : BASE_SHIPPING_FEE
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
