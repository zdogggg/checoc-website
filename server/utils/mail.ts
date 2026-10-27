// Email delivery through Resend (https://resend.com), called over its REST API.
// Enabled by NUXT_RESEND_API_KEY + NUXT_MAIL_FROM (an address on a domain verified in Resend).
// Without a key: in development the message is printed in the server log; in production
// sending fails with a 503 so the caller can tell the customer.

export interface MailMessage {
  to: string
  subject: string
  html: string
  text: string
}

export function isMailConfigured(): boolean {
  return !!useRuntimeConfig().resendApiKey
}

export async function sendMail(message: MailMessage): Promise<void> {
  const { resendApiKey, mailFrom } = useRuntimeConfig()
  if (!resendApiKey) {
    if (import.meta.dev) {
      console.info(`[mail:dev] to ${message.to}: ${message.subject}\n${message.text}`)
      return
    }
    throw createError({
      statusCode: 503,
      statusMessage: 'Mail not configured',
      message: 'Đăng nhập bằng email tạm thời chưa khả dụng. Bạn vẫn đặt hàng và tích điểm bình thường theo số điện thoại.',
    })
  }

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}` },
      body: { from: mailFrom, to: [message.to], subject: message.subject, html: message.html, text: message.text },
      timeout: 10_000,
    })
  } catch (error) {
    // Resend explains the problem (unverified domain, bad key) in the response body
    const detail = (error as { data?: { message?: string } }).data?.message ?? (error as Error).message
    console.error('[mail] Resend failed:', detail)
    throw createError({
      statusCode: 503,
      statusMessage: 'Mail failed',
      message: 'Không gửi được email lúc này, vui lòng thử lại sau ít phút.',
    })
  }
}

// Login code email; the code is also in the subject so it shows in notification previews
export function loginCodeMail(to: string, code: string): MailMessage {
  return {
    to,
    subject: `${code} là mã đăng nhập Chè Cốc của bạn`,
    text: `Mã đăng nhập Chè Cốc của bạn là ${code}. Mã có hiệu lực trong 5 phút.\n\nNếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#0D241B">
  <p style="font-size:18px;font-weight:bold;margin:0 0 16px">Chè Cốc</p>
  <p style="margin:0 0 8px">Mã đăng nhập của bạn:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;font-family:'Courier New',monospace;margin:0 0 16px">${code}</p>
  <p style="margin:0 0 8px;color:#555">Mã có hiệu lực trong 5 phút.</p>
  <p style="margin:0;color:#888;font-size:12px">Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
</div>`,
  }
}
