// Loyalty rules in one place; the API enforces them and the UI explains them.

export type CustomerTier = 'member' | 'silver' | 'gold'

export const TIERS: { tier: CustomerTier; label: string; minSpent: number; earnMultiplier: number }[] = [
  { tier: 'member', label: 'Thành viên', minSpent: 0, earnMultiplier: 1 },
  { tier: 'silver', label: 'Bạc', minSpent: 500_000, earnMultiplier: 1.2 },
  { tier: 'gold', label: 'Vàng', minSpent: 2_000_000, earnMultiplier: 1.5 },
]

export const TIER_LABELS: Record<CustomerTier, string> = {
  member: 'Thành viên',
  silver: 'Bạc',
  gold: 'Vàng',
}

// Earning: 1 point per 1.000đ of goods (shipping excluded), times the tier multiplier
export const VND_PER_POINT_EARNED = 1_000
// Spending: each point is worth 50đ, i.e. roughly 5% back
export const VND_PER_POINT_REDEEMED = 50
export const MIN_POINTS_TO_REDEEM = 100
// Points can pay for at most half of the goods after coupons
export const MAX_REDEEM_SHARE = 0.5

// Tier is based on the total spent on completed orders
export function tierFor(totalSpent: number): CustomerTier {
  let tier: CustomerTier = 'member'
  for (const t of TIERS) if (totalSpent >= t.minSpent) tier = t.tier
  return tier
}

export function nextTier(totalSpent: number): { tier: CustomerTier; label: string; remaining: number } | null {
  const next = TIERS.find((t) => t.minSpent > totalSpent)
  return next ? { tier: next.tier, label: next.label, remaining: next.minSpent - totalSpent } : null
}

// goodsAmount = what the customer paid for food: subtotal - coupon - points discount
export function pointsEarned(goodsAmount: number, tier: CustomerTier): number {
  const multiplier = TIERS.find((t) => t.tier === tier)!.earnMultiplier
  return Math.floor((Math.max(0, goodsAmount) / VND_PER_POINT_EARNED) * multiplier)
}

export function pointsValue(points: number): number {
  return Math.max(0, points) * VND_PER_POINT_REDEEMED
}

// Largest number of points usable on an order of this size with this balance
export function maxRedeemablePoints(balance: number, goodsAfterCoupon: number): number {
  const cap = Math.floor((goodsAfterCoupon * MAX_REDEEM_SHARE) / VND_PER_POINT_REDEEMED)
  const usable = Math.min(balance, cap)
  return usable >= MIN_POINTS_TO_REDEEM ? usable : 0
}

// ---------------------------------------------------------------------------
// Segments (RFM-lite), computed from completed orders and the last order date
// ---------------------------------------------------------------------------

export type CustomerSegment = 'new' | 'loyal' | 'regular' | 'at_risk' | 'lost'

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  new: 'Khách mới',
  loyal: 'Thân thiết',
  regular: 'Thường xuyên',
  at_risk: 'Sắp rời bỏ',
  lost: 'Đã lâu không mua',
}

export const SEGMENT_HINTS: Record<CustomerSegment, string> = {
  new: 'Tối đa 1 đơn hoàn tất, mua trong 30 ngày qua',
  loyal: 'Từ 3 đơn hoàn tất, mua trong 30 ngày qua',
  regular: 'Có 2 đơn hoàn tất, mua trong 30 ngày qua',
  at_risk: 'Lần mua gần nhất cách đây 31–60 ngày',
  lost: 'Hơn 60 ngày chưa mua',
}

const DAY = 86_400_000

export function segmentFor(completedOrders: number, lastOrderAt: Date | string | null, now = Date.now()): CustomerSegment {
  if (!lastOrderAt) return 'lost'
  const days = (now - new Date(lastOrderAt).getTime()) / DAY
  if (days > 60) return 'lost'
  if (days > 30) return 'at_risk'
  if (completedOrders >= 3) return 'loyal'
  if (completedOrders >= 2) return 'regular'
  return 'new'
}
