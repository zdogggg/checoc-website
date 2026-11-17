// Text for the Telegram alert about a server error. Pure, unit-tested.
// The alert leaves the server, so it must not carry customer data: a failed database query's
// message includes the whole SQL with its parameters (names, phones, addresses), and other
// messages can quote what a customer typed.

interface DbCause {
  code?: string
  constraint_name?: string
  table_name?: string
  column_name?: string
}

type ErrorLike = { name?: string; message?: string; cause?: unknown }

const EMAIL = /[^\s@"'<>]+@[^\s@"'<>]+\.[a-z]{2,}/gi
// Vietnamese mobile numbers, with or without +84 and spaces/dots
const PHONE = /(?:\+?84|0)(?:[\s.-]?\d){9}\b/g

export function redactPersonalData(text: string): string {
  return text.replace(EMAIL, '[email]').replace(PHONE, '[sđt]')
}

// Tracking links and other long random ids in a path are secrets of their own
export const redactPath = (path: string) => path.replace(/[A-Za-z0-9_-]{20,}/g, '[mã]')

// Nitro wraps the thrown error (H3Error -> query error -> PostgreSQL error): look through the chain
function causes(error: ErrorLike): ErrorLike[] {
  const chain: ErrorLike[] = []
  for (let e: ErrorLike | undefined = error; e && chain.length < 5; e = e.cause as ErrorLike | undefined) chain.push(e)
  return chain
}

export function describeErrorForAlert(error: ErrorLike): string {
  const chain = causes(error)
  if (chain.some((e) => (e.message ?? '').startsWith('Failed query'))) {
    // Keep what identifies the failure (error code, table, constraint), never the query or values
    const cause = (chain.find((e) => typeof (e as DbCause).code === 'string') ?? {}) as DbCause
    const parts = [
      cause.code && `mã ${cause.code}`,
      cause.table_name && `bảng ${cause.table_name}`,
      cause.column_name && `cột ${cause.column_name}`,
      cause.constraint_name && `ràng buộc ${cause.constraint_name}`,
    ].filter(Boolean)
    return `Lỗi truy vấn database${parts.length ? ` (${parts.join(', ')})` : ''}`
  }
  const firstLine = (error.message ?? '').split('\n')[0]!.slice(0, 300)
  return `${error.name ?? 'Error'}: ${redactPersonalData(firstLine)}`
}
