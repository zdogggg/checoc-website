import { describe, expect, it } from 'vitest'
import { describeAudit } from '#shared/utils/audit'
import { absoluteUrl } from '#shared/utils/site'

describe('absoluteUrl', () => {
  it('joins origin and path with one slash', () => {
    expect(absoluteUrl('https://checoc.vn/', '/products')).toBe('https://checoc.vn/products')
    expect(absoluteUrl('https://checoc.vn', 'uploads/a.webp')).toBe('https://checoc.vn/uploads/a.webp')
  })

  it('keeps external URLs', () => {
    expect(absoluteUrl('https://checoc.vn', 'https://images.example.com/x.jpg')).toBe('https://images.example.com/x.jpg')
  })
})

describe('describeAudit', () => {
  it('names common admin actions', () => {
    expect(describeAudit('POST', '/api/admin/products', 201)).toBe('Thêm món')
    expect(describeAudit('PUT', '/api/admin/products/12', 200)).toBe('Sửa món #12')
    expect(describeAudit('DELETE', '/api/admin/coupons/3', 200)).toBe('Xoá mã giảm giá #3')
    expect(describeAudit('POST', '/api/admin/orders/7/status', 200)).toBe('Đổi trạng thái đơn hàng #7')
    expect(describeAudit('POST', '/api/admin/users/2/password', 200)).toBe('Đặt lại mật khẩu tài khoản #2')
  })

  it('describes sign-ins and unknown routes', () => {
    expect(describeAudit('POST', '/api/auth/login', 200)).toBe('Đăng nhập')
    expect(describeAudit('POST', '/api/auth/login', 401)).toBe('Đăng nhập thất bại')
    expect(describeAudit('POST', '/api/admin/something/else', 200)).toBe('POST /api/admin/something/else')
  })
})
