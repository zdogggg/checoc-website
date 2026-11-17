import type { ProductDetailResponse } from '#shared/types/catalog'

// Cached per product (see server/utils/menuCache.ts)
export default defineCachedEventHandler(async (event): Promise<ProductDetailResponse> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const product = await findStoreProduct(slug)
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  const related = await listRelatedProducts(product)
  return { product, related }
}, menuCacheOptions('product', (event) => getRouterParam(event, 'slug') ?? ''))
