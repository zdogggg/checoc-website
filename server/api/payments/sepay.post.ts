import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

// SePay calls this for every transaction on the shop's bank account (set up in docs/deploy.md).
// It must answer 2xx with { success: true }, otherwise SePay retries; a retried transaction is
// recognised by its id and applied only once.
const payload = z.object({
  id: z.union([z.number(), z.string()]).transform(String),
  transferType: z.string(),
  transferAmount: z.coerce.number().int().nonnegative(),
  content: z.string().default(''),
  accountNumber: z.string().default(''),
  // "YYYY-MM-DD HH:mm:ss", Vietnam time
  transactionDate: z.string().optional(),
})

function authorized(header: string | undefined, key: string): boolean {
  const expected = Buffer.from(`Apikey ${key}`)
  const actual = Buffer.from(header ?? '')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export default defineEventHandler(async (event) => {
  const { sepayWebhookKey, public: pub } = useRuntimeConfig(event)
  // Not set up: behave as if the endpoint did not exist
  if (!sepayWebhookKey) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  if (!authorized(getRequestHeader(event, 'authorization'), sepayWebhookKey)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readValidated(event, payload)
  // Money going out, or into another account linked to the same SePay login: not ours to match
  const ownAccount = pub.bank.accountNo
  if (body.transferType !== 'in' || (ownAccount && body.accountNumber && body.accountNumber !== ownAccount)) {
    return { success: true }
  }

  const occurredAt = body.transactionDate ? new Date(`${body.transactionDate.replace(' ', 'T')}+07:00`) : null
  const { outcome, orderCode } = await applyBankTransfer({
    provider: 'sepay',
    providerId: body.id,
    amount: body.transferAmount,
    content: body.content,
    accountNumber: body.accountNumber,
    occurredAt: occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null,
  })

  // Staff look at anything that did not settle an order by itself
  if (outcome === 'unmatched' || outcome === 'amount_mismatch' || outcome === 'already_paid') {
    const what = {
      unmatched: 'không khớp đơn nào',
      amount_mismatch: `thiếu tiền so với đơn ${orderCode}`,
      already_paid: `đơn ${orderCode} đã thanh toán trước đó`,
    }[outcome]
    event.waitUntil(notifyTransferToCheck(body.transferAmount, what, body.content))
  }
  return { success: true }
})
