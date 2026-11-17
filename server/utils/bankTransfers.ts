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

export type TransferOutcome = 'matched' | 'unmatched' | 'amount_mismatch' | 'already_paid' | 'order_cancelled' | 'duplicate'

// What staff should know about a transfer that did settle an order
export interface TransferNote {
  // Paid more than the order total: the difference goes back to the customer
  overpaid?: number
  // The order was placed as cash on delivery: the driver must not collect it again
  codOrder?: boolean
}

// Records the transfer once (a retried webhook is recognised by the provider's id) and marks the
// order paid when code and amount match. Anything else is kept for staff to look at.
// A cash-on-delivery order paid by transfer anyway is settled the same way.
export async function applyBankTransfer(
  t: IncomingTransfer
): Promise<{ outcome: TransferOutcome; orderCode: string | null; note: TransferNote }> {
  const { orders, bankTransactions } = schema
  const code = orderCodeFromTransfer(t.content)
  return useDb().transaction(async (tx) => {
    const [order] = code ? await tx.select().from(orders).where(eq(orders.code, code)).for('update') : []

    let status: Exclude<TransferOutcome, 'duplicate'> = 'unmatched'
    if (order && order.channel === 'website' && (order.paymentMethod === 'vietqr' || order.paymentMethod === 'cod')) {
      // Money for an order that will not be delivered: kept against it so staff send it back
      if (order.status === 'cancelled') status = 'order_cancelled'
      else if (order.paymentStatus === 'paid') status = 'already_paid'
      else if (t.amount < order.total) status = 'amount_mismatch'
      else status = 'matched'
    }

    const [row] = await tx
      .insert(bankTransactions)
      .values({ ...t, content: t.content.slice(0, 500), orderId: order?.id ?? null, status })
      .onConflictDoNothing({ target: [bankTransactions.provider, bankTransactions.providerId] })
      .returning({ id: bankTransactions.id })
    if (!row) return { outcome: 'duplicate', orderCode: code, note: {} }

    const note: TransferNote = {}
    if (status === 'matched') {
      await tx.update(orders).set({ paymentStatus: 'paid', paidAt: new Date() }).where(eq(orders.id, order!.id))
      if (t.amount > order!.total) note.overpaid = t.amount - order!.total
      if (order!.paymentMethod === 'cod') note.codOrder = true
    }
    return { outcome: status, orderCode: code, note }
  })
}
