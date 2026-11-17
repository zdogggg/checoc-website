import type { H3Event } from 'h3'
import type { z } from 'zod'

// Path of the first string containing a NUL character, if any. PostgreSQL refuses NUL in text,
// so such a value would fail the query (500) instead of the validation (422).
export function nulPath(value: unknown, path: string[] = []): string | null {
  if (typeof value === 'string') return value.includes('\u0000') ? path.join('.') : null
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      const found = nulPath(v, [...path, key])
      if (found != null) return found
    }
  }
  return null
}

// Parse a request body with a zod schema; respond 422 with field errors on failure
export async function readValidated<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> {
  const body = await readBody(event)
  const bad = nulPath(body)
  if (bad != null) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: { issues: [{ path: bad, message: 'Có ký tự không hợp lệ' }] },
    })
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: { issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    })
  }
  return result.data
}

// Ids are PostgreSQL integers: anything above 2^31 - 1 cannot exist (and would fail the query)
const MAX_ID = 2_147_483_647

export function readId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0 || id > MAX_ID) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }
  return id
}

// Postgres unique_violation -> 409 with a readable message
export function rethrowUnique(error: unknown, message: string): never {
  const cause = (error as { cause?: { code?: string } })?.cause
  if ((error as { code?: string })?.code === '23505' || cause?.code === '23505') {
    throw createError({ statusCode: 409, statusMessage: 'Conflict', message })
  }
  throw error
}
