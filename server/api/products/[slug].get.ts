import type { ProductDetailResponse } from '#shared/types/catalog'

export default defineEventHandler(async (event): Promise<ProductDetailResponse> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const product = await findStoreProduct(slug)
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  const related = relatedProducts(await listStoreProducts(), product)
  return { product, related }
})
