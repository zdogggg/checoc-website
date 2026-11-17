// Things a stranger who knows a customer's phone number must not be able to do, the OTP attempt
// limit under parallel guesses, refunds that skip the refund flow, and uploaded photo processing.
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
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

describe('an order seen by someone else than who placed it', () => {
  const p = phone()
  const shopper = client()
  const stranger = client()
  let code: string
  let token: string

  beforeAll(async () => {
    const placed = await shopper('/api/orders', { method: 'POST', body: orderBody(productId, p, { fullName: 'Nguyễn Văn Anh' }) })
    code = placed.data.code
    token = placed.data.trackingToken
    await deliver(owner, await orderIdOf(code))
  })

  it('the browser that ordered sees everything', async () => {
    const mine = (await shopper(`/api/orders/${token}`)).data
    expect(mine).toMatchObject({ customerName: 'Nguyễn Văn Anh', address: '1 Đường Kiểm Thử', masked: false, canLinkEmail: true })
  })

  it('a looked-up link hides name and address and cannot add an email', async () => {
    const found = await stranger('/api/orders/lookup', { method: 'POST', body: { code, phone: p } })
    expect(found.data.trackingToken).toBe(token)
    const seen = (await stranger(`/api/orders/${token}`)).data
    expect(seen).toMatchObject({ customerName: 'N. V. Anh', address: '1***', masked: true, canLinkEmail: false })
    const res = await stranger(`/api/orders/${token}/link-email/code`, { method: 'POST', body: { email: `itest-x${p}@example.com`, phone: p } })
    expect(res.status).toBe(403)
  })

  it('after a month, even the browser that ordered sees the masked view', async () => {
    await sql`update orders set created_at = now() - interval '31 days' where tracking_token = ${token}`
    expect((await shopper(`/api/orders/${token}`)).data.masked).toBe(true)
    await sql`update orders set created_at = now() where tracking_token = ${token}`
  })

  it('wrong guesses for one phone lock the lookup, whatever the code', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await stranger('/api/orders/lookup', { method: 'POST', body: { code: `CC9${i}9999`, phone: p } })).status).toBe(404)
    }
    expect((await stranger('/api/orders/lookup', { method: 'POST', body: { code, phone: p } })).status).toBe(429)
  })

  it('compares at most 5 codes even when guesses arrive together', async (ctx) => {
    const email = `itest-${p}@example.com`
    const sent = await shopper(`/api/orders/${token}/link-email/code`, { method: 'POST', body: { email, phone: p } })
    if (!sent.data?.devCode) ctx.skip()
    const right = Number(sent.data.devCode)
    const guesses = Array.from({ length: 10 }, (_, i) => String((right + 1 + i) % 1_000_000).padStart(6, '0'))
    const results = await Promise.all(
      guesses.map((c) => shopper(`/api/orders/${token}/link-email/verify`, { method: 'POST', body: { email, code: c } }))
    )
    expect(results.filter((r) => r.status === 400)).toHaveLength(5)
    expect(results.filter((r) => r.status === 429)).toHaveLength(5)
    // Out of attempts: even the right code no longer works
    const late = await shopper(`/api/orders/${token}/link-email/verify`, { method: 'POST', body: { email, code: sent.data.devCode } })
    expect(late.status).toBe(429)
  })
})

describe('payment marked refunded', () => {
  it('is refused on an order that is still counted as sold', async () => {
    const placed = await client()('/api/orders', { method: 'POST', body: orderBody(productId, phone()) })
    const id = await orderIdOf(placed.data.code)
    await deliver(owner, id)
    const res = await owner(`/api/admin/orders/${id}/payment`, { method: 'POST', body: { paymentStatus: 'refunded' } })
    expect(res.status).toBe(409)
  })

  it('is allowed once a paid order is cancelled', async () => {
    const placed = await client()('/api/orders', { method: 'POST', body: orderBody(productId, phone()) })
    const id = await orderIdOf(placed.data.code)
    expect((await owner(`/api/admin/orders/${id}/payment`, { method: 'POST', body: { paymentStatus: 'paid' } })).status).toBe(200)
    expect((await owner(`/api/admin/orders/${id}/status`, { method: 'POST', body: { status: 'cancelled', note: 'Khách huỷ' } })).status).toBe(200)
    const res = await owner(`/api/admin/orders/${id}/payment`, { method: 'POST', body: { paymentStatus: 'refunded' } })
    expect(res.status).toBe(200)
    expect(res.data.paymentStatus).toBe('refunded')
  })
})

describe('uploaded photos', () => {
  it('are shrunk and stored as WebP without metadata', async () => {
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#d9a441' } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Make: 'ITEST' } } })
      .toBuffer()
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(big)], { type: 'image/jpeg' }), 'photo.jpg')
    const res = await owner('/api/admin/uploads', { method: 'POST', body: form })
    expect(res.status).toBe(200)
    expect(res.data.url).toMatch(/^\/uploads\/[\w-]+\.webp$/)

    const served = await fetch(new URL(res.data.url, process.env.TEST_BASE_URL ?? 'http://localhost:3000'))
    expect(served.headers.get('content-type')).toBe('image/webp')
    const meta = await sharp(Buffer.from(await served.arrayBuffer())).metadata()
    expect(meta).toMatchObject({ format: 'webp', width: 1600, height: 1067 })
    expect(meta.exif).toBeUndefined()

    // Smaller copies for cards and thumbnails, made on first request
    const base = res.data.url.split('/').pop().replace('.webp', '')
    const small = await fetch(new URL(`/uploads/${base}-w400.webp`, process.env.TEST_BASE_URL ?? 'http://localhost:3000'))
    expect(small.status).toBe(200)
    expect(await sharp(Buffer.from(await small.arrayBuffer())).metadata()).toMatchObject({ format: 'webp', width: 400 })
    // Only the listed widths, only of photos that exist
    expect((await client()(`/uploads/${base}-w999.webp`)).status).toBe(404)
    expect((await client()(`/uploads/00000000-0000-0000-0000-000000000000-w400.webp`)).status).toBe(404)

    // Only removable when the tests share the server's disk (dev container); CI starts fresh anyway
    for (const name of [`${base}.webp`, `${base}-w400.webp`]) {
      await unlink(join(process.cwd(), '.data', 'uploads', name)).catch(() => {})
    }
  })

  it('refuses a file that is not an image', async () => {
    const form = new FormData()
    form.append('file', new Blob(['<svg onload="alert(1)"/>'], { type: 'image/jpeg' }), 'x.jpg')
    expect((await owner('/api/admin/uploads', { method: 'POST', body: form })).status).toBe(415)
  })
})
