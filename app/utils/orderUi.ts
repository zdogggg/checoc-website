import type { OrderStatus, PaymentStatus } from '#shared/utils/orders'

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-sky-50 text-sky-700',
  preparing: 'bg-brand-peach/30 text-brand-dark-green',
  shipping: 'bg-indigo-50 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  unpaid: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-purple-50 text-purple-700',
}

// Label of the button that moves an order one step forward
export const FORWARD_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Xác nhận đơn',
  preparing: 'Bắt đầu làm',
  shipping: 'Giao cho shipper',
  completed: 'Đã giao xong',
}

// Always shop time: pages render on the server (UTC in Docker) and in the browser,
// and both must print the same clock time
export const SHOP_TIME_ZONE = 'Asia/Ho_Chi_Minh'

const dateTimeFmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: SHOP_TIME_ZONE })
const timeFmt = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: SHOP_TIME_ZONE })

export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))

// "3 phút trước", falls back to the date after a day
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return formatDateTime(iso)
}

export const PURCHASE_LABELS = {
  draft: 'Chờ nhận hàng',
  received: 'Đã nhận hàng',
  cancelled: 'Đã huỷ',
} as const

export const PURCHASE_BADGE = {
  draft: 'bg-amber-50 text-amber-700',
  received: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
} as const
