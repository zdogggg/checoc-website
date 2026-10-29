import { eq, inArray } from 'drizzle-orm'
import webpush from 'web-push'
import { isPushServiceUrl } from '#shared/schemas/push'
import type { OrderStatus } from '#shared/utils/orders'

// Web push to customers' browsers (the installed web app on iPhone, or any browser on
// Android / desktop). Enabled by NUXT_PUBLIC_VAPID_PUBLIC_KEY + NUXT_VAPID_PRIVATE_KEY.

export function isPushConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!config.public.vapidPublicKey && !!config.vapidPrivateKey
}

let configured = false
function setup() {
  if (configured) return
  const config = useRuntimeConfig()
  webpush.setVapidDetails(config.vapidSubject, config.public.vapidPublicKey, config.vapidPrivateKey)
  configured = true
}

// Tells every browser following this order about its new status. Never throws: a failed
// notification must not affect the status change that triggered it.
export async function notifyOrderStatus(order: {
  id: number
  code: string
  trackingToken: string
  status: OrderStatus
  cancelReason: string | null
}) {
  if (!isPushConfigured()) return
  const message = orderStatusMessage(order.code, order.status, order.cancelReason)
  if (!message) return

  const db = useDb()
  const { pushSubscriptions } = schema
  try {
    setup()
    // Re-checked here too: never send to an endpoint that is not a browser push service
    const subs = (await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.orderId, order.id))).filter((s) =>
      isPushServiceUrl(s.endpoint),
    )
    const payload = JSON.stringify({ ...message, url: `/orders/${order.trackingToken}`, tag: `order-${order.code}` })
    const gone: number[] = []
    await Promise.all(
      subs.map((s) =>
        webpush
          .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 })
          .catch((error: { statusCode?: number; body?: string }) => {
            // 404 / 410: the browser unsubscribed or the app was removed; Apple answers 400
            // BadDeviceToken for a subscription that will never work again
            const dead = error.statusCode === 404 || error.statusCode === 410 || error.body?.includes('BadDeviceToken')
            if (dead) gone.push(s.id)
            else console.warn('[push] send failed', error.statusCode, error.body)
          }),
      ),
    )
    if (isFinalStatus(order.status)) {
      // Nothing more will happen to this order
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.orderId, order.id))
    } else if (gone.length) {
      await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone))
    }
  } catch (error) {
    console.error('[push] notifyOrderStatus failed', error)
  }
}
