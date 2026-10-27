import { desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ExpenseView, MonthlyPnl } from '#shared/types/inventory'

const query = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
})

// Expenses of a month plus the month's profit and loss
export default defineEventHandler(async (event): Promise<{ items: ExpenseView[]; pnl: MonthlyPnl }> => {
  await requireStaff(event, CATALOG_EDITORS)
  const month = (await getValidatedQuery(event, query.parse)).month ?? currentShopMonth()
  const { expenses } = schema
  const rows = await useDb().query.expenses.findMany({
    where: sql`to_char(${expenses.spentOn}, 'YYYY-MM') = ${month}`,
    orderBy: [desc(expenses.spentOn), desc(expenses.id)],
    with: { creator: { columns: { name: true } } },
  })
  return {
    items: rows.map((e) => ({
      id: e.id,
      category: e.category,
      amount: e.amount,
      spentOn: e.spentOn,
      note: e.note,
      createdBy: e.creator?.name ?? null,
    })),
    pnl: await monthlyPnl(month),
  }
})
