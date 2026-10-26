import { and, eq, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const db = useDb()
  const { products, categories } = schema

  const active = await db.query.products.findFirst({
    where: and(eq(products.categoryId, id), isNull(products.deletedAt)),
    columns: { id: true },
  })
  if (active) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Danh mục vẫn còn món ăn. Hãy chuyển món sang danh mục khác hoặc ẩn danh mục thay vì xoá.',
    })
  }
  // Deleted products are kept (soft delete) for order history and still reference the category
  const archived = await db.query.products.findFirst({ where: eq(products.categoryId, id), columns: { id: true } })
  if (archived) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Danh mục có món đã xoá trước đây (được giữ lại cho lịch sử đơn hàng). Hãy ẩn danh mục thay vì xoá.',
    })
  }

  const [row] = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  return { ok: true }
})
