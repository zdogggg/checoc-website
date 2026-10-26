import { PAYMENT_METHOD_LABELS } from '#shared/utils/orders'

type Order = typeof schema.orders.$inferSelect

// Optional Telegram message to the shop when an order comes in.
// Enabled by NUXT_TELEGRAM_BOT_TOKEN + NUXT_TELEGRAM_CHAT_ID; never blocks or fails the order.
export async function notifyNewOrder(order: Order, itemCount: number) {
  const { telegramBotToken, telegramChatId, public: pub } = useRuntimeConfig()
  if (!telegramBotToken || !telegramChatId) return

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
