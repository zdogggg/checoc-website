import type { H3Event } from 'h3'
import { desc, eq } from 'drizzle-orm'
import type { CustomerAccount, CustomerOrderSummary } from '#shared/types/customers'

// The shopper signed in by SMS code; 401 otherwise
export async function requireCustomer(event: H3Event) {
  const session = await getUserSession(event)
  if (!session.customer) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Vui lòng đăng nhập' })
  }
  return session.customer
}

export async function loadCustomerOrders(customerId: number, limit: number, withToken: boolean): Promise<CustomerOrderSummary[]> {
  const { orders } = schema
  const rows = await useDb().query.orders.findMany({
    where: eq(orders.customerId, customerId),
    orderBy: desc(orders.createdAt),
    limit,
    with: { items: { columns: { quantity: true } } },
  })
  return rows.map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    total: o.total,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    createdAt: o.createdAt.toISOString(),
    ...(withToken ? { trackingToken: o.trackingToken } : {}),
  }))
}

export async function loadAccount(customerId: number): Promise<CustomerAccount | null> {
  const { customers, customerAddresses, loyaltyLedger } = schema
  const customer = await useDb().query.customers.findFirst({
    where: eq(customers.id, customerId),
    with: {
      addresses: { orderBy: desc(customerAddresses.lastUsedAt), limit: 10 },
      ledger: { orderBy: desc(loyaltyLedger.id), limit: 30, with: { order: { columns: { code: true } } } },
    },
  })
  if (!customer) return null
  return {
    phone: customer.phone,
    name: customer.name,
    email: customer.email,
    birthday: customer.birthday,
    tier: customer.tier,
    points: customer.points,
    totalSpent: customer.totalSpent,
    completedOrders: customer.completedOrders,
    addresses: customer.addresses.map(({ id, city, district, address }) => ({ id, city, district, address })),
    orders: await loadCustomerOrders(customer.id, 20, true),
    ledger: customer.ledger.map((l) => toLedgerView(l)),
  }
}
