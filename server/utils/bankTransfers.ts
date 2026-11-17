import { eq } from 'drizzle-orm'

// Incoming bank transfers (SePay webhook) matched to VietQR orders.
// The QR puts the order code (CC1234) in the transfer description; banks often wrap it in their
// own text ("MBVCB.123456.CC1234.CT tu ...") or drop the spaces, so it is searched for anywhere.

export function orderCodeFromTransfer(content: string): string | null {
  const match = content.toUpperCase().match(/(?<![A-Z0-9])CC(\d{4,})(?!\d)/) ?? content.toUpperCase().match(/CC(\d{4,})(?!\d)/)
  return match ? `CC${match[1]}` : null
}

export interface IncomingTransfer {
  provider: 'sepay'
  providerId: string
  amount: number
  content: string
  accountNumber: string
  occurredAt: Date | null
}

export type TransferOutcome = 'matched' | 'unmatched' | 'amount_mismatch' | 'already_paid' | 'duplicate'

// Records the transfer once (a retried webhook is recognised by the provider's id) and marks the
// order paid when code and amount match. Anything else is kept for staff to look at.
export async function applyBankTransfer(t: IncomingTransfer): Promise<{ outcome: TransferOutcome; orderCode: string | null }> {
  const { orders, bankTransactions } = schema
  const code = orderCodeFromTransfer(t.content)
  return useDb().transaction(async (tx) => {
    const [order] = code ? await tx.select().from(orders).where(eq(orders.code, code)).for('update') : []

    let status: Exclude<TransferOutcome, 'duplicate'> = 'unmatched'
    if (order && order.channel === 'website' && order.paymentMethod === 'vietqr' && order.status !== 'cancelled') {
      if (order.paymentStatus === 'paid') status = 'already_paid'
      else if (t.amount < order.total) status = 'amount_mismatch'
      else status = 'matched'
    }

    const [row] = await tx
      .insert(bankTransactions)
      .values({ ...t, content: t.content.slice(0, 500), orderId: order?.id ?? null, status })
      .onConflictDoNothing({ target: [bankTransactions.provider, bankTransactions.providerId] })
      .returning({ id: bankTransactions.id })
    if (!row) return { outcome: 'duplicate', orderCode: code }

    if (status === 'matched') {
      await tx.update(orders).set({ paymentStatus: 'paid', paidAt: new Date() }).where(eq(orders.id, order!.id))
    }
    return { outcome: status, orderCode: code }
  })
}
