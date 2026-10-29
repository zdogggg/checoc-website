import type { OrderChannel, OrderStatus, PaymentMethod, PaymentStatus } from '../utils/orders'

export interface OrderItemView {
  id: number
  productId: number | null
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

export interface OrderTimelineEntry {
  status: OrderStatus
  at: string
  note: string
  // Staff name; only included in admin responses
  by?: string | null
}

// What the customer sees on the tracking page
export interface PublicOrder {
  code: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  customerName: string
  // Masked: the tracking link may be shared
  customerPhone: string
  city: string
  district: string
  address: string
  note: string
  items: OrderItemView[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  couponCode: string | null
  pointsUsed: number
  pointsDiscount: number
  // Granted when the order is completed
  pointsEarned: number
  cancelReason: string | null
  createdAt: string
  timeline: OrderTimelineEntry[]
}

export interface AdminOrder extends Omit<PublicOrder, 'timeline'> {
  id: number
  trackingToken: string
  customerId: number | null
  customerEmail: string | null
  channel: OrderChannel
  externalCode: string | null
  platformFee: number
  cogs: number
  paidAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  timeline: OrderTimelineEntry[]
}

export interface AdminOrderListItem {
  id: number
  code: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  channel: OrderChannel
  externalCode: string | null
  customerName: string
  customerPhone: string
  district: string
  total: number
  itemCount: number
  itemSummary: string
  createdAt: string
}

export interface PlacedOrder {
  code: string
  trackingToken: string
  total: number
}
