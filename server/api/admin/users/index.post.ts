import { userCreateInput } from '#shared/schemas/users'

export default defineEventHandler(async (event) => {
  await requireStaff(event, OWNERS)
  const { password, ...input } = await readValidated(event, userCreateInput)
  const [row] = await useDb()
    .insert(schema.users)
    .values({ ...input, passwordHash: await hashPassword(password) })
    .returning()
    .catch((error) => rethrowUnique(error, 'Email này đã có tài khoản'))
  setResponseStatus(event, 201)
  return toUserView(row!)
})
