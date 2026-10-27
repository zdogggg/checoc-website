import { emailOtpRequestInput, phoneOtpRequestInput } from '#shared/schemas/customers'

export default defineEventHandler(async (event) => {
  rateLimit(event, 'otp', 10, 15 * 60 * 1000)
  const target = (await sendsEmail(event))
    ? await readValidated(event, emailOtpRequestInput)
    : await readValidated(event, phoneOtpRequestInput)
  const result = await requestLoginCode(target)
  return { ok: true, ...result }
})
