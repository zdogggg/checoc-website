import type { Product, ProductBadge } from '#shared/types/catalog'
import type { ProductInput } from '#shared/schemas/catalog'

export type { Product, ProductInput }

export const BADGE_LABELS: Record<ProductBadge, string> = {
  'best-seller': '⭐ Bán chạy',
  signature: '👑 Đặc biệt',
  sale: '🔥 Giảm giá',
  new: '✨ Món mới',
}

// API product -> body accepted by PUT /api/admin/products/:id
export function toProductInput(p: Product & { sortOrder?: number }): ProductInput {
  return {
    categoryId: p.categoryId,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    image: p.image,
    galleryImages: p.galleryImages,
    badge: p.badge ?? null,
    toppings: p.toppings,
    ingredients: p.ingredients,
    nutrition: p.nutrition,
    prepTime: p.prepTime,
    isAvailable: p.isAvailable,
    isFeatured: p.isFeatured,
    sortOrder: p.sortOrder ?? 0,
  }
}
