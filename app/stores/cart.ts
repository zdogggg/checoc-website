import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { AppliedCoupon, Product } from '#shared/types/catalog'
import { couponDiscount, FREESHIP_THRESHOLD, shippingFeeFor } from '#shared/utils/pricing'

export type { AppliedCoupon }

export interface CartItemOption {
  sugar: string
  ice: string
  toppings: Array<{ name: string; price: number }>
  note?: string
}

export interface CartItem {
  cartKey: string
  id: number
  slug: string
  name: string
  basePrice: number
  price: number // unit price with toppings
  image: string
  quantity: number
  options: CartItemOption
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const appliedCoupon = ref<AppliedCoupon | null>(null)
  const isHydrated = ref(false)

  // Load cart from localStorage. Must run after the app is mounted on the client
  // (see plugins/cart.client.ts) so the first client render matches the SSR HTML.
  function hydrate() {
    if (isHydrated.value || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('checoc_cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          items.value = parsed.map(item => ({
            cartKey: item.cartKey || `${item.id}__default`,
            id: item.id,
            slug: item.slug || '',
            name: item.name || '',
            basePrice: item.basePrice || item.price || 0,
            price: item.price || 0,
            image: item.image || '',
            quantity: item.quantity || 1,
            options: {
              sugar: item.options?.sugar || '100% đường',
              ice: item.options?.ice || 'Đá riêng',
              toppings: Array.isArray(item.options?.toppings) ? item.options.toppings : [],
              note: item.options?.note || ''
            }
          }))
        }
      }
      const savedCoupon = localStorage.getItem('checoc_coupon')
      if (savedCoupon) {
        // Coupons saved before minOrder/maxDiscount existed
        appliedCoupon.value = { minOrder: 0, maxDiscount: null, ...JSON.parse(savedCoupon) }
      }
    } catch (e) {
      console.warn('Failed to load cart from storage', e)
    }
    isHydrated.value = true

    // Sync back
    watch(items, (newItems) => {
      try {
        localStorage.setItem('checoc_cart', JSON.stringify(newItems))
      } catch (e) {
        console.warn('Failed to save cart to storage', e)
      }
    }, { deep: true })

    watch(appliedCoupon, (newCoupon) => {
      try {
        if (newCoupon) {
          localStorage.setItem('checoc_coupon', JSON.stringify(newCoupon))
        } else {
          localStorage.removeItem('checoc_coupon')
        }
      } catch (e) {
        console.warn('Failed to save coupon to storage', e)
      }
    }, { deep: true })
  }

  const totalItems = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((total, item) => total + item.price * item.quantity, 0))

  const freeshipThreshold = FREESHIP_THRESHOLD

  const shippingFee = computed(() => shippingFeeFor(subtotal.value, appliedCoupon.value))

  // A coupon whose minimum order is no longer met (items removed) simply gives 0
  const discountAmount = computed(() => couponDiscount(appliedCoupon.value, subtotal.value))

  const orderTotal = computed(() => {
    return Math.max(0, subtotal.value + shippingFee.value - discountAmount.value)
  })

  const amountNeededForFreeship = computed(() => {
    return Math.max(0, freeshipThreshold - subtotal.value)
  })

  function generateCartKey(productId: number, options?: Partial<CartItemOption>): string {
    const sugar = options?.sugar || '100% đường'
    const ice = options?.ice || 'Đá riêng'
    const toppings = (options?.toppings || []).map(t => typeof t === 'string' ? t : t.name).sort().join(',')
    const note = options?.note || ''
    return `${productId}__${sugar}__${ice}__${toppings}__${note}`
  }

  type CartProduct = Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'image'>

  function addItem(product: CartProduct, quantity: number = 1, customOptions?: Partial<CartItemOption>) {
    const sugar = customOptions?.sugar || '100% đường'
    const ice = customOptions?.ice || 'Đá riêng'
    const rawToppings = customOptions?.toppings || []
    const note = customOptions?.note || ''

    const normalizedToppings: Array<{ name: string; price: number }> = rawToppings.map(t => {
      if (typeof t === 'string') return { name: t, price: 0 }
      return { name: t.name, price: Number(t.price) || 0 }
    })

    const toppingsTotal = normalizedToppings.reduce((sum, t) => sum + t.price, 0)
    const unitPrice = (Number(product.price) || 0) + toppingsTotal

    const cartKey = generateCartKey(product.id, { sugar, ice, toppings: normalizedToppings, note })
    const existingItem = items.value.find(item => item.cartKey === cartKey)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        cartKey,
        id: product.id,
        slug: product.slug || '',
        name: product.name || '',
        basePrice: product.price || 0,
        price: unitPrice,
        image: product.image || '',
        quantity,
        options: {
          sugar,
          ice,
          toppings: normalizedToppings,
          note
        }
      })
    }
  }

  function removeItem(cartKey: string) {
    items.value = items.value.filter(item => item.cartKey !== cartKey)
  }

  function updateQuantity(cartKey: string, quantity: number) {
    const item = items.value.find(item => item.cartKey === cartKey)
    if (!item) return
    if (quantity <= 0) {
      removeItem(cartKey)
    } else {
      item.quantity = quantity
    }
  }

  function clearCart() {
    items.value = []
    appliedCoupon.value = null
  }

  async function applyCoupon(rawCode: string): Promise<{ success: boolean; message: string }> {
    const code = rawCode.trim().toUpperCase()
    if (!code) {
      return { success: false, message: 'Vui lòng nhập mã giảm giá' }
    }
    if (items.value.length === 0) {
      return { success: false, message: 'Giỏ hàng đang trống' }
    }

    try {
      appliedCoupon.value = await $fetch<AppliedCoupon>('/api/coupons/validate', {
        method: 'POST',
        body: { code, subtotal: subtotal.value }
      })
      return { success: true, message: `Áp dụng mã ${code} thành công!` }
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message
      return { success: false, message: message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn' }
    }
  }

  function removeCoupon() {
    appliedCoupon.value = null
  }

  return {
    items,
    totalItems,
    subtotal,
    shippingFee,
    discountAmount,
    orderTotal,
    amountNeededForFreeship,
    freeshipThreshold,
    appliedCoupon,
    isHydrated,
    hydrate,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon
  }
})
