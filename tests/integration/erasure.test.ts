// Erasing a customer on request: the person disappears, the orders (and so the revenue) stay.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, client, deliver, orderBody, orderIdOf, ownerClient, phone, sql } from './helpers'

let owner: Awaited<ReturnType<typeof ownerClient>>
let productId: number
const shopper = client()

beforeAll(async () => {
  await cleanup()
  owner = await ownerClient()
  const products = (await shopper('/api/products')).data as { id: number; isAvailable: boolean }[]
  productId = products.find((p) => p.isAvailable)!.id
})

afterAll(async () => {
  await cleanup()
  // Erased orders no longer carry the test phone prefix; they are found by their blanked name
  await sql`delete from order_status_logs where order_id in (select id from orders where customer_name = 'Khách đã xoá' and note = '' and address = '(đã xoá)' and created_at > now() - interval '1 hour')`
  await sql`delete from order_items where order_id in (select id from orders where customer_name = 'Khách đã xoá' and address = '(đã xoá)' and created_at > now() - interval '1 hour')`
  await sql`delete from orders where customer_name = 'Khách đã xoá' and address = '(đã xoá)' and created_at > now() - interval '1 hour'`
  await sql.end()
})

describe('erasing a customer', () => {
  const p = phone()
  let customerId: number
  let orderId: number

  it('is refused while the customer has an order in progress', async () => {
    const placed = await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p, { email: 'xoa-thu@example.com', note: 'Gọi trước khi tới' }) })
    expect(placed.status).toBe(201)
    orderId = await orderIdOf(placed.data.code)
    customerId = (await sql`select id from customers where phone = ${p}`)[0]!.id

    const res = await owner(`/api/admin/customers/${customerId}/erase`, { method: 'POST', body: { confirmPhone: p } })
    expect(res.status).toBe(409)
  })

  it('needs the phone number typed again', async () => {
    await deliver(owner, orderId)
    const res = await owner(`/api/admin/customers/${customerId}/erase`, { method: 'POST', body: { confirmPhone: '0900000000' } })
    expect(res.status).toBe(400)
  })

  it('deletes the customer and blanks their orders, keeping the amounts', async () => {
    const [before] = await sql`select total, subtotal, status from orders where id = ${orderId}`
    const res = await owner(`/api/admin/customers/${customerId}/erase`, { method: 'POST', body: { confirmPhone: p } })
    expect(res.status).toBe(200)
    expect(res.data.orders).toBe(1)

    expect(await sql`select 1 from customers where id = ${customerId}`).toHaveLength(0)
    expect(await sql`select 1 from loyalty_ledger where customer_id = ${customerId}`).toHaveLength(0)
    expect(await sql`select 1 from customer_addresses where customer_id = ${customerId}`).toHaveLength(0)
    const [order] = await sql`select customer_name, customer_phone, customer_email, address, note, total, subtotal, status, customer_id from orders where id = ${orderId}`
    expect(order).toMatchObject({
      customer_name: 'Khách đã xoá',
      customer_phone: '',
      customer_email: null,
      address: '(đã xoá)',
      note: '',
      customer_id: null,
      total: before!.total,
      subtotal: before!.subtotal,
      status: before!.status,
    })
  })

  it('is for the owner only', async () => {
    // A customer-facing client has no staff session at all
    const res = await shopper(`/api/admin/customers/1/erase`, { method: 'POST', body: { confirmPhone: '0' } })
    expect(res.status).toBe(401)
  })
})
