import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

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

export interface AppliedCoupon {
  code: string
  discount: number
  type: 'percent' | 'fixed' | 'free_shipping'
  description: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const appliedCoupon = ref<AppliedCoupon | null>(null)
  const isHydrated = ref(false)

  // Hydrate safely from localStorage on client
  if (typeof window !== 'undefined') {
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
        appliedCoupon.value = JSON.parse(savedCoupon)
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

  const freeshipThreshold = 100000
  const baseShippingFee = 15000

  const shippingFee = computed(() => {
    if (items.value.length === 0) return 0
    if (appliedCoupon.value?.type === 'free_shipping') return 0
    return subtotal.value >= freeshipThreshold ? 0 : baseShippingFee
  })

  const discountAmount = computed(() => {
    if (!appliedCoupon.value || items.value.length === 0) return 0
    if (appliedCoupon.value.type === 'percent') {
      return Math.round((subtotal.value * appliedCoupon.value.discount) / 100)
    }
    if (appliedCoupon.value.type === 'fixed') {
      return Math.min(appliedCoupon.value.discount, subtotal.value)
    }
    return 0
  })

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

  function addItem(product: any, quantity: number = 1, customOptions?: Partial<CartItemOption>) {
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

  function removeItem(keyOrId: string | number) {
    items.value = items.value.filter(item => {
      if (typeof keyOrId === 'number') {
        return item.id !== keyOrId
      }
      return item.cartKey !== keyOrId && String(item.id) !== keyOrId
    })
  }

  function updateQuantity(keyOrId: string | number, quantity: number) {
    const item = items.value.find(item => {
      if (typeof keyOrId === 'number') {
        return item.id === keyOrId
      }
      return item.cartKey === keyOrId || String(item.id) === keyOrId
    })
    if (item) {
      if (quantity <= 0) {
        removeItem(keyOrId)
      } else {
        item.quantity = quantity
      }
    }
  }

  function clearCart() {
    items.value = []
    appliedCoupon.value = null
  }

  function applyCoupon(rawCode: string): { success: boolean; message: string } {
    const code = rawCode.trim().toUpperCase()
    if (!code) {
      return { success: false, message: 'Vui lòng nhập mã giảm giá' }
    }
    if (items.value.length === 0) {
      return { success: false, message: 'Giỏ hàng đang trống' }
    }

    if (code === 'CHECOC10') {
      appliedCoupon.value = {
        code: 'CHECOC10',
        discount: 10,
        type: 'percent',
        description: 'Giảm 10% tổng đơn hàng'
      }
      return { success: true, message: 'Áp dụng mã giảm 10% thành công!' }
    }

    if (code === 'FREESHIP') {
      appliedCoupon.value = {
        code: 'FREESHIP',
        discount: baseShippingFee,
        type: 'free_shipping',
        description: 'Miễn phí vận chuyển toàn quốc'
      }
      return { success: true, message: 'Áp dụng mã miễn phí giao hàng!' }
    }

    if (code === 'CHAOHE') {
      appliedCoupon.value = {
        code: 'CHAOHE',
        discount: 20000,
        type: 'fixed',
        description: 'Giảm 20.000đ cho đơn đầu mùa hè'
      }
      return { success: true, message: 'Áp dụng mã giảm 20.000đ thành công!' }
    }

    return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' }
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
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon
  }
})
