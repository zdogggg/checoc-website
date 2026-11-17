// Malformed input gets a 4xx, never a server error (each 5xx also sends the shop an alert)
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, client, orderBody, ownerClient, phone, sql } from './helpers'

let owner: Awaited<ReturnType<typeof ownerClient>>
let productId: number
const visitor = client()

beforeAll(async () => {
  await cleanup()
  owner = await ownerClient()
  const products = (await visitor('/api/products')).data as { id: number; isAvailable: boolean }[]
  productId = products.find((p) => p.isAvailable)!.id
})

afterAll(async () => {
  await cleanup()
  await sql.end()
})

describe('a NUL character', () => {
  it('in the path or query is refused', async () => {
    for (const path of ['/api/products/%00', '/api/orders/%00', '/products/%00', '/orders/%00', '/api/admin/orders?q=%00']) {
      expect((await visitor(path)).status, path).toBe(400)
    }
  })

  it('in a form is a validation error', async () => {
    const order = await visitor('/api/orders', { method: 'POST', body: orderBody(productId, phone(), { fullName: 'a\u0000b' }) })
    expect(order.status).toBe(422)
    expect(order.data.data.issues[0].path).toBe('fullName')
    expect((await visitor('/api/coupons/validate', { method: 'POST', body: { code: 'A\u0000', subtotal: 1000 } })).status).toBe(422)
    expect((await visitor('/api/orders/lookup', { method: 'POST', body: { code: 'CC\u00001', phone: phone() } })).status).toBe(422)
  })
})

describe('admin parameters', () => {
  it('a day or month that does not exist is a 400', async () => {
    expect((await owner('/api/admin/orders?day=2026-13-45')).status).toBe(400)
    expect((await owner('/api/admin/orders?day=2026-02-30')).status).toBe(400)
    expect((await owner('/api/admin/expenses?month=2026-13')).status).toBe(400)
    expect((await owner('/api/admin/expenses', { method: 'POST', body: { category: 'other', amount: 1000, spentOn: '2026-02-31' } })).status).toBe(422)
  })

  it('an amount too large for the database is a validation error', async () => {
    expect((await owner('/api/admin/expenses', { method: 'POST', body: { category: 'other', amount: 1e15, spentOn: '2026-02-01' } })).status).toBe(422)
    const purchase = await owner('/api/admin/purchases', { method: 'POST', body: { items: [{ ingredientId: 1, quantity: 1e9, unitCost: 1e9 }] } })
    expect(purchase.status).toBe(422)
  })

  it('an id beyond what the database can hold is a 400', async () => {
    for (const path of ['/api/admin/orders/99999999999', '/api/admin/customers/2147483648', '/api/admin/products/99999999999']) {
      expect((await owner(path)).status, path).toBe(400)
    }
  })
})
