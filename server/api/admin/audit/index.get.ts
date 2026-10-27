import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

const query = z.object({
  page: z.coerce.number().int().min(1).default(1),
  userId: z.coerce.number().int().positive().optional(),
})
const PAGE_SIZE = 50

export default defineEventHandler(async (event) => {
  await requireStaff(event, OWNERS)
  const { page, userId } = await getValidatedQuery(event, query.parse)
  const { auditLogs } = schema
  const where = userId ? eq(auditLogs.userId, userId) : undefined
  const db = useDb()
  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(auditLogs).where(where),
  ])
  return {
    total: total!.n,
    pageSize: PAGE_SIZE,
    items: rows.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      userEmail: r.userEmail,
      action: describeAudit(r.method, r.path, r.status),
      ok: r.status < 400,
      status: r.status,
      ip: r.ip,
    })),
  }
})
