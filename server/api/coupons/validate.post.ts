import type { AppliedCoupon } from '#shared/types/catalog'
import { couponValidateInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event): Promise<AppliedCoupon> => {
  // Enough for a customer trying a few codes, too few to guess codes by brute force
  await rateLimit(event, 'coupon', 15, 15 * 60 * 1000)
  const { code, subtotal, phone } = await readValidated(event, couponValidateInput)
  return toAppliedCoupon(await findUsableCoupon(useDb(), code, subtotal, phone))
})
