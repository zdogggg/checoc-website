import { and, count } from 'drizzle-orm'
import type { AdminCustomerListItem } from '#shared/types/customers'
import type { CustomerSegment } from '#shared/utils/loyalty'

const PAGE_SIZE = 30
const SEGMENTS: CustomerSegment[] = ['new', 'loyal', 'regular', 'at_risk', 'lost']

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const params = await getValidatedQuery(event, customerListQuery.parse)
  const db = useDb()
  const { customers } = schema
  const where = and(...customerFilters(params))
  // Segment tab counters respect the other filters
  const base = customerFilters(params, false)

  const [rows, [totalRow], ...segmentCounts] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(where)
      .orderBy(...CUSTOMER_SORT[params.sort])
      .limit(PAGE_SIZE)
      .offset((params.page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(customers).where(where),
    ...SEGMENTS.map((s) =>
      db
        .select({ n: count() })
        .from(customers)
        .where(and(...base, segmentCondition(s)))
    ),
  ])

  const items: AdminCustomerListItem[] = rows.map(toCustomerListItem)
  const counts = Object.fromEntries(SEGMENTS.map((s, i) => [s, segmentCounts[i]?.[0]?.n ?? 0])) as Record<CustomerSegment, number>
  return { items, total: totalRow?.n ?? 0, page: params.page, pageSize: PAGE_SIZE, counts }
})
