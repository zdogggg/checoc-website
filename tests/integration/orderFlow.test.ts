// The order life cycle through the real API and database: checkout -> delivery (stock, cost,
// points, spend) -> refund, plus the protections around checkout.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, client, deliver, orderBody, orderIdOf, ownerClient, phone, sql } from './helpers'

const RECIPE_GRAMS = 20
const UNIT_COST = 10 // đ per gram

let owner: Awaited<ReturnType<typeof ownerClient>>
let productId: number
let price: number
let ingredientId: number
const shopper = client()

const stockOf = async () => Number((await sql`select stock from ingredients where id = ${ingredientId}`)[0]!.stock)
const customerOf = async (p: string) =>
  (await sql`select id, name, total_spent, completed_orders, points from customers where phone = ${p}`)[0]

beforeAll(async () => {
  await cleanup()
  owner = await ownerClient()
  const products = (await shopper('/api/products')).data as { id: number; price: number; isAvailable: boolean }[]
  const product = products.find((p) => p.isAvailable)
  if (!product) throw new Error('No available product: seed the database first (npm run db:seed)')
  productId = product.id
  price = product.price
  // A test ingredient in this product's recipe, so stock and cost can be followed exactly
  const [ing] = await sql`insert into ingredients (name, unit, stock, min_stock, avg_cost) values ('ZZ-IT Đường', 'g', 1000, 0, ${UNIT_COST}) returning id`
  ingredientId = ing!.id
  await sql`insert into product_ingredients (product_id, ingredient_id, quantity) values (${productId}, ${ingredientId}, ${RECIPE_GRAMS})`
})

afterAll(async () => {
  await cleanup()
  await sql.end()
})

describe('checkout', () => {
  it('places an order priced by the server, and a retried request does not place it twice', async () => {
    const body = orderBody(productId, phone(), { items: [{ productId, quantity: 2, sugar: '', ice: '', toppings: [], note: '' }] })
    const first = await shopper('/api/orders', { method: 'POST', body })
    expect(first.status).toBe(201)
    expect(first.data.total).toBe(price * 2 + (await sql`select shipping_fee from orders where code = ${first.data.code}`)[0]!.shipping_fee)

    const again = await shopper('/api/orders', { method: 'POST', body })
    expect(again.status).toBe(200)
    expect(again.data.code).toBe(first.data.code)
    const [{ n }] = await sql`select count(*)::int as n from orders where customer_phone = ${body.phone}`
    expect(n).toBe(1)
  })

  it('refuses a fourth open order on the same phone', async () => {
    const p = phone()
    for (let i = 0; i < 3; i++) expect((await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p) })).status).toBe(201)
    const fourth = await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p) })
    expect(fourth.status).toBe(429)
  })

  it('does not let a guest rename an existing customer', async () => {
    const p = phone()
    await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p, { fullName: 'Chủ Số' }) })
    await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p, { fullName: 'Người Lạ' }) })
    expect((await customerOf(p))!.name).toBe('Chủ Số')
  })

  it('lets a phone use a coupon only once by default', async () => {
    const created = await owner('/api/admin/coupons', { method: 'POST', body: { code: 'ITEST10', type: 'percent', value: 10 } })
    expect(created.status).toBe(201)
    const p = phone()
    expect((await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p, { couponCode: 'ITEST10' }) })).status).toBe(201)
    const second = await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p, { couponCode: 'ITEST10' }) })
    expect(second.status).toBe(400)
  })
})

describe('delivery and refund', () => {
  const p = phone()
  let orderId: number
  let goods: number

  it('completing an order takes stock out, stores its cost and credits the customer', async () => {
    const placed = await shopper('/api/orders', {
      method: 'POST',
      body: orderBody(productId, p, { items: [{ productId, quantity: 3, sugar: '', ice: '', toppings: [], note: '' }] }),
    })
    expect(placed.status).toBe(201)
    orderId = await orderIdOf(placed.data.code)
    const before = await stockOf()
    await deliver(owner, orderId)

    expect(before - (await stockOf())).toBeCloseTo(3 * RECIPE_GRAMS)
    const [order] = await sql`select cogs, points_earned, subtotal - discount - points_discount as goods, shipping_fee from orders where id = ${orderId}`
    goods = Number(order!.goods)
    expect(order!.cogs).toBeGreaterThanOrEqual(3 * RECIPE_GRAMS * UNIT_COST)
    expect(order!.points_earned).toBe(Math.floor(goods / 1000))

    const customer = await customerOf(p)
    // Spend counts goods only, never shipping
    expect(customer!.total_spent).toBe(goods)
    expect(customer!.completed_orders).toBe(1)
    expect(customer!.points).toBe(order!.points_earned)
  })

  it('refunding it reverses the customer and writes the ingredients off as a loss', async () => {
    const stockBefore = await stockOf()
    const res = await owner(`/api/admin/orders/${orderId}/refund`, { method: 'POST', body: { reason: 'Kiểm thử', restock: false } })
    expect(res.status).toBe(200)
    expect(res.data.status).toBe('cancelled')
    expect(res.data.refundedAt).toBeTruthy()

    const customer = await customerOf(p)
    expect(customer).toMatchObject({ total_spent: 0, completed_orders: 0, points: 0 })
    // Stock unchanged: put back, then thrown away
    expect(await stockOf()).toBeCloseTo(stockBefore)
    const [waste] = await sql`select coalesce(sum(quantity), 0)::float as q from stock_movements where order_id = ${orderId} and type = 'waste' and ingredient_id = ${ingredientId}`
    expect(waste!.q).toBeCloseTo(-3 * RECIPE_GRAMS)

    const again = await owner(`/api/admin/orders/${orderId}/refund`, { method: 'POST', body: { reason: 'lần hai', restock: false } })
    expect(again.status).toBe(409)
  })
})
