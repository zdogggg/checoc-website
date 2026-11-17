import { and, count, eq, isNull, lt, ne, or, sql } from 'drizzle-orm'
import type { AppliedCoupon } from '#shared/types/catalog'
import { normalizePhone } from '#shared/utils/orders'

// reason lets the checkout tell "this code is dead" from "this code needs your phone first"
export type CouponRefusal = 'not_usable' | 'phone_required' | 'min_order' | 'phone_used' | 'used_up'
const invalid = (message: string, reason: CouponRefusal = 'not_usable') =>
  createError({ statusCode: 400, statusMessage: 'Invalid coupon', message, data: { reason } })

// One answer for "no such code", "expired" and "someone else's personal code", so the form
// cannot be used to find out which codes exist or whose phone a personal code belongs to
const NOT_USABLE = 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
const NOT_USABLE_WITHOUT_PHONE = 'Mã chưa dùng được. Nếu đây là mã quán tặng riêng cho bạn, hãy nhập số điện thoại nhận hàng trước.'

type Db = ReturnType<typeof useDb>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// Look up a coupon and check it can be used for this subtotal (and phone, for personal coupons);
// throws a 400 with a customer-facing message
export async function findUsableCoupon(db: Db | Tx, code: string, subtotal: number, phone?: string | null) {
  const coupon = await db.query.coupons.findFirst({ where: eq(schema.coupons.code, code.trim().toUpperCase()) })
  const now = new Date()
  const normalized = phone ? normalizePhone(phone) : ''
  const dead =
    !coupon ||
    !coupon.isActive ||
    (coupon.startsAt && coupon.startsAt > now) ||
    (coupon.endsAt && coupon.endsAt < now) ||
    (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
  // Without a phone number, a dead code and someone's personal code get the very same answer:
  // otherwise the form would tell which personal codes exist
  if (!normalized && (dead || coupon.customerId)) throw invalid(NOT_USABLE_WITHOUT_PHONE, 'phone_required')
  if (dead) throw invalid(NOT_USABLE)
  if (coupon.customerId) {
    const owner = await db.query.customers.findFirst({
      where: eq(schema.customers.id, coupon.customerId),
      columns: { phone: true },
    })
    if (owner?.phone !== normalized) throw invalid(NOT_USABLE)
  }
  if (subtotal < coupon.minOrder) {
    throw invalid(`Mã chỉ áp dụng cho đơn từ ${coupon.minOrder.toLocaleString('vi-VN')}đ`, 'min_order')
  }
  if (normalized) await assertPhoneUses(db, coupon, normalized)
  return coupon
}

// Uses of this coupon by one phone number, cancelled orders excluded. Called again by checkout
// after claimCouponUse: that locks the coupon row, so two orders racing for the last use of the
// same phone are counted one after the other.
export async function assertPhoneUses(db: Db | Tx, coupon: { id: number; perPhoneLimit: number | null }, phone: string) {
  if (coupon.perPhoneLimit == null) return
  const { orders } = schema
  const [used] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.couponId, coupon.id), eq(orders.customerPhone, phone), ne(orders.status, 'cancelled')))
  if ((used?.n ?? 0) >= coupon.perPhoneLimit) {
    throw invalid(
      coupon.perPhoneLimit === 1
        ? 'Số điện thoại này đã dùng mã này rồi'
        : `Mỗi số điện thoại chỉ dùng mã này ${coupon.perPhoneLimit} lần`,
      'phone_used'
    )
  }
}

export function toAppliedCoupon(coupon: typeof schema.coupons.$inferSelect): AppliedCoupon {
  return {
    code: coupon.code,
    type: coupon.type,
    discount: coupon.value,
    description: coupon.description,
    minOrder: coupon.minOrder,
    maxDiscount: coupon.maxDiscount,
  }
}

// Atomically take one use of the coupon; fails if the last use was taken concurrently
export async function claimCouponUse(tx: Tx, couponId: number) {
  const { coupons } = schema
  const [row] = await tx
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(and(eq(coupons.id, couponId), or(isNull(coupons.usageLimit), lt(coupons.usedCount, coupons.usageLimit))))
    .returning({ id: coupons.id })
  if (!row) throw invalid('Mã giảm giá vừa hết lượt sử dụng', 'used_up')
}

export async function releaseCouponUse(tx: Tx, couponId: number) {
  const { coupons } = schema
  await tx
    .update(coupons)
    .set({ usedCount: sql`greatest(${coupons.usedCount} - 1, 0)` })
    .where(eq(coupons.id, couponId))
}
