import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import type { AppliedCoupon } from '#shared/types/catalog'
import { normalizePhone } from '#shared/utils/orders'

const invalid = (message: string) => createError({ statusCode: 400, statusMessage: 'Invalid coupon', message })

type Db = ReturnType<typeof useDb>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// Look up a coupon and check it can be used for this subtotal (and phone, for personal coupons);
// throws a 400 with a customer-facing message
export async function findUsableCoupon(db: Db | Tx, code: string, subtotal: number, phone?: string | null) {
  const coupon = await db.query.coupons.findFirst({ where: eq(schema.coupons.code, code.trim().toUpperCase()) })
  const now = new Date()
  if (
    !coupon ||
    !coupon.isActive ||
    (coupon.startsAt && coupon.startsAt > now) ||
    (coupon.endsAt && coupon.endsAt < now) ||
    (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
  ) {
    throw invalid('Mã giảm giá không hợp lệ hoặc đã hết hạn')
  }
  if (subtotal < coupon.minOrder) {
    throw invalid(`Mã chỉ áp dụng cho đơn từ ${coupon.minOrder.toLocaleString('vi-VN')}đ`)
  }
  if (coupon.customerId) {
    const normalized = phone ? normalizePhone(phone) : ''
    if (!normalized) {
      throw invalid('Đây là mã dành riêng cho một khách hàng. Vui lòng nhập số điện thoại trước khi áp dụng.')
    }
    const owner = await db.query.customers.findFirst({
      where: eq(schema.customers.id, coupon.customerId),
      columns: { phone: true },
    })
    if (owner?.phone !== normalized) throw invalid('Mã này không áp dụng cho số điện thoại của bạn')
  }
  return coupon
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
  if (!row) throw invalid('Mã giảm giá vừa hết lượt sử dụng')
}

export async function releaseCouponUse(tx: Tx, couponId: number) {
  const { coupons } = schema
  await tx
    .update(coupons)
    .set({ usedCount: sql`greatest(${coupons.usedCount} - 1, 0)` })
    .where(eq(coupons.id, couponId))
}
