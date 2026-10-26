import { otpRequestInput } from '#shared/schemas/customers'

export default defineEventHandler(async (event) => {
  rateLimit(event, 'otp', 10, 15 * 60 * 1000)
  const { phone } = await readValidated(event, otpRequestInput)
  const result = await requestLoginCode(phone)
  return { ok: true, ...result }
})
