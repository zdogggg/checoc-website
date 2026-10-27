import { ingredientCreateInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const { openingStock, openingCost, ...fields } = await readValidated(event, ingredientCreateInput)
  try {
    const row = await useDb().transaction(async (tx) => {
      const [created] = await tx.insert(schema.ingredients).values(fields).returning()
      if (openingStock > 0) {
        await moveStock(tx, created!.id, openingStock, 'in', { unitCost: openingCost, userId: user.id, note: 'Tồn đầu kỳ' })
      }
      return created!
    })
    setResponseStatus(event, 201)
    return row
  } catch (error) {
    rethrowUnique(error, 'Nguyên liệu này đã có trong danh sách')
  }
})
