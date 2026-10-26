import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  return useDb().query.optionGroups.findMany({
    with: { options: { orderBy: [asc(schema.options.sortOrder), asc(schema.options.id)] } },
    orderBy: asc(schema.optionGroups.sortOrder),
  })
})
