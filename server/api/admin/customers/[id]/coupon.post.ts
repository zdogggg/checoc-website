import { randomInt } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { personalCouponInput } from '#shared/schemas/customers'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// A single-use coupon only this customer can redeem (checked against the order phone)
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, personalCouponInput)
  const db = useDb()
  const customer = await db.query.customers.findFirst({ where: eq(schema.customers.id, id), columns: { id: true } })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })

  // e.g. KH-7QX4M2PD: 8 random characters (no 0/O/1/I), about 10^12 possibilities, so a code
  // cannot be guessed from the customer number. Retried on the (very unlikely) collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `KH-${Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')}`
    try {
      const [row] = await db
        .insert(schema.coupons)
        .values({
          code,
          type: input.type,
          value: input.type === 'free_shipping' ? 0 : input.value,
          description: input.description,
          minOrder: input.minOrder,
          usageLimit: 1,
          endsAt: new Date(Date.now() + input.validDays * 86_400_000),
          customerId: id,
        })
        .returning({ code: schema.coupons.code })
      setResponseStatus(event, 201)
      return row
    } catch (error) {
      if ((error as { cause?: { code?: string } })?.cause?.code !== '23505') throw error
    }
  }
  throw createError({ statusCode: 500, statusMessage: 'Could not generate a coupon code' })
})
