// Pure order pricing: no DB access and no Nitro auto-imports, so it is unit-tested directly.
// The client never sends prices; every amount here comes from the current menu.
import type { AppliedCoupon } from '../../shared/types/catalog'
import type { OrderItemInput } from '../../shared/schemas/orders'
import { couponDiscount, shippingFeeFor } from '../../shared/utils/pricing'

export class OrderPricingError extends Error {}

export interface PricingProduct {
  id: number
  name: string
  image: string
  price: number
  isAvailable: boolean
}

export interface PricingOption {
  label: string
  shortLabel: string
  price: number
  isDefault?: boolean
}

export interface PricingOptions {
  sugar: PricingOption[]
  ice: PricingOption[]
  toppings: PricingOption[]
}

export interface PricedLine {
  productId: number
  productName: string
  productImage: string
  basePrice: number
  unitPrice: number
  quantity: number
  lineTotal: number
  sugar: string
  ice: string
  toppings: { name: string; price: number }[]
  note: string
}

export interface PricedOrder {
  lines: PricedLine[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
}

// Sugar/ice are matched on the short label the cart shows; an empty value means "default"
function pickChoice(list: PricingOption[], value: string, what: string, productName: string): string {
  if (!value) return (list.find((o) => o.isDefault) ?? list[0])?.shortLabel ?? ''
  const found = list.find((o) => o.shortLabel === value || o.label === value)
  if (!found) {
    throw new OrderPricingError(`Lựa chọn ${what} "${value}" của món ${productName} không còn. Vui lòng chọn lại món.`)
  }
  return found.shortLabel
}

export function priceOrderLines(
  items: OrderItemInput[],
  products: Map<number, PricingProduct>,
  options: PricingOptions
): PricedLine[] {
  return items.map((item) => {
    const product = products.get(item.productId)
    if (!product) {
      throw new OrderPricingError('Một món trong giỏ không còn trong thực đơn. Vui lòng xoá món đó khỏi giỏ hàng.')
    }
    if (!product.isAvailable) {
      throw new OrderPricingError(`Món ${product.name} đang tạm hết. Vui lòng xoá món này khỏi giỏ hàng.`)
    }

    const toppings = item.toppings.map((name) => {
      const topping = options.toppings.find((t) => t.label === name || t.shortLabel === name)
      if (!topping) {
        throw new OrderPricingError(`Topping "${name}" của món ${product.name} không còn. Vui lòng chọn lại món.`)
      }
      return { name: topping.label, price: topping.price }
    })

    const unitPrice = product.price + toppings.reduce((sum, t) => sum + t.price, 0)
    return {
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.price,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      sugar: pickChoice(options.sugar, item.sugar, 'độ ngọt', product.name),
      ice: pickChoice(options.ice, item.ice, 'lượng đá', product.name),
      toppings,
      note: item.note,
    }
  })
}

export function totalsFor(lines: PricedLine[], coupon: AppliedCoupon | null): PricedOrder {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const discount = couponDiscount(coupon, subtotal)
  const shippingFee = shippingFeeFor(subtotal, coupon)
  return { lines, subtotal, discount, shippingFee, total: Math.max(0, subtotal - discount + shippingFee) }
}
