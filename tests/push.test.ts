import { describe, expect, it } from 'vitest'
import { isPushServiceUrl } from '#shared/schemas/push'
import { orderStatusMessage } from '#shared/utils/orders'

describe('push endpoints', () => {
  it('accepts the browsers push services', () => {
    expect(isPushServiceUrl('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    expect(isPushServiceUrl('https://web.push.apple.com/QK2d')).toBe(true)
    expect(isPushServiceUrl('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true)
  })

  it('refuses anything the server should not call', () => {
    expect(isPushServiceUrl('http://fcm.googleapis.com/x')).toBe(false)
    expect(isPushServiceUrl('https://169.254.169.254/latest/meta-data')).toBe(false)
    expect(isPushServiceUrl('https://db:5432/')).toBe(false)
    expect(isPushServiceUrl('https://fcm.googleapis.com.evil.example/x')).toBe(false)
    expect(isPushServiceUrl('not a url')).toBe(false)
  })
})

describe('order status messages', () => {
  it('describes each customer-facing step', () => {
    expect(orderStatusMessage('CC1002', 'shipping')).toEqual({
      title: 'Đơn CC1002 · Đang giao',
      body: 'Đơn đang trên đường giao tới bạn.',
    })
    expect(orderStatusMessage('CC1002', 'cancelled', 'Hết món')?.body).toBe('Đơn đã bị huỷ: Hết món')
    expect(orderStatusMessage('CC1002', 'pending')).toBeNull()
  })
})
