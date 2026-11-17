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

// Server errors (5xx), at most one message per distinct error every 10 minutes.
// The text never carries customer data (see describeErrorForAlert); details stay in the server log.
const lastAlert = new Map<string, number>()
export async function notifyServerError(error: Error, path: string) {
  const summary = describeErrorForAlert(error)
  const key = `${path} ${summary}`.slice(0, 200)
  const now = Date.now()
  if (now - (lastAlert.get(key) ?? 0) < 10 * 60 * 1000) return
  if (lastAlert.size > 500) lastAlert.clear()
  lastAlert.set(key, now)
  await sendTelegram(`Lỗi máy chủ tại ${redactPath(path)}\n${summary}\nChi tiết: xem log của server.`)
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

// A transfer the system could not settle by itself (no matching order, short amount, paid twice)
export async function notifyTransferToCheck(amount: number, what: string, content: string) {
  await sendTelegram(
    [`Chuyển khoản ${amount.toLocaleString('vi-VN')}đ cần kiểm tra: ${what}`, content ? `Nội dung: ${content.slice(0, 200)}` : '']
      .filter(Boolean)
      .join('\n')
  )
}
