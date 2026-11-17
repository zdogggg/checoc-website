import { describe, expect, it } from 'vitest'
import { describeErrorForAlert, redactPath, redactPersonalData } from '../server/utils/alertText'

describe('describeErrorForAlert', () => {
  it('never forwards the SQL or its parameters of a failed query', () => {
    const error = Object.assign(
      new Error('Failed query: insert into "orders" ("customer_name", "customer_phone") values ($1, $2)\nparams: Nguyễn Văn A,0988123456'),
      { cause: { code: '23505', table_name: 'orders', constraint_name: 'orders_request_id_unique' } }
    )
    const text = describeErrorForAlert(error)
    expect(text).toBe('Lỗi truy vấn database (mã 23505, bảng orders, ràng buộc orders_request_id_unique)')
    expect(text).not.toContain('0988123456')
    expect(text).not.toContain('Nguyễn')
  })

  it('keeps the first line of other errors, without emails or phone numbers', () => {
    const text = describeErrorForAlert(new TypeError('Cannot send to khach@gmail.com / +84 988 123 456\nstack...'))
    expect(text).toBe('TypeError: Cannot send to [email] / [sđt]')
  })
})

describe('redactPersonalData', () => {
  it('covers the usual ways a phone number is written', () => {
    expect(redactPersonalData('0988123456 0988.123.456 +84988123456 84 988 123 456')).toBe('[sđt] [sđt] [sđt] [sđt]')
  })
  it('leaves order codes and amounts alone', () => {
    expect(redactPersonalData('Đơn CC1004 · 50000đ')).toBe('Đơn CC1004 · 50000đ')
  })
})

describe('wrapped errors and paths', () => {
  it('finds the database error behind the wrappers Nitro adds', () => {
    const pg = { code: '23502', column_name: 'customer_name', message: 'null value in column' }
    const query = Object.assign(new Error('Failed query: update "customers" set ...\nparams: 0988123456'), { cause: pg })
    const h3 = Object.assign(new Error(query.message), { cause: query })
    expect(describeErrorForAlert(h3)).toBe('Lỗi truy vấn database (mã 23502, cột customer_name)')
  })
  it('hides tracking tokens in the path', () => {
    expect(redactPath('/api/orders/Xk3_9fQ2LmP0aZ7bT1yW8v/push')).toBe('/api/orders/[mã]/push')
    expect(redactPath('/api/admin/orders/60/status')).toBe('/api/admin/orders/60/status')
  })
})
