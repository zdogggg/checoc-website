import {
  ALL_CATEGORY_ID,
  type Category,
  type Product,
  type ProductDetailResponse,
  type ProductOptions,
} from '#shared/types/catalog'

// Shared keys: every component asking for the same list reuses one request/payload entry

export function useCategories() {
  return useFetch<Category[]>('/api/categories', { key: 'catalog:categories', default: () => [] })
}

// Categories with the virtual "all products" entry in front, for the filter bars
export async function useCategoryFilters() {
  const { data } = await useCategories()
  return computed<Category[]>(() => [
    { id: ALL_CATEGORY_ID, name: 'Tất cả món', icon: '🥣', slug: 'all' },
    ...data.value,
  ])
}

export function useProducts() {
  return useFetch<Product[]>('/api/products', { key: 'catalog:products', default: () => [] })
}

export function useProductDetail(slug: MaybeRefOrGetter<string>) {
  return useFetch<ProductDetailResponse>(() => `/api/products/${encodeURIComponent(toValue(slug))}`, {
    key: () => `catalog:product:${toValue(slug)}`,
  })
}

export function useProductOptions() {
  return useFetch<ProductOptions>('/api/options', {
    key: 'catalog:options',
    default: () => ({ sugar: [], ice: [], toppings: [] }),
  })
}
