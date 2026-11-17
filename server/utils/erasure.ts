import { and, eq, inArray, or } from 'drizzle-orm'

const ERASED_NAME = 'Khách đã xoá'
const ERASED_ADDRESS = '(đã xoá)'

// A customer asked the shop to delete their personal data (privacy page, section 5).
// Their orders stay, because the shop's revenue, stock and P&L are built on them, but every
// personal detail on those orders is blanked. The customer record itself is deleted, and with it
// their address book, points history, staff notes and personal coupons (foreign keys cascade).
export async function eraseCustomer(id: number) {
  const { customers, orders, otpCodes, pushSubscriptions } = schema
  return useDb().transaction(async (tx) => {
    const [customer] = await tx.select().from(customers).where(eq(customers.id, id)).for('update')
    if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })

    const theirs = or(eq(orders.customerId, id), eq(orders.customerPhone, customer.phone))
    const open = await tx
      .select({ code: orders.code })
      .from(orders)
      .where(and(theirs, inArray(orders.status, ['pending', 'confirmed', 'preparing', 'shipping'])))
    if (open.length) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: `Khách còn đơn chưa xong (${open.map((o) => o.code).join(', ')}). Giao xong hoặc huỷ các đơn đó trước khi xoá dữ liệu.`,
      })
    }

    const blanked = await tx
      .update(orders)
      .set({ customerName: ERASED_NAME, customerPhone: '', customerEmail: null, address: ERASED_ADDRESS, note: '' })
      .where(theirs)
      .returning({ id: orders.id })
    if (blanked.length) {
      const ids = blanked.map((o) => o.id)
      await tx.delete(pushSubscriptions).where(inArray(pushSubscriptions.orderId, ids))
      // Bank transfer descriptions usually carry the payer's name
      await tx.update(schema.bankTransactions).set({ content: '' }).where(inArray(schema.bankTransactions.orderId, ids))
    }
    await tx
      .delete(otpCodes)
      .where(customer.email ? or(eq(otpCodes.phone, customer.phone), eq(otpCodes.email, customer.email)) : eq(otpCodes.phone, customer.phone))
    await tx.delete(customers).where(eq(customers.id, id))
    return { orders: blanked.length }
  })
}
