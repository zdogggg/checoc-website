// ShopeeFood orders entered by staff: one live entry per app code, and voiding a mistaken
// entry frees the code so the order can be entered again.
import { randomInt } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, client, ownerClient, sql } from './helpers'

let owner: Awaited<ReturnType<typeof ownerClient>>
let productId: number
const code = `ITEST-${randomInt(100000, 999999)}`
const entry = () => ({ externalCode: code, items: [{ productId, quantity: 1, toppings: [] }], feePercent: 20 })

beforeAll(async () => {
  await cleanup()
  owner = await ownerClient()
  const products = (await client()('/api/products')).data as { id: number; isAvailable: boolean }[]
  productId = products.find((p) => p.isAvailable)!.id
})

afterAll(async () => {
  await cleanup()
  await sql.end()
})

describe('ShopeeFood entries', () => {
  it('refuses the same app code twice', async () => {
    expect((await owner('/api/admin/orders/platform', { method: 'POST', body: entry() })).status).toBe(201)
    const twice = await owner('/api/admin/orders/platform', { method: 'POST', body: entry() })
    expect(twice.status).toBe(409)
  })

  it('accepts the code again once the mistaken entry is voided', async () => {
    const [first] = await sql`select id from orders where external_code = ${code} and status <> 'cancelled'`
    const voided = await owner(`/api/admin/orders/${first!.id}/void`, { method: 'POST', body: { reason: 'Nhập nhầm số lượng' } })
    expect(voided.status).toBe(200)

    const again = await owner('/api/admin/orders/platform', { method: 'POST', body: entry() })
    expect(again.status).toBe(201)
    const rows = await sql`select status from orders where external_code = ${code} order by id`
    expect(rows.map((r) => r.status)).toEqual(['cancelled', 'completed'])
  })
})
