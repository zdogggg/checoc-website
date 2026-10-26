import { optionInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  return saveOption(id, await readValidated(event, optionInput))
})
