import { optionInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const row = await saveOption(null, await readValidated(event, optionInput))
  setResponseStatus(event, 201)
  return row
})
