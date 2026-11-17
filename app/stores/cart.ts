import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { AppliedCoupon, Product, ProductOptions } from '#shared/types/catalog'
import { couponDiscount, FREESHIP_THRESHOLD, freeshipBase, shippingFeeFor } from '#shared/utils/pricing'
import { cartKeyFor, cartSyncMessage, defaultChoice, reconcileCart } from '~/utils/cartSync'

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
  // Current sugar/ice/topping lists, known once syncWithMenu has run
  const menuOptions = ref<ProductOptions | null>(null)

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
              sugar: item.options?.sugar || '',
              ice: item.options?.ice || '',
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

  // Goods after the coupon, the amount free shipping is measured on (see shared/utils/pricing.ts)
  const freeshipProgress = computed(() => freeshipBase(subtotal.value, appliedCoupon.value))

  const amountNeededForFreeship = computed(() => {
    return Math.max(0, freeshipThreshold - freeshipProgress.value)
  })

  // '' when the menu options are not loaded yet: the server then picks the shop default,
  // and the next syncWithMenu fills in its name
  const defaultSugar = () => (menuOptions.value ? defaultChoice(menuOptions.value.sugar) : '')
  const defaultIce = () => (menuOptions.value ? defaultChoice(menuOptions.value.ice) : '')

  type CartProduct = Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'image'>

  function addItem(product: CartProduct, quantity: number = 1, customOptions?: Partial<CartItemOption>) {
    const sugar = customOptions?.sugar || defaultSugar()
    const ice = customOptions?.ice || defaultIce()
    const rawToppings = customOptions?.toppings || []
    const note = customOptions?.note || ''

    const normalizedToppings: Array<{ name: string; price: number }> = rawToppings.map(t => {
      if (typeof t === 'string') return { name: t, price: 0 }
      return { name: t.name, price: Number(t.price) || 0 }
    })

    const toppingsTotal = normalizedToppings.reduce((sum, t) => sum + t.price, 0)
    const unitPrice = (Number(product.price) || 0) + toppingsTotal

    const cartKey = cartKeyFor(product.id, { sugar, ice, toppings: normalizedToppings, note })
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

  // phone is needed for personal coupons (sent when the customer already typed it)
  async function applyCoupon(rawCode: string, phone?: string): Promise<{ success: boolean; message: string }> {
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
        body: { code, subtotal: subtotal.value, phone: phone || undefined }
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

  // Check the saved coupon again (it may have expired or run out since it was applied) and take
  // its current terms. Returns a message when it had to be removed. Codes that only need the
  // phone number first, or a bigger order, are kept: the totals already ignore them meanwhile.
  // Network errors and rate limits leave the coupon alone: the server checks it at checkout anyway.
  async function revalidateCoupon(phone?: string): Promise<string> {
    const coupon = appliedCoupon.value
    if (!coupon || !items.value.length) return ''
    try {
      appliedCoupon.value = await $fetch<AppliedCoupon>('/api/coupons/validate', {
        method: 'POST',
        body: { code: coupon.code, subtotal: subtotal.value, phone: phone || undefined },
      })
      return ''
    } catch (error) {
      const e = error as { statusCode?: number; data?: { message?: string; data?: { reason?: string } } }
      const reason = e.data?.data?.reason
      if (e.statusCode !== 400 || reason === 'phone_required' || reason === 'min_order') return ''
      appliedCoupon.value = null
      return `Đã bỏ mã ${coupon.code}: ${e.data?.message ?? 'mã không còn dùng được'}`
    }
  }

  // Re-read prices, availability and option names from the menu. Returns a message for the
  // customer when something they would notice changed, '' otherwise. Network errors are
  // ignored: the server still prices the order from the menu.
  async function syncWithMenu(): Promise<string> {
    try {
      const [products, options] = await Promise.all([
        $fetch<Product[]>('/api/products'),
        $fetch<ProductOptions>('/api/options'),
      ])
      menuOptions.value = options
      if (!items.value.length) return ''
      const result = reconcileCart(items.value, products, options)
      items.value = result.items
      return cartSyncMessage(result)
    } catch (e) {
      console.warn('Could not refresh the cart from the menu', e)
      return ''
    }
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
    freeshipProgress,
    appliedCoupon,
    isHydrated,
    hydrate,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    revalidateCoupon,
    syncWithMenu
  }
})
