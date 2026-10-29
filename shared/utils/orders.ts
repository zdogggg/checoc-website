// Order status rules shared by the API (enforcement) and the UI (labels, buttons)

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
export type PaymentMethod = 'cod' | 'vietqr'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  shipping: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Tiền mặt khi nhận hàng (COD)',
  vietqr: 'Chuyển khoản VietQR',
}

// The happy path, in order; used for progress bars
export const ORDER_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipping', 'completed']

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipping', 'cancelled'],
  // e.g. the customer could not be reached
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from]
}

// The "move forward" action for a status, if any (cancel is offered separately)
export function nextForwardStatus(from: OrderStatus): OrderStatus | null {
  return TRANSITIONS[from].find((s) => s !== 'cancelled') ?? null
}

export function isFinalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0
}

// Push notification sent to the customer when their order moves (none for "pending":
// that is the state they just created themselves)
export function orderStatusMessage(code: string, status: OrderStatus, cancelReason?: string | null) {
  const body: Record<Exclude<OrderStatus, 'pending'>, string> = {
    confirmed: 'Quán đã nhận đơn của bạn và sắp bắt đầu làm món.',
    preparing: 'Quán đang chuẩn bị món cho bạn.',
    shipping: 'Đơn đang trên đường giao tới bạn.',
    completed: 'Đơn đã giao xong. Cảm ơn bạn đã ủng hộ Chè Cốc!',
    cancelled: cancelReason ? `Đơn đã bị huỷ: ${cancelReason}` : 'Đơn đã bị huỷ.',
  }
  if (status === 'pending') return null
  return { title: `Đơn ${code} · ${ORDER_STATUS_LABELS[status]}`, body: body[status] }
}

// "+84988123456" / "84 988 123 456" -> "0988123456"
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '')
  if (digits.startsWith('+84')) return `0${digits.slice(3)}`
  if (digits.startsWith('84') && digits.length === 11) return `0${digits.slice(2)}`
  return digits
}

export const VN_MOBILE_REGEX = /^0[35789]\d{8}$/

export interface BankAccount {
  bankId: string
  accountNo: string
  accountName: string
}

export function isBankConfigured(bank: Partial<BankAccount> | undefined): bank is BankAccount {
  return !!bank?.bankId && !!bank.accountNo && !!bank.accountName
}

// VietQR image (EMVCo QR) via the public img.vietqr.io quick-link service.
// The order code is used as the transfer description so payments can be matched.
export function vietQrImageUrl(bank: BankAccount, amount: number, orderCode: string): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: orderCode,
    accountName: bank.accountName,
  })
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bankId)}-${encodeURIComponent(bank.accountNo)}-compact2.png?${params}`
}
