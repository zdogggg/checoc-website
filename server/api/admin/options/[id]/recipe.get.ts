export default defineEventHandler(async (event) => {
  await requireStaff(event)
  return loadRecipe('option', readId(event))
})
