import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

// A random key kept in an httpOnly cookie identifies the browser that placed an order.
// Only its hash is stored on the order. The tracking link alone (which anyone who knows the
// phone number and order code can look up) then shows a masked address and cannot be used to
// attach a sign-in email to the customer's account; the browser that ordered, or the customer
// signed in to their account, can.

const COOKIE = 'checoc_device'
const ONE_YEAR = 60 * 60 * 24 * 365

const hashOf = (key: string) => createHash('sha256').update(key).digest('hex')

// The hash for this browser, creating the cookie on first use
export function deviceHashFor(event: H3Event): string {
  let key = getCookie(event, COOKIE)
  if (!key || !/^[\w-]{32,64}$/.test(key)) {
    key = randomBytes(24).toString('base64url')
    setCookie(event, COOKIE, key, { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev, path: '/', maxAge: ONE_YEAR })
  }
  return hashOf(key)
}

// The browser that ordered counts as the owner for this long. A shared or borrowed computer
// keeps the cookie for a year; after a month the next person opening an old link from the
// browser history sees the masked view. The signed-in customer always sees everything.
const DEVICE_OWNER_DAYS = 30

// Whether the person viewing an order is the one who placed it
export async function isOrderOwner(
  event: H3Event,
  order: { deviceHash: string | null; customerId: number | null; createdAt: Date }
) {
  const key = getCookie(event, COOKIE)
  const recent = Date.now() - order.createdAt.getTime() <= DEVICE_OWNER_DAYS * 86_400_000
  if (recent && order.deviceHash && key && hashOf(key) === order.deviceHash) return true
  if (order.customerId == null) return false
  return (await currentCustomer(event))?.id === order.customerId
}
