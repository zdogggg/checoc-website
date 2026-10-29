import { describe, expect, it } from 'vitest'
import { platformFeeFor, repriceLines, type PricedLine } from '../server/utils/orderPricing'
import { platformOrderInput } from '#shared/schemas/orders'

const line = (productId: number, unitPrice: number, quantity: number): PricedLine => ({
  productId,
  productName: `Món ${productId}`,
  productImage: '',
  basePrice: unitPrice,
  unitPrice,
  quantity,
  lineTotal: unitPrice * quantity,
  sugar: '',
  ice: '',
  toppings: [],
  note: '',
})

describe('repriceLines', () => {
  it('spreads the app price over the lines and adds up exactly', () => {
    // Menu 86.000 + 45.000 = 131.000; the app shows 150.000
    const out = repriceLines([line(1, 43_000, 2), line(2, 45_000, 1)], 150_000)
    expect(out.reduce((s, l) => s + l.lineTotal, 0)).toBe(150_000)
    expect(out[0]!.lineTotal).toBe(98_473)
    expect(out[1]!.lineTotal).toBe(51_527)
    expect(out[0]!.unitPrice).toBe(49_237)
  })

  it('leaves lines untouched when the price matches the menu', () => {
    const lines = [line(1, 35_000, 1)]
    expect(repriceLines(lines, 35_000)).toBe(lines)
  })

  it('handles free lines without dividing by zero', () => {
    const out = repriceLines([line(1, 0, 1), line(2, 0, 2)], 20_000)
    expect(out.map((l) => l.lineTotal)).toEqual([20_000, 0])
  })
})

describe('platformFeeFor', () => {
  it('rounds the commission to the đồng', () => {
    expect(platformFeeFor(140_000, 25)).toBe(35_000)
    expect(platformFeeFor(33_333, 22.5)).toBe(7_500)
    expect(platformFeeFor(50_000, 0)).toBe(0)
  })
})

describe('platformOrderInput', () => {
  const base = { externalCode: 'SPF1', items: [{ productId: 1, quantity: 1 }] }

  it('needs the app code and at least one dish', () => {
    expect(platformOrderInput.safeParse(base).success).toBe(true)
    expect(platformOrderInput.safeParse({ ...base, externalCode: ' ' }).success).toBe(false)
    expect(platformOrderInput.safeParse({ ...base, items: [] }).success).toBe(false)
  })

  it('refuses a time in the future and silly fees', () => {
    expect(platformOrderInput.safeParse({ ...base, placedAt: '2999-01-01T00:00:00Z' }).success).toBe(false)
    expect(platformOrderInput.safeParse({ ...base, feePercent: 80 }).success).toBe(false)
  })
})
