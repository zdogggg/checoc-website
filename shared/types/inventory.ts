import type { ExpenseCategory, StockMovementType } from '../utils/inventory'

export interface IngredientListItem {
  id: number
  name: string
  unit: string
  stock: number
  minStock: number
  avgCost: number
  // stock x average cost, VND
  stockValue: number
  isLow: boolean
  isActive: boolean
  usedByProducts: number
  usedByOptions: number
  note: string
}

export interface StockMovementView {
  id: number
  type: StockMovementType
  quantity: number
  balanceAfter: number
  unitCost: number
  note: string
  ref: { kind: 'purchase' | 'order'; id: number; code: string } | null
  by: string | null
  createdAt: string
}

export interface IngredientDetail extends IngredientListItem {
  movements: StockMovementView[]
  usedIn: { kind: 'product' | 'option'; id: number; name: string; quantity: number }[]
}

export interface RecipeView {
  items: { ingredientId: number; name: string; unit: string; quantity: number; avgCost: number; cost: number }[]
  // Cost of one serving at current average costs
  totalCost: number
}

export interface SupplierView {
  id: number
  name: string
  phone: string
  address: string
  note: string
  isActive: boolean
  purchaseCount: number
  lastPurchaseAt: string | null
}

export type PurchaseStatus = 'draft' | 'received' | 'cancelled'

export interface PurchaseListItem {
  id: number
  code: string
  status: PurchaseStatus
  supplierName: string | null
  total: number
  itemCount: number
  note: string
  receivedAt: string | null
  createdAt: string
}

export interface PurchaseDetail extends PurchaseListItem {
  supplierId: number | null
  createdBy: string | null
  items: { id: number; ingredientId: number; name: string; unit: string; quantity: number; unitCost: number; lineTotal: number }[]
}

export interface ExpenseView {
  id: number
  category: ExpenseCategory
  amount: number
  spentOn: string
  note: string
  createdBy: string | null
}

export interface MonthlyPnl {
  month: string
  // Completed orders placed in the month
  revenue: number
  cogs: number
  grossProfit: number
  // Delivery app commission (ShopeeFood), counted as a selling cost
  platformFees: number
  expenses: number
  netProfit: number
  expensesByCategory: Partial<Record<ExpenseCategory, number>>
  // Completed orders without a recipe cost (no recipe set up yet)
  ordersWithoutCost: number
}
