// SMS delivery for login codes.
//
// No SMS provider is wired in yet: pick one (eSMS, SpeedSMS, Zalo ZNS, ...) and add it to
// sendSms() using NUXT_SMS_* settings. Until then:
//   - in development, the code is printed in the server log (and returned to the browser),
//   - in production, signing in by SMS is reported as unavailable.

export function isSmsConfigured(): boolean {
  return !!useRuntimeConfig().smsProvider
}

export function canSendLoginCodes(): boolean {
  return isSmsConfigured() || import.meta.dev
}

export async function sendSms(phone: string, text: string): Promise<void> {
  const { smsProvider } = useRuntimeConfig()
  if (!smsProvider) {
    if (import.meta.dev) {
      console.info(`[sms:dev] to ${phone}: ${text}`)
      return
    }
    throw createError({
      statusCode: 503,
      statusMessage: 'SMS not configured',
      message: 'Đăng nhập bằng SMS tạm thời chưa khả dụng. Bạn vẫn đặt hàng và tích điểm bình thường theo số điện thoại.',
    })
  }
  throw createError({ statusCode: 500, statusMessage: `Unknown SMS provider "${smsProvider}"` })
}
