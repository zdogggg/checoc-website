export default defineEventHandler(async (event) => {
  await requireStaff(event)
  return listIngredients()
})
