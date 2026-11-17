/* eslint-disable @typescript-eslint/no-explicit-any -- test responses are inspected loosely */
// Shared setup for the integration tests: an HTTP client that keeps its session cookie, direct
// SQL access to check what the API wrote, and test data that is easy to find and remove.
import { randomInt, randomUUID } from 'node:crypto'
import postgres from 'postgres'

try {
  // Locally the admin account and DATABASE_URL come from .env; CI passes them as variables
  process.loadEnvFile?.('.env')
} catch {
  // no .env: rely on the environment
}

export const BASE = (process.env.TEST_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

if (!process.env.DATABASE_URL || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error('Integration tests need DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD (and a server at TEST_BASE_URL)')
}

export const sql = postgres(process.env.DATABASE_URL, { max: 2, onnotice: () => {} })

// Every phone number used by the tests starts with this, so cleanup finds them all
export const PHONE_PREFIX = '090999'
export const phone = () => `${PHONE_PREFIX}${String(randomInt(0, 10_000)).padStart(4, '0')}`

// A made-up client IP per run (sent as X-Forwarded-For) so rate limits from other runs or
// from people using the server do not get in the way
const TEST_IP = `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`

export interface ApiResponse<T = any> {
  status: number
  data: T
}

// A browser-like client: keeps every cookie the server sets (session, device) and sends them back
export function client() {
  const jar = new Map<string, string>()
  return async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { origin: BASE, 'x-forwarded-for': TEST_IP }
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    const isForm = init.body instanceof FormData
    if (init.body !== undefined && !isForm) headers['content-type'] = 'application/json'
    const res = await fetch(BASE + path, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : isForm ? (init.body as FormData) : JSON.stringify(init.body),
    })
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';')
      const at = pair!.indexOf('=')
      const name = pair!.slice(0, at)
      const value = pair!.slice(at + 1)
      if (!value || /max-age=0|expires=thu, 01 jan 1970/i.test(line)) jar.delete(name)
      else jar.set(name, value)
    }
    const text = await res.text()
    let data: any = text
    try {
      data = JSON.parse(text)
    } catch {
      // not JSON
    }
    return { status: res.status, data }
  }
}

export async function ownerClient() {
  const api = client()
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  })
  if (res.status !== 200) throw new Error(`Owner login failed (${res.status}): ${JSON.stringify(res.data)}`)
  return api
}

export const orderBody = (productId: number, phoneNumber: string, extra: Record<string, unknown> = {}) => ({
  fullName: 'Khách kiểm thử',
  phone: phoneNumber,
  city: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  address: '1 Đường Kiểm Thử',
  note: '',
  paymentMethod: 'cod',
  couponCode: null,
  pointsToUse: 0,
  requestId: randomUUID(),
  items: [{ productId, quantity: 1, sugar: '', ice: '', toppings: [], note: '' }],
  ...extra,
})

// Walk an order through every status up to "completed"
export async function deliver(api: ReturnType<typeof client>, orderId: number) {
  for (const status of ['confirmed', 'preparing', 'shipping', 'completed']) {
    const res = await api(`/api/admin/orders/${orderId}/status`, { method: 'POST', body: { status } })
    if (res.status !== 200) throw new Error(`Status ${status} failed (${res.status}): ${JSON.stringify(res.data)}`)
  }
}

export const orderIdOf = async (code: string) => (await sql<{ id: number }[]>`select id from orders where code = ${code}`)[0]!.id

// Removes everything the tests created. Safe to run more than once.
export async function cleanup() {
  const like = `${PHONE_PREFIX}%`
  await sql.begin(async (tx) => {
    const orders = tx`select id from orders where customer_phone like ${like} or external_code like 'ITEST-%'`
    await tx`delete from bank_transactions where provider_id like 'itest-%' or order_id in (${orders})`
    await tx`delete from stock_movements where order_id in (${orders}) or ingredient_id in (select id from ingredients where name like 'ZZ-IT %')`
    await tx`delete from order_status_logs where order_id in (${orders})`
    await tx`delete from order_items where order_id in (${orders})`
    await tx`delete from push_subscriptions where order_id in (${orders})`
    await tx`delete from loyalty_ledger where customer_id in (select id from customers where phone like ${like})`
    await tx`delete from orders where customer_phone like ${like} or external_code like 'ITEST-%'`
    await tx`delete from coupons where customer_id in (select id from customers where phone like ${like})`
    await tx`delete from customers where phone like ${like}`
    await tx`delete from coupons where code like 'ITEST%'`
    await tx`delete from product_ingredients where ingredient_id in (select id from ingredients where name like 'ZZ-IT %')`
    await tx`delete from ingredients where name like 'ZZ-IT %'`
    await tx`delete from rate_limits where key like ${'%' + TEST_IP}`
    await tx`delete from rate_limits where key like ${'fail:lookup:' + like}`
  })
}
