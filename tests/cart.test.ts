import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '~/stores/cart'

const che = { id: 1, slug: 'che-thai', name: 'Chè Thái', price: 35000, image: '' }
const banhFlan = { id: 2, slug: 'banh-flan', name: 'Bánh flan', price: 20000, image: '' }

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('merges identical items and keeps different toppings as separate lines', () => {
    const cart = useCartStore()
    cart.addItem(che, 1)
    cart.addItem(che, 2)
    cart.addItem(che, 1, { toppings: [{ name: 'Thạch dừa', price: 5000 }] })

    expect(cart.items).toHaveLength(2)
    expect(cart.items[0]!.quantity).toBe(3)
    expect(cart.items[1]!.price).toBe(40000)
    expect(cart.totalItems).toBe(4)
  })

  it('removes only the targeted variant', () => {
    const cart = useCartStore()
    cart.addItem(che, 1)
    cart.addItem(che, 1, { sugar: '50% đường' })

    cart.removeItem(cart.items[0]!.cartKey)

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]!.options.sugar).toBe('50% đường')
  })

  it('removes the line when quantity drops to 0', () => {
    const cart = useCartStore()
    cart.addItem(che, 1)
    cart.updateQuantity(cart.items[0]!.cartKey, 0)
    expect(cart.items).toHaveLength(0)
  })

  it('charges shipping below the free-ship threshold only', () => {
    const cart = useCartStore()
    cart.addItem(che, 2) // 70.000
    expect(cart.shippingFee).toBe(15000)
    expect(cart.orderTotal).toBe(85000)

    cart.addItem(banhFlan, 2) // 110.000
    expect(cart.shippingFee).toBe(0)
    expect(cart.orderTotal).toBe(110000)
  })

  it('applies percent, fixed and free-ship coupons', () => {
    const cart = useCartStore()
    cart.addItem(che, 2) // 70.000 + 15.000 ship

    expect(cart.applyCoupon('checoc10').success).toBe(true)
    expect(cart.discountAmount).toBe(7000)

    cart.applyCoupon('CHAOHE')
    expect(cart.discountAmount).toBe(20000)

    cart.applyCoupon('FREESHIP')
    expect(cart.shippingFee).toBe(0)
    expect(cart.orderTotal).toBe(70000)

    expect(cart.applyCoupon('KHONGCO').success).toBe(false)
  })
})
