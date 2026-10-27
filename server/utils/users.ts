import { and, count, eq, ne } from 'drizzle-orm'
import type { UserUpdateInput } from '#shared/schemas/users'

export const OWNERS: StaffRole[] = ['owner']

export const toUserView = (u: typeof schema.users.$inferSelect) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  isActive: u.isActive,
  createdAt: u.createdAt.toISOString(),
})

// The shop must never lose its last owner, and nobody may lock themselves out
export async function assertSafeUserChange(actorId: number, targetId: number, next: UserUpdateInput) {
  const db = useDb()
  const target = await db.query.users.findFirst({ where: eq(schema.users.id, targetId) })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  if (actorId === targetId && (!next.isActive || next.role !== target.role)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: 'Không thể tự khoá hoặc đổi vai trò của chính mình',
    })
  }

  const losesOwner = target.role === 'owner' && target.isActive && (next.role !== 'owner' || !next.isActive)
  if (losesOwner) {
    const [other] = await db
      .select({ n: count() })
      .from(schema.users)
      .where(and(eq(schema.users.role, 'owner'), eq(schema.users.isActive, true), ne(schema.users.id, targetId)))
    if (!other?.n) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Unprocessable Entity',
        message: 'Quán phải còn ít nhất một chủ quán đang hoạt động',
      })
    }
  }
}
