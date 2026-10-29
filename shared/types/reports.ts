import type { OrderChannel, PaymentMethod } from '../utils/orders'

export interface ReportKpis {
  // Goods revenue of completed orders (shipping excluded)
  revenue: number
  completedOrders: number
  placedOrders: number
  cancelledOrders: number
  // completed revenue / completed orders
  avgOrderValue: number
  cogs: number
  grossProfit: number
  // Commission kept by delivery apps (ShopeeFood) on completed orders
  platformFees: number
  // Coupon + points discounts given on completed orders
  discounts: number
  shippingCollected: number
  newCustomers: number
  returningCustomers: number
  // Completed orders whose items had no recipe cost yet
  ordersWithoutCost: number
}

export interface SalesReport {
  range: { from: string; to: string }
  previousRange: { from: string; to: string }
  kpis: ReportKpis
  previous: ReportKpis
  daily: { day: string; revenue: number; orders: number }[]
  // 0..23, shop time
  hourly: { hour: number; orders: number; revenue: number }[]
  topProducts: { name: string; quantity: number; revenue: number; cost: number }[]
  categories: { name: string; quantity: number; revenue: number }[]
  payments: { method: PaymentMethod; orders: number; revenue: number }[]
  // Website vs delivery apps: what each channel really leaves after ingredients and commission
  channels: { channel: OrderChannel; orders: number; revenue: number; cogs: number; fees: number }[]
  topCustomers: { id: number; name: string; phone: string; orders: number; revenue: number }[]
}

// One bar of the admin ColumnChart
export interface ColumnDatum {
  key: string
  label: string
  // Shorter text for the x axis (falls back to label)
  shortLabel?: string
  value: number
  // First line is the headline value, the rest are details
  tooltip: string[]
}
