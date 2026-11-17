// Report figures that add up, the ShopeeFood date window, personal coupons that stay private,
// the cached public menu, and the open-order limit under parallel checkouts.
import { randomInt } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, client, deliver, orderBody, orderIdOf, ownerClient, phone, sql } from './helpers'

let owner: Awaited<ReturnType<typeof ownerClient>>
let productId: number
const shopper = client()
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

beforeAll(async () => {
  await cleanup()
  owner = await ownerClient()
  const products = (await shopper('/api/products')).data as { id: number; isAvailable: boolean }[]
  productId = products.find((p) => p.isAvailable)!.id
})

afterAll(async () => {
  await cleanup()
  await sql`delete from categories where slug like 'itest-%'`
  await sql.end()
})

describe('sales report', () => {
  it('per-category revenue adds up to the revenue after discounts', async () => {
    expect((await owner('/api/admin/coupons', { method: 'POST', body: { code: 'ITEST30', type: 'percent', value: 30 } })).status).toBe(201)
    const placed = await shopper('/api/orders', {
      method: 'POST',
      body: orderBody(productId, phone(), { couponCode: 'ITEST30', items: [{ productId, quantity: 3, sugar: '', ice: '', toppings: [], note: '' }] }),
    })
    expect(placed.status).toBe(201)
    await deliver(owner, await orderIdOf(placed.data.code))

    const report = (await owner(`/api/admin/reports/sales?from=${today}&to=${today}`)).data
    const byCategory = report.categories.reduce((s: number, c: { revenue: number }) => s + c.revenue, 0)
    // Rounded per order: at most a few đồng apart
    expect(Math.abs(byCategory - report.kpis.revenue)).toBeLessThanOrEqual(report.kpis.completedOrders)
  })
})

describe('ShopeeFood entries', () => {
  const entry = (placedAt: Date) => ({
    externalCode: `ITEST-${randomInt(100000, 999999)}`,
    placedAt: placedAt.toISOString(),
    items: [{ productId, quantity: 1, toppings: [] }],
  })

  it('may be dated a few days back, not weeks', async () => {
    expect((await owner('/api/admin/orders/platform', { method: 'POST', body: entry(new Date(Date.now() - 3 * 86_400_000)) })).status).toBe(201)
    expect((await owner('/api/admin/orders/platform', { method: 'POST', body: entry(new Date(Date.now() - 10 * 86_400_000)) })).status).toBe(422)
  })
})

describe('personal coupons', () => {
  it('without a phone number, look exactly like a code that does not exist', async () => {
    const p = phone()
    await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p) })
    const customerId = (await sql`select id from customers where phone = ${p}`)[0]!.id
    const gift = await owner(`/api/admin/customers/${customerId}/coupon`, {
      method: 'POST',
      body: { type: 'fixed', value: 10000, description: 'Quà kiểm thử', minOrder: 0, validDays: 7 },
    })
    expect(gift.status).toBe(201)
    const real = await client()('/api/coupons/validate', { method: 'POST', body: { code: gift.data.code, subtotal: 100000 } })
    const fake = await client()('/api/coupons/validate', { method: 'POST', body: { code: 'ITESTNOPE', subtotal: 100000 } })
    expect(real.status).toBe(400)
    expect(real.data.message).toBe(fake.data.message)
    expect(real.data.data).toEqual(fake.data.data)
    // With the owner's phone it works
    expect((await client()('/api/coupons/validate', { method: 'POST', body: { code: gift.data.code, subtotal: 100000, phone: p } })).status).toBe(200)
  })
})

describe('public menu', () => {
  it('is served from cache, and an edit in the admin area shows at once', async () => {
    const slug = `itest-${randomInt(100000, 999999)}`
    const created = await owner('/api/admin/categories', { method: 'POST', body: { name: 'ZZ Kiểm thử', slug } })
    expect(created.status).toBe(201)
    const names = async () => ((await client()('/api/categories')).data as { slug: string; name: string }[]).find((c) => c.slug === slug)?.name
    expect(await names()).toBe('ZZ Kiểm thử')
    // Changed behind the app's back: the cached copy is still served
    await sql`update categories set name = 'ZZ Đổi ngầm' where slug = ${slug}`
    expect(await names()).toBe('ZZ Kiểm thử')
    // A query string does not make a new cache entry (each one would stay in memory)
    const viaQuery = ((await client()(`/api/categories?r=${randomInt(1e9)}`)).data as { slug: string; name: string }[]).find((c) => c.slug === slug)
    expect(viaQuery?.name).toBe('ZZ Kiểm thử')
    // Any successful admin write drops the cache
    const id = created.data.id
    expect((await owner(`/api/admin/categories/${id}`, { method: 'DELETE' })).status).toBeLessThan(300)
    expect(await names()).toBeUndefined()
  })
})

describe('open orders per phone', () => {
  it('holds when several checkouts arrive together', async () => {
    const p = phone()
    const results = await Promise.all(
      Array.from({ length: 6 }, () => client()('/api/orders', { method: 'POST', body: orderBody(productId, p) }))
    )
    expect(results.filter((r) => r.status === 201)).toHaveLength(3)
    expect(results.filter((r) => r.status === 429)).toHaveLength(3)
  })
})
