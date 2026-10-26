import { and, asc, count, eq, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const { categories, products } = schema
  return useDb()
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      image: categories.image,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), isNull(products.deletedAt)))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.id))
})
