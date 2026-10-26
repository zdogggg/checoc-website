import type { AppliedCoupon } from '#shared/types/catalog'
import { couponValidateInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event): Promise<AppliedCoupon> => {
  const { code, subtotal, phone } = await readValidated(event, couponValidateInput)
  return toAppliedCoupon(await findUsableCoupon(useDb(), code, subtotal, phone))
})
