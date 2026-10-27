import { describe, expect, it } from 'vitest'
import { emailOtpRequestInput, phoneOtpVerifyInput } from '#shared/schemas/customers'
import { orderInput } from '#shared/schemas/orders'

const baseOrder = {
  fullName: 'Lan',
  phone: '0988123456',
  city: 'HCM',
  district: 'Q1',
  address: '1 Lê Lợi',
  paymentMethod: 'cod',
  items: [{ productId: 1, quantity: 1 }],
}

describe('login schemas', () => {
  it('normalises the email used to sign in', () => {
    expect(emailOtpRequestInput.parse({ email: '  Lan.Nguyen@Gmail.com ' })).toEqual({ email: 'lan.nguyen@gmail.com' })
    expect(emailOtpRequestInput.safeParse({ email: 'lan' }).success).toBe(false)
  })

  it('still accepts SMS sign-in by phone', () => {
    expect(phoneOtpVerifyInput.parse({ phone: '+84 988 123 456', code: '123456' })).toEqual({ phone: '0988123456', code: '123456' })
  })
})

describe('order email', () => {
  it('is optional and stored lowercase', () => {
    expect(orderInput.parse({ ...baseOrder, email: '' }).email).toBeNull()
    expect(orderInput.parse(baseOrder).email).toBeUndefined()
    expect(orderInput.parse({ ...baseOrder, email: 'Lan@Gmail.com' }).email).toBe('lan@gmail.com')
    expect(orderInput.safeParse({ ...baseOrder, email: 'lan@' }).success).toBe(false)
  })
})
