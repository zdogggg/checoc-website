export default defineEventHandler(async (event) => {
  await requireStaff(event)
  return loadRecipe('product', readId(event))
})
