import { eq } from 'drizzle-orm'
import type { AppliedCoupon } from '#shared/types/catalog'
import { couponValidateInput } from '#shared/schemas/catalog'

const invalid = (message: string) => createError({ statusCode: 400, statusMessage: 'Invalid coupon', message })

export default defineEventHandler(async (event): Promise<AppliedCoupon> => {
  const { code, subtotal } = await readValidated(event, couponValidateInput)

  const coupon = await useDb().query.coupons.findFirst({
    where: eq(schema.coupons.code, code.toUpperCase()),
  })
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

  return {
    code: coupon.code,
    type: coupon.type,
    discount: coupon.value,
    description: coupon.description,
    minOrder: coupon.minOrder,
    maxDiscount: coupon.maxDiscount,
  }
})
