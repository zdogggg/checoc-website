import { describe, expect, it } from 'vitest'
import {
  maxRedeemablePoints,
  nextTier,
  pointsEarned,
  pointsValue,
  segmentFor,
  tierFor,
} from '#shared/utils/loyalty'
import { priceOrderLines, totalsFor } from '../server/utils/orderPricing'

const DAY = 86_400_000

describe('tiers', () => {
  it('moves up at 500k and 2M of completed spend', () => {
    expect(tierFor(0)).toBe('member')
    expect(tierFor(499_999)).toBe('member')
    expect(tierFor(500_000)).toBe('silver')
    expect(tierFor(2_000_000)).toBe('gold')
  })

  it('reports what is left to the next tier', () => {
    expect(nextTier(300_000)).toEqual({ tier: 'silver', label: 'Bạc', remaining: 200_000 })
    expect(nextTier(2_500_000)).toBeNull()
  })
})

describe('earning and spending points', () => {
  it('earns 1 point per 1.000đ, with the tier multiplier, rounded down', () => {
    expect(pointsEarned(85_500, 'member')).toBe(85)
    expect(pointsEarned(100_000, 'silver')).toBe(120)
    expect(pointsEarned(100_000, 'gold')).toBe(150)
    expect(pointsEarned(-5_000, 'gold')).toBe(0)
  })

  it('values a point at 50đ', () => {
    expect(pointsValue(200)).toBe(10_000)
  })

  it('caps redemption at half the goods and requires a minimum of 100 points', () => {
    // 100.000đ of goods -> at most 50.000đ -> 1.000 points
    expect(maxRedeemablePoints(5_000, 100_000)).toBe(1_000)
    expect(maxRedeemablePoints(300, 100_000)).toBe(300)
    expect(maxRedeemablePoints(99, 100_000)).toBe(0)
    // 15.000đ allows 7.500đ = 150 points; 8.000đ allows only 80, below the minimum
    expect(maxRedeemablePoints(500, 15_000)).toBe(150)
    expect(maxRedeemablePoints(500, 8_000)).toBe(0)
  })

  it('takes the points discount off the goods but never off shipping', () => {
    const lines = priceOrderLines(
      [{ productId: 1, quantity: 1, sugar: '', ice: '', toppings: [], note: '' }],
      new Map([[1, { id: 1, name: 'Chè', image: '', price: 40_000, isAvailable: true }]]),
      { sugar: [], ice: [], toppings: [] }
    )
    expect(totalsFor(lines, null, pointsValue(300))).toMatchObject({
      subtotal: 40_000,
      pointsDiscount: 15_000,
      shippingFee: 15_000,
      total: 40_000,
    })
    // A discount larger than the goods is clamped
    expect(totalsFor(lines, null, 999_999)).toMatchObject({ pointsDiscount: 40_000, total: 15_000 })
  })
})

describe('segments', () => {
  const now = Date.UTC(2026, 9, 26)
  const ago = (days: number) => new Date(now - days * DAY)

  it('classifies by recency first, then by number of completed orders', () => {
    expect(segmentFor(0, null, now)).toBe('lost')
    expect(segmentFor(1, ago(3), now)).toBe('new')
    expect(segmentFor(2, ago(3), now)).toBe('regular')
    expect(segmentFor(5, ago(3), now)).toBe('loyal')
    expect(segmentFor(5, ago(45), now)).toBe('at_risk')
    expect(segmentFor(5, ago(90), now)).toBe('lost')
  })
})
