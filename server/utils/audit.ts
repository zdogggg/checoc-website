import type { H3Event } from 'h3'

// Never throws: losing one log line must not break the request that caused it
export async function writeAudit(
  event: H3Event,
  entry: { userId: number | null; userEmail: string; status: number },
) {
  try {
    await useDb()
      .insert(schema.auditLogs)
      .values({
        ...entry,
        method: event.method,
        path: event.path.split('?')[0]!.slice(0, 255),
        ip: (getRequestIP(event, { xForwardedFor: true }) ?? '').slice(0, 64),
      })
  } catch (error) {
    console.error('[audit] write failed', error)
  }
}
