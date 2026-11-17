// Bank transfers reported by SePay settle VietQR orders by themselves; a transfer order that is
// not paid cannot be completed without an explicit yes. Needs the server started with
// NUXT_SEPAY_WEBHOOK_KEY and the same value in TEST_SEPAY_KEY (CI sets both); skipped otherwise.
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BASE, cleanup, client, deliver, orderBody, orderIdOf, ownerClient, phone, sql } from './helpers'

const KEY = process.env.TEST_SEPAY_KEY ?? process.env.NUXT_SEPAY_WEBHOOK_KEY ?? ''

let owner: Awaited<ReturnType<typeof ownerClient>>
let productId: number
const shopper = client()

// SePay's webhook body (only the fields the shop uses)
const sepay = (body: Record<string, unknown>, key = KEY) =>
  fetch(`${BASE}/api/payments/sepay`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Apikey ${key}` },
    body: JSON.stringify({ transferType: 'in', accountNumber: '', transactionDate: '2026-11-17 10:00:00', ...body }),
  })

// A placed order switched to bank transfer (the test server may have no bank account set up,
// which hides VietQR at checkout)
async function transferOrder() {
  const placed = await shopper('/api/orders', { method: 'POST', body: orderBody(productId, phone()) })
  const id = await orderIdOf(placed.data.code)
  await sql`update orders set payment_method = 'vietqr' where id = ${id}`
  const [o] = await sql`select code, total from orders where id = ${id}`
  return { id, code: o!.code as string, total: o!.total as number }
}

const paymentOf = async (id: number) => (await sql`select payment_status from orders where id = ${id}`)[0]!.payment_status

beforeAll(async () => {
  await cleanup()
  owner = await ownerClient()
  const products = (await shopper('/api/products')).data as { id: number; isAvailable: boolean }[]
  productId = products.find((p) => p.isAvailable)!.id
})

afterAll(async () => {
  await cleanup()
  await sql.end()
})

describe('completing an unpaid transfer order', () => {
  it('needs an explicit confirmation', async () => {
    const o = await transferOrder()
    for (const status of ['confirmed', 'preparing', 'shipping']) {
      await owner(`/api/admin/orders/${o.id}/status`, { method: 'POST', body: { status } })
    }
    const refused = await owner(`/api/admin/orders/${o.id}/status`, { method: 'POST', body: { status: 'completed' } })
    expect(refused.status).toBe(409)
    expect(refused.data.data.reason).toBe('unpaid_transfer')
    const confirmed = await owner(`/api/admin/orders/${o.id}/status`, { method: 'POST', body: { status: 'completed', confirmUnpaid: true } })
    expect(confirmed.status).toBe(200)
  })
})

describe.skipIf(!KEY)('SePay webhook', () => {
  it('refuses a wrong key', async () => {
    expect((await sepay({ id: `itest-${randomUUID()}`, transferAmount: 1, content: 'x' }, 'wrong')).status).toBe(401)
  })

  it('marks the order paid once, however often the same transfer is reported', async () => {
    const o = await transferOrder()
    const id = `itest-${randomUUID()}`
    const body = { id, transferAmount: o.total, content: `MBVCB.123.${o.code}.CT tu NGUYEN VAN A` }
    const first = await sepay(body)
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ success: true })
    expect(await paymentOf(o.id)).toBe('paid')

    expect((await sepay(body)).status).toBe(200)
    const rows = await sql`select status, order_id from bank_transactions where provider_id = ${id}`
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ status: 'matched', order_id: o.id })

    // Paid: completing needs no confirmation any more
    await deliver(owner, o.id)
  })

  it('leaves the order unpaid when the amount is short', async () => {
    const o = await transferOrder()
    const id = `itest-${randomUUID()}`
    await sepay({ id, transferAmount: o.total - 1000, content: o.code })
    expect(await paymentOf(o.id)).toBe('unpaid')
    expect((await sql`select status from bank_transactions where provider_id = ${id}`)[0]!.status).toBe('amount_mismatch')
  })

  it('records transfers that match no order', async () => {
    const id = `itest-${randomUUID()}`
    await sepay({ id, transferAmount: 50000, content: 'chuyen tien an trua' })
    expect((await sql`select status, order_id from bank_transactions where provider_id = ${id}`)[0]).toMatchObject({ status: 'unmatched', order_id: null })
  })

  it('ignores money going out', async () => {
    const id = `itest-${randomUUID()}`
    expect((await sepay({ id, transferType: 'out', transferAmount: 50000, content: 'tra tien hang' })).status).toBe(200)
    expect(await sql`select 1 from bank_transactions where provider_id = ${id}`).toHaveLength(0)
  })
})
