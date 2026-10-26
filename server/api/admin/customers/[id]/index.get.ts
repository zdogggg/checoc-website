import { desc, eq } from 'drizzle-orm'
import type { AdminCustomerDetail } from '#shared/types/customers'

export default defineEventHandler(async (event): Promise<AdminCustomerDetail> => {
  await requireStaff(event)
  const id = readId(event)
  const { customers, customerAddresses, loyaltyLedger, customerNotes, coupons } = schema
  const db = useDb()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: {
      addresses: { orderBy: desc(customerAddresses.lastUsedAt) },
      ledger: {
        orderBy: desc(loyaltyLedger.id),
        limit: 50,
        with: { order: { columns: { code: true } }, user: { columns: { name: true } } },
      },
      notes: { orderBy: desc(customerNotes.id), with: { user: { columns: { name: true } } } },
    },
  })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })

  const personalCoupons = await db.select().from(coupons).where(eq(coupons.customerId, id)).orderBy(desc(coupons.id))

  return {
    ...toCustomerListItem(customer),
    email: customer.email,
    birthday: customer.birthday,
    note: customer.note,
    createdAt: customer.createdAt.toISOString(),
    lastLoginAt: customer.lastLoginAt?.toISOString() ?? null,
    addresses: customer.addresses.map(({ id, city, district, address }) => ({ id, city, district, address })),
    orders: await loadCustomerOrders(id, 50, false),
    ledger: customer.ledger.map((l) => toLedgerView(l, true)),
    notes: customer.notes.map((n) => ({ id: n.id, content: n.content, by: n.user?.name ?? null, createdAt: n.createdAt.toISOString() })),
    coupons: personalCoupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      usedCount: c.usedCount,
      usageLimit: c.usageLimit,
      endsAt: c.endsAt?.toISOString() ?? null,
      isActive: c.isActive,
    })),
  }
})
