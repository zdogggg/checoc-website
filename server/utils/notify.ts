import { PAYMENT_METHOD_LABELS } from '#shared/utils/orders'

type Order = typeof schema.orders.$inferSelect

// Optional Telegram messages to the shop: new orders and server errors.
// Enabled by NUXT_TELEGRAM_BOT_TOKEN + NUXT_TELEGRAM_CHAT_ID; never blocks or fails a request.
export async function notifyNewOrder(order: Order, itemCount: number) {
  const pub = useRuntimeConfig().public
  const text = [
    `Đơn mới ${order.code}`,
    `${order.customerName} · ${order.customerPhone}`,
    `${order.address}, ${order.district}, ${order.city}`,
    `${itemCount} món · ${order.total.toLocaleString('vi-VN')}đ · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`,
    order.note ? `Ghi chú: ${order.note}` : '',
    pub.siteUrl ? `${pub.siteUrl}/admin/orders/${order.id}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  await sendTelegram(text)
}

// Server errors (5xx): at most one message per distinct error every 10 minutes, and at most
// ALERTS_PER_HOUR in all, so nobody can flood the shop's chat by requesting many different
// URLs that fail. The text never carries customer data (see describeErrorForAlert); details
// stay in the server log.
// route: the matched route pattern ("/api/products/:slug"), so /api/products/a and /b count as
// one error
const ALERTS_PER_HOUR = 20
const lastAlert = new Map<string, number>()
let hourStart = 0
let sentThisHour = 0
let suppressed = 0
export async function notifyServerError(error: Error, path: string, route?: string) {
  const summary = describeErrorForAlert(error)
  const where = redactPath(route ?? path)
  const key = `${where} ${summary}`.slice(0, 200)
  const now = Date.now()
  if (now - (lastAlert.get(key) ?? 0) < 10 * 60 * 1000) return
  if (lastAlert.size > 500) lastAlert.clear()
  lastAlert.set(key, now)

  if (now - hourStart >= 60 * 60 * 1000) {
    hourStart = now
    sentThisHour = 0
  }
  if (sentThisHour >= ALERTS_PER_HOUR) {
    suppressed++
    return
  }
  sentThisHour++
  const skipped = suppressed ? `\n(${suppressed} cảnh báo khác đã bị ẩn để tránh làm ngập tin nhắn, xem log)` : ''
  suppressed = 0
  await sendTelegram(`Lỗi máy chủ tại ${where}\n${summary}\nChi tiết: xem log của server.${skipped}`)
}

async function sendTelegram(text: string) {
  const { telegramBotToken, telegramChatId } = useRuntimeConfig()
  if (!telegramBotToken || !telegramChatId) return
  try {
    await $fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      body: { chat_id: telegramChatId, text },
      timeout: 5000,
    })
  } catch (error) {
    console.warn('[notify] Telegram message failed', (error as Error).message)
  }
}

// A staff account was locked after repeated wrong passwords (server/api/auth/login.post.ts)
export async function notifyStaffLocked(email: string) {
  await sendTelegram(`Tài khoản quản trị ${email} vừa bị khoá 15 phút vì nhập sai mật khẩu 5 lần. Nếu không phải nhân viên của quán, hãy đổi mật khẩu.`)
}

// A paid order was cancelled: someone has to send the money back
export async function notifyRefundDue(code: string, total: number, reason: string) {
  await sendTelegram(
    [`Đơn ${code} đã huỷ nhưng khách đã thanh toán ${total.toLocaleString('vi-VN')}đ: cần hoàn tiền cho khách.`, reason ? `Lý do huỷ: ${reason.slice(0, 200)}` : '']
      .filter(Boolean)
      .join('\n')
  )
}

// A transfer the system could not settle by itself (no matching order, short amount, paid twice)
export async function notifyTransferToCheck(amount: number, what: string, content: string) {
  await sendTelegram(
    [`Chuyển khoản ${amount.toLocaleString('vi-VN')}đ cần kiểm tra: ${what}`, content ? `Nội dung: ${content.slice(0, 200)}` : '']
      .filter(Boolean)
      .join('\n')
  )
}
