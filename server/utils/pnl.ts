import { and, count, eq, sql, sum } from 'drizzle-orm'
import type { MonthlyPnl } from '#shared/types/inventory'
import type { ExpenseCategory } from '#shared/utils/inventory'

// Profit and loss for a month (YYYY-MM), shop time.
// Revenue = goods of completed orders (subtotal - discounts, shipping excluded), by order date.
export async function monthlyPnl(month: string): Promise<MonthlyPnl> {
  const db = useDb()
  const { orders, expenses } = schema
  const orderMonth = sql`to_char(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM')`
  const goods = sql`${orders.subtotal} - ${orders.discount} - ${orders.pointsDiscount}`

  const [[sales], [noCost], byCategory] = await Promise.all([
    db
      .select({
        revenue: sum(goods).mapWith(Number),
        cogs: sum(orders.cogs).mapWith(Number),
        fees: sum(orders.platformFee).mapWith(Number),
      })
      .from(orders)
      .where(and(eq(orders.status, 'completed'), sql`${orderMonth} = ${month}`)),
    db
      .select({ n: count() })
      .from(orders)
      .where(and(eq(orders.status, 'completed'), eq(orders.cogs, 0), sql`${orderMonth} = ${month}`)),
    db
      .select({ category: expenses.category, total: sum(expenses.amount).mapWith(Number) })
      .from(expenses)
      .where(sql`to_char(${expenses.spentOn}, 'YYYY-MM') = ${month}`)
      .groupBy(expenses.category),
  ])

  const revenue = sales?.revenue ?? 0
  const cogs = sales?.cogs ?? 0
  const platformFees = sales?.fees ?? 0
  const expenseTotal = byCategory.reduce((s, r) => s + (r.total ?? 0), 0)
  return {
    month,
    revenue,
    cogs,
    grossProfit: revenue - cogs,
    platformFees,
    expenses: expenseTotal,
    netProfit: revenue - cogs - platformFees - expenseTotal,
    expensesByCategory: Object.fromEntries(byCategory.map((r) => [r.category, r.total ?? 0])) as Partial<
      Record<ExpenseCategory, number>
    >,
    ordersWithoutCost: noCost?.n ?? 0,
  }
}

export const currentShopMonth = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit' }).format(new Date())
