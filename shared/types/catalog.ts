// Shapes returned by the public API. They mirror what the storefront components
// already consumed from the old mock data, so the UI did not need to change.

export type ProductBadge = 'best-seller' | 'new' | 'sale' | 'signature'

export interface Category {
  id: number
  name: string
  icon: string
  slug: string
  image?: string | null
}

export interface Product {
  id: number
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  originalPrice?: number | null
  image: string
  galleryImages: string[]
  categoryId: number
  categoryName: string
  badge?: ProductBadge | null
  rating: number
  reviewCount: number
  toppings: string[]
  ingredients: string[]
  nutrition: {
    calories: string
    sugar: string
    fat: string
    serving: string
  } | null
  prepTime: string
  isAvailable: boolean
  isFeatured: boolean
}

export interface ProductDetailResponse {
  product: Product
  related: Product[]
}

export interface CustomOption {
  id: string
  label: string
  shortLabel: string
  default?: boolean
}

export interface ToppingOption {
  id: string
  name: string
  price: number
}

export interface ProductOptions {
  sugar: CustomOption[]
  ice: CustomOption[]
  toppings: ToppingOption[]
}

export interface ProductReview {
  id: number
  author: string
  avatar: string
  rating: number
  date: string
  comment: string
}

export type CouponType = 'percent' | 'fixed' | 'free_shipping'

export interface AppliedCoupon {
  code: string
  discount: number
  type: CouponType
  description: string
  minOrder: number
  maxDiscount: number | null
}

// Virtual "all products" entry used by the category filters (not stored in the DB)
export const ALL_CATEGORY_ID = 0
