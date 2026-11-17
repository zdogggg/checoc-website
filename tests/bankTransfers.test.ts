import { describe, expect, it } from 'vitest'
import { orderCodeFromTransfer } from '../server/utils/bankTransfers'

describe('orderCodeFromTransfer', () => {
  it('finds the order code however the bank wraps the description', () => {
    expect(orderCodeFromTransfer('CC1004')).toBe('CC1004')
    expect(orderCodeFromTransfer('MBVCB.8712345.CC1004.CT tu 0123 NGUYEN VAN A toi 456')).toBe('CC1004')
    expect(orderCodeFromTransfer('nguyen van a chuyen khoan cc1004')).toBe('CC1004')
    expect(orderCodeFromTransfer('NGUYENVANACHUYENTIENCC1004FT26321')).toBe('CC1004')
  })
  it('returns null when there is no order code', () => {
    expect(orderCodeFromTransfer('chuyen tien an trua')).toBeNull()
    expect(orderCodeFromTransfer('CC12')).toBeNull()
  })
})
