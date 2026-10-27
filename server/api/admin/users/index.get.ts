import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event, OWNERS)
  const rows = await useDb().query.users.findMany({ orderBy: [asc(schema.users.id)] })
  return rows.map(toUserView)
})
