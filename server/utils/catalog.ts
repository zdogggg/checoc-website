import { and, asc, eq, isNull } from 'drizzle-orm'
import type { Category, CustomOption, Product, ProductOptions, ToppingOption } from '#shared/types/catalog'
import type { ProductInput } from '#shared/schemas/catalog'

const { products, productImages, optionGroups, options } = schema
type CategoryRow = typeof schema.categories.$inferSelect

type ProductRow = typeof products.$inferSelect & {
  category: CategoryRow
  images: (typeof productImages.$inferSelect)[]
}

export function toCategoryDto(row: CategoryRow): Category {
  return { id: row.id, name: row.name, slug: row.slug, icon: row.icon, image: row.image }
}

export function toProductDto(row: ProductRow): Product {
  const gallery = [...row.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.description,
    price: row.price,
    originalPrice: row.originalPrice,
    image: row.image,
    galleryImages: gallery.length ? gallery : row.image ? [row.image] : [],
    categoryId: row.categoryId,
    categoryName: row.category.name,
    badge: row.badge,
    rating: row.rating,
    reviewCount: row.reviewCount,
    toppings: row.toppings,
    ingredients: row.ingredients,
    nutrition: row.nutrition ?? null,
    prepTime: row.prepTime,
    isAvailable: row.isAvailable,
    isFeatured: row.isFeatured,
  }
}

// Admin view: the real gallery (no fallback to the main image) plus admin-only fields
export function toAdminProductDto(row: ProductRow) {
  return {
    ...toProductDto(row),
    galleryImages: [...row.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url),
    sortOrder: row.sortOrder,
    categoryActive: row.category.isActive,
    autoDisabled: row.autoDisabled,
  }
}

const productWith = { category: true, images: true } as const

// Storefront list: non-deleted products whose category is active
export async function listStoreProducts(): Promise<Product[]> {
  const rows = await useDb().query.products.findMany({
    where: isNull(products.deletedAt),
    with: productWith,
    orderBy: [asc(products.sortOrder), asc(products.id)],
  })
  return rows.filter((r) => r.category.isActive).map(toProductDto)
}

export async function findStoreProduct(slug: string): Promise<Product | null> {
  const row = await useDb().query.products.findFirst({
    where: and(eq(products.slug, slug), isNull(products.deletedAt)),
    with: productWith,
  })
  if (!row || !row.category.isActive) return null
  return toProductDto(row)
}

export async function findAdminProduct(id: number) {
  const row = await useDb().query.products.findFirst({
    where: and(eq(products.id, id), isNull(products.deletedAt)),
    with: productWith,
  })
  return row ? toAdminProductDto(row) : null
}

export async function listStoreOptions(): Promise<ProductOptions> {
  const groups = await useDb().query.optionGroups.findMany({
    with: { options: { where: eq(options.isActive, true), orderBy: [asc(options.sortOrder), asc(options.id)] } },
    orderBy: asc(optionGroups.sortOrder),
  })
  const byCode = (code: string) => groups.find((g) => g.code === code)?.options ?? []
  const toCustom = (o: typeof options.$inferSelect): CustomOption => ({
    id: String(o.id),
    label: o.label,
    shortLabel: o.shortLabel,
    default: o.isDefault,
  })
  const toTopping = (o: typeof options.$inferSelect): ToppingOption => ({
    id: String(o.id),
    name: o.label,
    price: o.price,
  })
  return {
    sugar: byCode('sugar').map(toCustom),
    ice: byCode('ice').map(toCustom),
    toppings: byCode('topping').map(toTopping),
  }
}

export function relatedProducts(all: Product[], current: Product, limit = 4): Product[] {
  const others = all.filter((p) => p.id !== current.id)
  const same = others.filter((p) => p.categoryId === current.categoryId)
  const rest = others.filter((p) => p.categoryId !== current.categoryId)
  return [...same, ...rest].slice(0, limit)
}

// Insert (id = null) or update a product and replace its gallery, in one transaction
export async function saveProduct(id: number | null, input: ProductInput): Promise<number> {
  const { galleryImages, ...fields } = input
  const values = {
    ...fields,
    originalPrice: fields.originalPrice ?? null,
    badge: fields.badge ?? null,
    nutrition: fields.nutrition ?? null,
    // Turning a product on by hand ends any automatic out-of-stock state
    ...(fields.isAvailable ? { autoDisabled: false } : {}),
  }
  return useDb().transaction(async (tx) => {
    let productId = id
    if (productId == null) {
      const [row] = await tx.insert(products).values(values).returning({ id: products.id })
      productId = row!.id
    } else {
      const [row] = await tx
        .update(products)
        .set(values)
        .where(and(eq(products.id, productId), isNull(products.deletedAt)))
        .returning({ id: products.id })
      if (!row) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
      await tx.delete(productImages).where(eq(productImages.productId, productId))
    }
    if (galleryImages.length) {
      await tx
        .insert(productImages)
        .values(galleryImages.map((url, sortOrder) => ({ productId: productId!, url, sortOrder })))
    }
    return productId
  })
}
