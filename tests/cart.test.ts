import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '~/stores/cart'
import type { AppliedCoupon } from '#shared/types/catalog'

const che = { id: 1, slug: 'che-thai', name: 'Chè Thái', price: 35000, image: '' }
const banhFlan = { id: 2, slug: 'banh-flan', name: 'Bánh flan', price: 20000, image: '' }

const coupon = (c: Partial<AppliedCoupon> & Pick<AppliedCoupon, 'code' | 'type' | 'discount'>): AppliedCoupon => ({
  description: '',
  minOrder: 0,
  maxDiscount: null,
  ...c,
})

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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

  it('applies percent, fixed and free-ship coupons returned by the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    const cart = useCartStore()
    cart.addItem(che, 2) // 70.000 + 15.000 ship

    fetchMock.mockResolvedValueOnce(coupon({ code: 'CHECOC10', type: 'percent', discount: 10 }))
    expect((await cart.applyCoupon('checoc10')).success).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('/api/coupons/validate', {
      method: 'POST',
      body: { code: 'CHECOC10', subtotal: 70000 },
    })
    expect(cart.discountAmount).toBe(7000)

    fetchMock.mockResolvedValueOnce(coupon({ code: 'CHAOHE', type: 'fixed', discount: 20000 }))
    await cart.applyCoupon('CHAOHE')
    expect(cart.discountAmount).toBe(20000)

    fetchMock.mockResolvedValueOnce(coupon({ code: 'FREESHIP', type: 'free_shipping', discount: 0 }))
    await cart.applyCoupon('FREESHIP')
    expect(cart.shippingFee).toBe(0)
    expect(cart.orderTotal).toBe(70000)
  })

  it('reports the server message for a rejected coupon and keeps the previous one', async () => {
    const fetchMock = vi.fn().mockRejectedValue({ data: { message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' } })
    vi.stubGlobal('$fetch', fetchMock)
    const cart = useCartStore()
    cart.addItem(che, 1)

    const res = await cart.applyCoupon('KHONGCO')
    expect(res).toEqual({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' })
    expect(cart.appliedCoupon).toBeNull()
  })

  it('does not call the API for an empty code or an empty cart', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    const cart = useCartStore()

    expect((await cart.applyCoupon('CHECOC10')).success).toBe(false)
    cart.addItem(che, 1)
    expect((await cart.applyCoupon('   ')).success).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
