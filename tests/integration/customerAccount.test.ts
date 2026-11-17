// Customer sign-in that does not depend on SMS: adding an email from a delivered order, and
// sessions checked against the database ("sign out everywhere", erased customers).
// The code-based steps need a server that shows login codes (development without an email
// provider); against a production build without one they are skipped.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, client, deliver, orderBody, orderIdOf, ownerClient, phone, sql } from './helpers'

let owner: Awaited<ReturnType<typeof ownerClient>>
let productId: number

beforeAll(async () => {
  await cleanup()
  owner = await ownerClient()
  const products = (await client()('/api/products')).data as { id: number; isAvailable: boolean }[]
  productId = products.find((p) => p.isAvailable)!.id
})

afterAll(async () => {
  await cleanup()
  await sql`delete from otp_codes where email like 'itest-%@example.com'`
  await sql.end()
})

describe('adding an email from a delivered order', () => {
  const p = phone()
  const email = `itest-${p}@example.com`
  const shopper = client()
  let token: string

  it('is offered once the order is delivered and the customer has no email', async () => {
    const placed = await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p) })
    token = placed.data.trackingToken
    expect((await shopper(`/api/orders/${token}`)).data.canLinkEmail).toBe(false)
    await deliver(owner, await orderIdOf(placed.data.code))
    expect((await shopper(`/api/orders/${token}`)).data.canLinkEmail).toBe(true)
  })

  it('needs the phone number of the order', async () => {
    const res = await shopper(`/api/orders/${token}/link-email/code`, { method: 'POST', body: { email, phone: '0900000000' } })
    expect(res.status).toBe(400)
  })

  it('links the email and signs the customer in', async (ctx) => {
    const sent = await shopper(`/api/orders/${token}/link-email/code`, { method: 'POST', body: { email, phone: p } })
    if (!sent.data?.devCode) ctx.skip()
    const wrong = await shopper(`/api/orders/${token}/link-email/verify`, { method: 'POST', body: { email, code: sent.data.devCode === '000000' ? '111111' : '000000' } })
    expect(wrong.status).toBe(400)
    const ok = await shopper(`/api/orders/${token}/link-email/verify`, { method: 'POST', body: { email, code: sent.data.devCode } })
    expect(ok.status).toBe(200)

    const me = await shopper('/api/account/me')
    expect(me.data.account).toMatchObject({ phone: p, email })
    expect((await shopper(`/api/orders/${token}`)).data.canLinkEmail).toBe(false)
    const again = await shopper(`/api/orders/${token}/link-email/code`, { method: 'POST', body: { email: `x${email}`, phone: p } })
    expect(again.status).toBe(409)
  })

  it('signing out everywhere ends the other sessions, not this one', async (ctx) => {
    // A second device signs in with the email just linked
    const other = client()
    const sent = await other('/api/account/otp', { method: 'POST', body: { email } })
    if (!sent.data?.devCode) ctx.skip()
    expect((await other('/api/account/verify', { method: 'POST', body: { email, code: sent.data.devCode } })).status).toBe(200)
    expect((await other('/api/account/me')).data.account?.phone).toBe(p)

    expect((await shopper('/api/account/logout-all', { method: 'POST' })).status).toBe(200)
    expect((await shopper('/api/account/me')).data.account?.phone).toBe(p)
    expect((await other('/api/account/me')).data.account).toBeNull()
  })

  it('a session whose customer was erased is dropped', async (ctx) => {
    const me = await shopper('/api/account/me')
    if (!me.data.account) ctx.skip()
    const id = (await sql`select id from customers where phone = ${p}`)[0]!.id
    expect((await owner(`/api/admin/customers/${id}/erase`, { method: 'POST', body: { confirmPhone: p } })).status).toBe(200)
    expect((await shopper('/api/account/me')).data.account).toBeNull()
    expect((await shopper('/api/account/logout-all', { method: 'POST' })).status).toBe(401)
    // Erased orders lost their phone, so the usual cleanup no longer finds them
    await sql`delete from order_status_logs where order_id in (select id from orders where tracking_token = ${token})`
    await sql`delete from order_items where order_id in (select id from orders where tracking_token = ${token})`
    await sql`delete from orders where tracking_token = ${token}`
  })
})
