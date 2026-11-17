import type { H3Event } from 'h3'
import { desc, eq } from 'drizzle-orm'
import type { CustomerAccount, CustomerOrderSummary } from '#shared/types/customers'

// The signed-in shopper, checked against the database: a session whose customer was erased,
// whose phone changed, or that started before "sign out everywhere" is dropped. null if none.
export async function currentCustomer(event: H3Event): Promise<{ id: number; phone: string } | null> {
  const session = await getUserSession(event)
  const signedIn = session.customer
  if (!signedIn) return null
  const row = await useDb().query.customers.findFirst({
    where: eq(schema.customers.id, signedIn.id),
    columns: { id: true, phone: true, sessionsValidAfter: true },
  })
  const since = signedIn.since ?? 0
  const valid =
    row &&
    row.phone === signedIn.phone &&
    Date.now() - since <= CUSTOMER_SESSION_DAYS * 86_400_000 &&
    (!row.sessionsValidAfter || since >= row.sessionsValidAfter.getTime())
  if (!valid) {
    await endCustomerSession(event)
    return null
  }
  return { id: row.id, phone: row.phone }
}

// 401 when nobody valid is signed in
export async function requireCustomer(event: H3Event) {
  const customer = await currentCustomer(event)
  if (!customer) throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Vui lòng đăng nhập' })
  return customer
}

// Start a shopper session (keeps a staff session in the same browser)
export async function startCustomerSession(event: H3Event, customer: { id: number; phone: string }, since = Date.now()) {
  await setUserSession(event, { customer: { id: customer.id, phone: customer.phone, since } })
}

// Drop only the shopper part of the session
export async function endCustomerSession(event: H3Event) {
  const session = await getUserSession(event)
  if (session.user) {
    const { customer: _customer, ...rest } = session
    await replaceUserSession(event, rest)
  } else {
    await clearUserSession(event)
  }
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

// The customer behind a delivered website order who has no sign-in email yet
// (see server/api/orders/[token]/link-email). Only the browser that placed the order may do
// this: the tracking link can be looked up by anyone who knows the phone number and order code.
// Any other case answers 403/404/409.
export async function linkableCustomer(event: H3Event, trackingToken: string) {
  const { orders, customers } = schema
  const order = await useDb().query.orders.findFirst({
    where: eq(orders.trackingToken, trackingToken),
    columns: { status: true, channel: true, customerId: true, deviceHash: true, createdAt: true },
  })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  if (!order.deviceHash || !(await isOrderOwner(event, { deviceHash: order.deviceHash, customerId: null, createdAt: order.createdAt }))) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Chỉ thêm được email trên trình duyệt đã đặt đơn này. Bạn có thể nhờ quán thêm email giúp.',
    })
  }
  const customer =
    order.customerId != null
      ? await useDb().query.customers.findFirst({ where: eq(customers.id, order.customerId), columns: { id: true, phone: true, email: true } })
      : null
  if (order.status !== 'completed' || order.channel !== 'website' || !customer || customer.email) {
    throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Đơn này không dùng để thêm email được' })
  }
  return { id: customer.id, phone: customer.phone }
}
