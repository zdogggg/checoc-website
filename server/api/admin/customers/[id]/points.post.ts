import { pointsAdjustInput } from '#shared/schemas/customers'

// Manual correction or gift; recorded in the ledger with the staff member and reason
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const { delta, note } = await readValidated(event, pointsAdjustInput)
  const balance = await useDb().transaction((tx) => adjustPoints(tx, id, delta, 'manual', { userId: user.id, note }))
  return { points: balance }
})
