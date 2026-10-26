import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { and, count, desc, eq, gte, isNull } from 'drizzle-orm'

const CODE_TTL_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_CODES_PER_PHONE = 3 // per 15 minutes

// Codes are stored as an HMAC keyed with the session secret, never in clear
function hashCode(phone: string, code: string): string {
  const secret = useRuntimeConfig().session?.password || 'dev-only-secret'
  return createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex')
}

const fail = (statusCode: number, message: string) => createError({ statusCode, statusMessage: 'OTP', message })

// Returns the code only in development (no SMS provider), so it can be shown on screen
export async function requestLoginCode(phone: string): Promise<{ devCode?: string }> {
  const db = useDb()
  const { otpCodes } = schema
  const [recent] = await db
    .select({ n: count() })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gte(otpCodes.createdAt, new Date(Date.now() - 15 * 60 * 1000))))
  if ((recent?.n ?? 0) >= MAX_CODES_PER_PHONE) {
    throw fail(429, 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 15 phút.')
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await db.insert(otpCodes).values({
    phone,
    codeHash: hashCode(phone, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })
  await sendSms(phone, `Ma dang nhap Che Coc cua ban la ${code}. Ma co hieu luc trong 5 phut.`)
  return isSmsConfigured() ? {} : { devCode: code }
}

// Checks the most recent unused code for this phone; each wrong guess counts
export async function verifyLoginCode(phone: string, code: string): Promise<void> {
  const db = useDb()
  const { otpCodes } = schema
  const row = await db.query.otpCodes.findFirst({
    where: and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt)),
    orderBy: desc(otpCodes.id),
  })
  if (!row || row.expiresAt < new Date()) throw fail(400, 'Mã đã hết hạn. Vui lòng yêu cầu mã mới.')
  if (row.attempts >= MAX_ATTEMPTS) throw fail(429, 'Nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.')

  const expected = Buffer.from(row.codeHash, 'hex')
  const actual = Buffer.from(hashCode(phone, code), 'hex')
  if (!timingSafeEqual(expected, actual)) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.id, row.id))
    throw fail(400, `Mã không đúng. Bạn còn ${MAX_ATTEMPTS - row.attempts - 1} lần thử.`)
  }
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id))
}
