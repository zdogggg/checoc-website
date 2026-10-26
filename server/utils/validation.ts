import type { H3Event } from 'h3'
import type { z } from 'zod'

// Parse a request body with a zod schema; respond 422 with field errors on failure
export async function readValidated<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> {
  const body = await readBody(event)
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

export function readId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
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
