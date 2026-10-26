import type { z } from 'zod'

interface ApiErrorBody {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: { issues?: { path: string; message: string }[] }
}

const bodyOf = (error: unknown): ApiErrorBody | undefined => (error as { data?: ApiErrorBody })?.data

export function apiStatus(error: unknown): number | undefined {
  return bodyOf(error)?.statusCode ?? (error as { statusCode?: number })?.statusCode
}

// Human-readable message from a failed $fetch call
export function apiErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại'): string {
  const body = bodyOf(error)
  if (body?.data?.issues?.length) return body.data.issues[0]!.message
  if (body?.message && body.message !== body.statusMessage) return body.message
  return fallback
}

export type FieldErrors = Record<string, string>

// Field errors from a 422 response, keyed by dotted path ("nutrition.calories")
export function apiFieldErrors(error: unknown): FieldErrors {
  const issues = bodyOf(error)?.data?.issues ?? []
  return Object.fromEntries(issues.map((i) => [i.path, i.message]))
}

// Run a shared zod schema on the client so forms show the same errors as the API
export function validateForm<T extends z.ZodType>(
  schema: T,
  value: unknown
): { data: z.output<T>; errors: null } | { data: null; errors: FieldErrors } {
  const result = schema.safeParse(value)
  if (result.success) return { data: result.data, errors: null }
  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.')
    errors[key] ??= issue.message
  }
  return { data: null, errors }
}
