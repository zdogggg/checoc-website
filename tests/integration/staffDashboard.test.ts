// The dashboard shows money only to the roles that see the reports (owner, manager);
// staff get the order counts.
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { client, ownerClient, sql } from './helpers'

const email = `itest-staff-${randomBytes(4).toString('hex')}@example.com`
const password = randomBytes(18).toString('base64url')
let owner: Awaited<ReturnType<typeof ownerClient>>
const staff = client()

beforeAll(async () => {
  owner = await ownerClient()
  const created = await owner('/api/admin/users', { method: 'POST', body: { email, password, name: 'Nhân viên kiểm thử', role: 'staff' } })
  expect(created.status).toBe(201)
  expect((await staff('/api/auth/login', { method: 'POST', body: { email, password } })).status).toBe(200)
})

afterAll(async () => {
  await sql`delete from users where email = ${email}`
  await sql.end()
})

describe('dashboard numbers by role', () => {
  it('owners see revenue', async () => {
    const res = await owner('/api/admin/stats')
    expect(res.status).toBe(200)
    expect(typeof res.data.todayRevenue).toBe('number')
  })

  it('staff see order counts, not money', async () => {
    const res = await staff('/api/admin/stats')
    expect(res.status).toBe(200)
    expect(res.data.todayRevenue).toBeNull()
    expect(typeof res.data.todayOrders).toBe('number')
    for (const day of res.data.last7Days) expect(day.revenue).toBeNull()
    expect((await staff('/api/admin/reports/sales')).status).toBe(403)
  })
})
