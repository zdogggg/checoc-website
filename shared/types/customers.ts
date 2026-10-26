import type { CustomerSegment, CustomerTier } from '../utils/loyalty'
import type { OrderStatus } from '../utils/orders'

export interface CustomerAddressView {
  id: number
  city: string
  district: string
  address: string
}

export type LoyaltyReason = 'order_earn' | 'order_redeem' | 'redeem_refund' | 'manual'

export interface LedgerEntryView {
  id: number
  delta: number
  balanceAfter: number
  reason: LoyaltyReason
  orderCode: string | null
  note: string
  // Staff name for manual adjustments (admin only)
  by?: string | null
  createdAt: string
}

export interface CustomerOrderSummary {
  id: number
  code: string
  status: OrderStatus
  total: number
  itemCount: number
  createdAt: string
  // Only in the customer's own account view
  trackingToken?: string
}

// /api/account/me
export interface CustomerAccount {
  phone: string
  name: string
  email: string | null
  birthday: string | null
  tier: CustomerTier
  points: number
  totalSpent: number
  completedOrders: number
  addresses: CustomerAddressView[]
  orders: CustomerOrderSummary[]
  ledger: LedgerEntryView[]
}

export interface AdminCustomerListItem {
  id: number
  phone: string
  name: string
  tier: CustomerTier
  segment: CustomerSegment
  points: number
  totalSpent: number
  completedOrders: number
  lastOrderAt: string | null
  tags: string[]
}

export interface AdminCustomerNote {
  id: number
  content: string
  by: string | null
  createdAt: string
}

export interface AdminCustomerDetail extends AdminCustomerListItem {
  email: string | null
  birthday: string | null
  note: string
  createdAt: string
  lastLoginAt: string | null
  addresses: CustomerAddressView[]
  orders: CustomerOrderSummary[]
  ledger: LedgerEntryView[]
  notes: AdminCustomerNote[]
  coupons: { id: number; code: string; description: string; usedCount: number; usageLimit: number | null; endsAt: string | null; isActive: boolean }[]
}
