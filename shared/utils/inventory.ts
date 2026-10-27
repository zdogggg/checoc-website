// Inventory maths shared by the API and the admin UI. Pure functions, unit-tested.

export type StockMovementType = 'in' | 'out' | 'adjust' | 'waste'

export const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  in: 'Nhập hàng',
  out: 'Dùng cho đơn',
  adjust: 'Kiểm kho',
  waste: 'Hao hụt',
}

export const EXPENSE_CATEGORY_LABELS = {
  rent: 'Mặt bằng',
  utilities: 'Điện, nước, internet',
  salary: 'Lương nhân viên',
  marketing: 'Quảng cáo',
  packaging: 'Bao bì, cốc, ống hút',
  equipment: 'Dụng cụ, thiết bị',
  other: 'Khác',
} as const
export type ExpenseCategory = keyof typeof EXPENSE_CATEGORY_LABELS

export const UNIT_SUGGESTIONS = ['g', 'kg', 'ml', 'l', 'cái', 'gói', 'hộp', 'quả']

// Quantities are stored with 3 decimals
export const roundQty = (n: number) => Math.round(n * 1000) / 1000

// Weighted average cost after receiving `qty` units at `cost` each.
// Negative or zero stock (ingredient used before it was recorded) restarts the average.
export function weightedAverageCost(stock: number, avgCost: number, qty: number, cost: number): number {
  if (qty <= 0) return avgCost
  if (stock <= 0) return cost
  return (stock * avgCost + qty * cost) / (stock + qty)
}

export interface RecipeLine {
  ingredientId: number
  quantity: number
}

export interface ConsumptionItem {
  productId: number | null
  quantity: number
  // Option labels as stored on the order item
  sugar: string
  ice: string
  toppings: string[]
}

export interface RecipeBook {
  products: Map<number, RecipeLine[]>
  // Keyed "sugar:<shortLabel>", "ice:<shortLabel>", "topping:<label>"
  options: Map<string, RecipeLine[]>
}

export const optionKey = (group: 'sugar' | 'ice' | 'topping', label: string) => `${group}:${label}`

// Ingredient usage per order line (same order as `items`), each a map ingredientId -> quantity
export function consumptionByLine(items: ConsumptionItem[], book: RecipeBook): Map<number, number>[] {
  return items.map((item) => {
    const usage = new Map<number, number>()
    const add = (lines: RecipeLine[] | undefined) => {
      for (const l of lines ?? []) {
        usage.set(l.ingredientId, roundQty((usage.get(l.ingredientId) ?? 0) + l.quantity * item.quantity))
      }
    }
    if (item.productId != null) add(book.products.get(item.productId))
    if (item.sugar) add(book.options.get(optionKey('sugar', item.sugar)))
    if (item.ice) add(book.options.get(optionKey('ice', item.ice)))
    for (const t of item.toppings) add(book.options.get(optionKey('topping', t)))
    return usage
  })
}

export function sumUsage(lines: Map<number, number>[]): Map<number, number> {
  const total = new Map<number, number>()
  for (const line of lines) {
    for (const [id, q] of line) total.set(id, roundQty((total.get(id) ?? 0) + q))
  }
  return total
}

// Cost of a recipe at the given average costs (VND, not rounded)
export function recipeCost(recipe: RecipeLine[], avgCost: Map<number, number>): number {
  return recipe.reduce((sum, l) => sum + l.quantity * (avgCost.get(l.ingredientId) ?? 0), 0)
}

// Whether there is enough stock for one more serving. A product without a recipe is
// never blocked by inventory.
export function canMakeOne(recipe: RecipeLine[], stock: Map<number, number>): boolean {
  return recipe.every((l) => (stock.get(l.ingredientId) ?? 0) >= l.quantity)
}

// Gross margin as a share of the selling price, e.g. 0.62
export function marginRate(price: number, cost: number): number | null {
  return price > 0 ? (price - cost) / price : null
}

export function formatQty(n: number, unit: string): string {
  return `${n.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} ${unit}`
}

// Per-unit costs can be fractional (12,5đ per gram)
export function formatUnitCost(n: number): string {
  return `${n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}đ`
}
