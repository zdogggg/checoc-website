import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, count, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm'
import type { LoginTarget } from '#shared/schemas/customers'

const CODE_TTL_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_CODES_PER_TARGET = 3 // per 15 minutes

// login: signing in. email_change: a signed-in customer proving they own a new email;
// such a code is bound to that customer (scope) and can never be used to sign in.
type OtpPurpose = 'login' | 'email_change'

// Codes are stored as an HMAC keyed with the session secret, never in clear
function hashCode(target: LoginTarget, code: string, scope: string): string {
  const secret = useRuntimeConfig().session?.password || 'dev-only-secret'
  const id = 'email' in target ? `email:${target.email}` : `sms:${target.phone}`
  return createHmac('sha256', secret).update(`${scope}:${id}:${code}`).digest('hex')
}

const matchTarget = (target: LoginTarget, purpose: OtpPurpose) =>
  and(
    'email' in target ? eq(schema.otpCodes.email, target.email) : eq(schema.otpCodes.phone, target.phone),
    eq(schema.otpCodes.purpose, purpose)
  )

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

  const code = await issueCode(target, 'login', 'login')
  if ('email' in target) {
    await sendMail(loginCodeMail(target.email, code))
    return isMailConfigured() ? {} : { devCode: code }
  }
  await sendSms(target.phone, `Ma dang nhap Che Coc cua ban la ${code}. Ma co hieu luc trong 5 phut.`)
  return isSmsConfigured() ? {} : { devCode: code }
}

async function issueCode(target: LoginTarget, purpose: OtpPurpose, scope: string): Promise<string> {
  const db = useDb()
  const { otpCodes } = schema
  const [recent] = await db
    .select({ n: count() })
    .from(otpCodes)
    .where(and(matchTarget(target, purpose), gte(otpCodes.createdAt, new Date(Date.now() - 15 * 60 * 1000))))
  if ((recent?.n ?? 0) >= MAX_CODES_PER_TARGET) {
    throw fail(429, 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 15 phút.')
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await db.insert(otpCodes).values({
    ...target,
    purpose,
    codeHash: hashCode(target, code, scope),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })
  return code
}

// A signed-in customer adding or changing their email: the code goes to the NEW address,
// so only someone who can read that mailbox can make it their sign-in email
export async function requestEmailChangeCode(customerId: number, email: string): Promise<{ devCode?: string }> {
  const taken = await findCustomerByEmail(email)
  if (taken && taken.id !== customerId) throw fail(409, 'Email này đã gắn với một tài khoản khác')
  const code = await issueCode({ email }, 'email_change', `change:${customerId}`)
  await sendMail(emailChangeMail(email, code))
  return isMailConfigured() ? {} : { devCode: code }
}

export function verifyEmailChangeCode(customerId: number, email: string, code: string): Promise<void> {
  return checkCode({ email }, code, 'email_change', `change:${customerId}`)
}

export function verifyLoginCode(target: LoginTarget, code: string): Promise<void> {
  return checkCode(target, code, 'login', 'login')
}

// Checks the most recent unused code for this phone / email; each wrong guess counts
async function checkCode(target: LoginTarget, code: string, purpose: OtpPurpose, scope: string): Promise<void> {
  const db = useDb()
  const { otpCodes } = schema
  const row = await db.query.otpCodes.findFirst({
    where: and(matchTarget(target, purpose), isNull(otpCodes.consumedAt)),
    orderBy: desc(otpCodes.id),
  })
  if (!row || row.expiresAt < new Date()) throw fail(400, 'Mã đã hết hạn. Vui lòng yêu cầu mã mới.')

  // Take one attempt before comparing, in a single statement: guesses sent in parallel each
  // need their own attempt, so no more than MAX_ATTEMPTS codes are ever compared
  const [taken] = await db
    .update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(and(eq(otpCodes.id, row.id), lt(otpCodes.attempts, MAX_ATTEMPTS), isNull(otpCodes.consumedAt)))
    .returning({ attempts: otpCodes.attempts })
  if (!taken) throw fail(429, 'Nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.')

  const expected = Buffer.from(row.codeHash, 'hex')
  const actual = Buffer.from(hashCode(target, code, scope), 'hex')
  if (!timingSafeEqual(expected, actual)) {
    throw fail(400, `Mã không đúng. Bạn còn ${MAX_ATTEMPTS - taken.attempts} lần thử.`)
  }
  // A code signs in once, even if the right code is sent twice at the same moment
  const [used] = await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt)))
    .returning({ id: otpCodes.id })
  if (!used) throw fail(400, 'Mã đã được dùng. Vui lòng yêu cầu mã mới.')
}
