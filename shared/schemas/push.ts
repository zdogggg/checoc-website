import { z } from 'zod'

// The server sends a request to every subscribed endpoint, so only the browsers' own push
// services are accepted; anything else could make the server call internal addresses.
const PUSH_HOSTS = [
  'fcm.googleapis.com', // Chrome, Edge, Android
  'push.apple.com', // Safari, iPhone home-screen apps (web.push.apple.com)
  'push.services.mozilla.com', // Firefox
  'notify.windows.com', // legacy Edge
]

export function isPushServiceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

// PushSubscription.toJSON() from the browser
export const pushSubscriptionInput = z.object({
  endpoint: z.string().max(1000).refine(isPushServiceUrl, 'Unsupported push service'),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
})

export const pushUnsubscribeInput = z.object({ endpoint: z.string().max(1000) })
