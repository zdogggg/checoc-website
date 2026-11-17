// Bring a saved cart in line with the current menu. Pure, unit-tested.
//
// The cart lives in localStorage, so it can be days old: prices change, options get renamed,
// dishes run out. The server always prices from the menu, so without this the customer would
// see one total and be charged another, or be refused with "lựa chọn không còn".
import type { Product, ProductOptions, CustomOption } from '#shared/types/catalog'

export interface SyncCartItem {
  cartKey: string
  id: number
  slug: string
  name: string
  basePrice: number
  price: number
  image: string
  quantity: number
  options: {
    sugar: string
    ice: string
    toppings: Array<{ name: string; price: number }>
    note?: string
  }
}

export function cartKeyFor(productId: number, o: { sugar: string; ice: string; toppings: Array<{ name: string }>; note?: string }) {
  const toppings = o.toppings.map((t) => t.name).sort().join(',')
  return `${productId}__${o.sugar}__${o.ice}__${toppings}__${o.note ?? ''}`
}

// Default choice of a group as the cart shows it ('' when the group is empty)
export const defaultChoice = (list: CustomOption[]) => (list.find((o) => o.default) ?? list[0])?.shortLabel ?? ''

// Same matching as the server: short label or full label; unknown or empty -> current default
function resolveChoice(list: CustomOption[], value: string): { value: string; reset: boolean } {
  const found = value ? list.find((o) => o.shortLabel === value || o.label === value) : undefined
  if (found) return { value: found.shortLabel, reset: false }
  return { value: defaultChoice(list), reset: Boolean(value) }
}

export interface CartSyncResult<T extends SyncCartItem> {
  items: T[]
  removed: string[] // dishes taken out (gone from the menu or sold out)
  priceChanged: boolean
  optionsReset: boolean // a sugar/ice choice or a topping no longer exists
}

export function reconcileCart<T extends SyncCartItem>(
  items: T[],
  products: Product[],
  options: ProductOptions
): CartSyncResult<T> {
  const byId = new Map(products.map((p) => [p.id, p]))
  const removed: string[] = []
  let priceChanged = false
  let optionsReset = false
  const out: T[] = []

  for (const item of items) {
    const product = byId.get(item.id)
    if (!product || !product.isAvailable) {
      removed.push(product?.name ?? item.name)
      continue
    }
    const sugar = resolveChoice(options.sugar, item.options.sugar)
    const ice = resolveChoice(options.ice, item.options.ice)
    const toppings: Array<{ name: string; price: number }> = []
    for (const t of item.options.toppings) {
      const current = options.toppings.find((o) => o.name === t.name)
      if (current) toppings.push({ name: current.name, price: current.price })
      else optionsReset = true
    }
    if (sugar.reset || ice.reset) optionsReset = true

    const price = product.price + toppings.reduce((sum, t) => sum + t.price, 0)
    if (price !== item.price) priceChanged = true

    const next = {
      ...item,
      slug: product.slug,
      name: product.name,
      image: product.image,
      basePrice: product.price,
      price,
      options: { ...item.options, sugar: sugar.value, ice: ice.value, toppings },
    }
    next.cartKey = cartKeyFor(item.id, next.options)

    // Two lines can become identical (e.g. both lost the same topping): merge them
    const same = out.find((o) => o.cartKey === next.cartKey)
    if (same) same.quantity += next.quantity
    else out.push(next)
  }

  return { items: out, removed, priceChanged, optionsReset }
}

// One message for the customer, or '' when nothing they would notice changed
export function cartSyncMessage(r: Pick<CartSyncResult<SyncCartItem>, 'removed' | 'priceChanged' | 'optionsReset'>): string {
  const parts: string[] = []
  if (r.removed.length) parts.push(`đã bỏ ${r.removed.join(', ')} (hết món)`)
  if (r.priceChanged) parts.push('giá đã cập nhật theo thực đơn mới')
  if (r.optionsReset) parts.push('một số tuỳ chọn không còn nên đã đổi về mặc định')
  if (!parts.length) return ''
  const text = parts.join('; ')
  return `Giỏ hàng: ${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}
