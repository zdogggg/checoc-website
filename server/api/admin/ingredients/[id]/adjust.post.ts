import { eq } from 'drizzle-orm'
import { stockAdjustInput } from '#shared/schemas/inventory'

// Stock count (set to the counted quantity) or waste (take a quantity out).
// Every staff role may do this: counting and throwing away spoiled food is kitchen work.
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = readId(event)
  const { mode, quantity, note } = await readValidated(event, stockAdjustInput)

  return useDb().transaction(async (tx) => {
    // Lock before reading: the difference must be computed against the stock we then change
    const [current] = await tx
      .select({ stock: schema.ingredients.stock })
      .from(schema.ingredients)
      .where(eq(schema.ingredients.id, id))
      .for('update')
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Ingredient not found' })

    const delta = mode === 'count' ? quantity - current.stock : -quantity
    if (mode === 'count' && Math.abs(delta) < 0.0005) return { balance: current.stock, changed: false }

    const { balance } = await moveStock(tx, id, delta, mode === 'count' ? 'adjust' : 'waste', {
      userId: user.id,
      note: note || (mode === 'count' ? 'Kiểm kho' : ''),
    })
    await syncAutoAvailability(tx, [id])
    return { balance, changed: true }
  })
})
