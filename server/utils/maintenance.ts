import { and, eq, gt, lt, max, sql } from 'drizzle-orm'

// Housekeeping run a few times a day by server/plugins/maintenance.ts.

const OTP_KEEP_DAYS = 1
export const AUDIT_KEEP_DAYS = 365

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)

export async function expireInactivePoints(): Promise<number> {
  const db = useDb()
  const { customers, loyaltyLedger } = schema
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - POINTS_EXPIRE_AFTER_MONTHS)

  const lastCredit = db
    .select({ customerId: loyaltyLedger.customerId, at: max(loyaltyLedger.createdAt).as('at') })
    .from(loyaltyLedger)
    .where(gt(loyaltyLedger.delta, 0))
    .groupBy(loyaltyLedger.customerId)
    .as('last_credit')
  const due = await db
    .select({ id: customers.id })
    .from(customers)
    .innerJoin(lastCredit, eq(lastCredit.customerId, customers.id))
    // The aggregate column has no column type to convert a Date with, hence the explicit cast
    .where(and(gt(customers.points, 0), sql`${lastCredit.at} < ${cutoff.toISOString()}::timestamptz`))

  let expired = 0
  for (const { id } of due) {
    await db.transaction(async (tx) => {
      const [c] = await tx.select({ points: customers.points }).from(customers).where(eq(customers.id, id)).for('update')
      if (!c || c.points <= 0) return
      await adjustPoints(tx, id, -c.points, 'expired', {
        note: `Hết hạn sau ${POINTS_EXPIRE_AFTER_MONTHS} tháng không tích thêm điểm`,
      })
      expired++
    })
  }
  return expired
}

// Login codes are useless after 5 minutes, rate-limit windows after their window (at most
// an hour here); the audit trail is kept for a year
export async function pruneOldRows(): Promise<{ otp: number; audit: number }> {
  const db = useDb()
  const { otpCodes, auditLogs, rateLimits } = schema
  await db.delete(rateLimits).where(lt(rateLimits.windowStart, daysAgo(1)))
  const otp = await db.delete(otpCodes).where(lt(otpCodes.createdAt, daysAgo(OTP_KEEP_DAYS))).returning({ id: otpCodes.id })
  const audit = await db.delete(auditLogs).where(lt(auditLogs.createdAt, daysAgo(AUDIT_KEEP_DAYS))).returning({ id: auditLogs.id })
  return { otp: otp.length, audit: audit.length }
}

// Only one server process does the work when several run (advisory lock held by this session
// for the duration of the transaction). Returns false when another process holds it.
export async function runMaintenance(): Promise<boolean> {
  return useDb().transaction(async (tx) => {
    const [lock] = await tx.execute<{ ok: boolean }>(sql`select pg_try_advisory_xact_lock(4242001) as ok`)
    if (!lock?.ok) return false
    const expired = await expireInactivePoints()
    const pruned = await pruneOldRows()
    if (expired || pruned.otp || pruned.audit) {
      console.log(`[maintenance] points expired for ${expired} customer(s), removed ${pruned.otp} old codes and ${pruned.audit} old audit entries`)
    }
    return true
  })
}
