import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, count, desc, eq, gte, isNull } from 'drizzle-orm'
import type { LoginTarget } from '#shared/schemas/customers'

const CODE_TTL_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_CODES_PER_TARGET = 3 // per 15 minutes

// Codes are stored as an HMAC keyed with the session secret, never in clear
function hashCode(target: LoginTarget, code: string): string {
  const secret = useRuntimeConfig().session?.password || 'dev-only-secret'
  const id = 'email' in target ? `email:${target.email}` : `sms:${target.phone}`
  return createHmac('sha256', secret).update(`${id}:${code}`).digest('hex')
}

const matchTarget = (target: LoginTarget) =>
  'email' in target ? eq(schema.otpCodes.email, target.email) : eq(schema.otpCodes.phone, target.phone)

// Sign-in requests carry either { email } or { phone }
export async function sendsEmail(event: H3Event): Promise<boolean> {
  const body = await readBody(event)
  return !!body && typeof body === 'object' && 'email' in body
}

const fail = (statusCode: number, message: string) => createError({ statusCode, statusMessage: 'OTP', message })

// Which sign-in channels can deliver a code right now. In development both work without
// a provider: the code is shown on screen instead.
export function loginChannels(): { email: boolean; sms: boolean } {
  return { email: isMailConfigured() || import.meta.dev, sms: isSmsConfigured() || import.meta.dev }
}

// The customer behind an email: only emails linked to a customer can sign in
export async function findCustomerByEmail(email: string) {
  return useDb().query.customers.findFirst({ where: eq(schema.customers.email, email) })
}

// Returns the code only in development (no provider configured), so it can be shown on screen.
// An email that is not linked to any customer gets the same answer but no code, so the form
// does not reveal who shops here.
export async function requestLoginCode(target: LoginTarget): Promise<{ devCode?: string }> {
  if ('email' in target && !(await findCustomerByEmail(target.email))) return {}

  const db = useDb()
  const { otpCodes } = schema
  const [recent] = await db
    .select({ n: count() })
    .from(otpCodes)
    .where(and(matchTarget(target), gte(otpCodes.createdAt, new Date(Date.now() - 15 * 60 * 1000))))
  if ((recent?.n ?? 0) >= MAX_CODES_PER_TARGET) {
    throw fail(429, 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 15 phút.')
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await db.insert(otpCodes).values({
    ...target,
    codeHash: hashCode(target, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })

  if ('email' in target) {
    await sendMail(loginCodeMail(target.email, code))
    return isMailConfigured() ? {} : { devCode: code }
  }
  await sendSms(target.phone, `Ma dang nhap Che Coc cua ban la ${code}. Ma co hieu luc trong 5 phut.`)
  return isSmsConfigured() ? {} : { devCode: code }
}

// Checks the most recent unused code for this phone / email; each wrong guess counts
export async function verifyLoginCode(target: LoginTarget, code: string): Promise<void> {
  const db = useDb()
  const { otpCodes } = schema
  const row = await db.query.otpCodes.findFirst({
    where: and(matchTarget(target), isNull(otpCodes.consumedAt)),
    orderBy: desc(otpCodes.id),
  })
  if (!row || row.expiresAt < new Date()) throw fail(400, 'Mã đã hết hạn. Vui lòng yêu cầu mã mới.')
  if (row.attempts >= MAX_ATTEMPTS) throw fail(429, 'Nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.')

  const expected = Buffer.from(row.codeHash, 'hex')
  const actual = Buffer.from(hashCode(target, code), 'hex')
  if (!timingSafeEqual(expected, actual)) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.id, row.id))
    throw fail(400, `Mã không đúng. Bạn còn ${MAX_ATTEMPTS - row.attempts - 1} lần thử.`)
  }
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id))
}
