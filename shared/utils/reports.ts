// Date-range helpers for reports. Dates are shop-local calendar days as "YYYY-MM-DD"
// strings; arithmetic is done on UTC midnights so time zones never shift a day.

export type RangePreset = 'today' | '7d' | '30d' | '90d' | 'this-month' | 'last-month'

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: 'this-month', label: 'Tháng này' },
  { value: 'last-month', label: 'Tháng trước' },
]

export const MAX_RANGE_DAYS = 366

const DAY = 86_400_000
const toUtc = (d: string) => Date.parse(`${d}T00:00:00Z`)
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export const addDays = (d: string, n: number) => fromUtc(toUtc(d) + n * DAY)

// Inclusive number of days in a range
export const rangeDays = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / DAY) + 1

export function presetRange(preset: RangePreset, today: string): { from: string; to: string } {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case '7d':
      return { from: addDays(today, -6), to: today }
    case '30d':
      return { from: addDays(today, -29), to: today }
    case '90d':
      return { from: addDays(today, -89), to: today }
    case 'this-month':
      return { from: `${today.slice(0, 7)}-01`, to: today }
    case 'last-month': {
      const firstThisMonth = `${today.slice(0, 7)}-01`
      const lastPrev = addDays(firstThisMonth, -1)
      return { from: `${lastPrev.slice(0, 7)}-01`, to: lastPrev }
    }
  }
}

// The period of the same length right before [from, to]
export function previousRange(from: string, to: string): { from: string; to: string } {
  const days = rangeDays(from, to)
  return { from: addDays(from, -days), to: addDays(from, -1) }
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  return days
}

// Relative change, null when there is nothing to compare against
export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null
  return (current - previous) / Math.abs(previous)
}

export const isIsoDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUtc(s)) && fromUtc(toUtc(s)) === s

// Compact VND for axis ticks: 950 / 12K / 1,2Tr
export function compactVnd(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Tr`
  if (abs >= 1_000) return `${Math.round(n / 1_000).toLocaleString('vi-VN')}K`
  return n.toLocaleString('vi-VN')
}

// "Nice" upper bound and step for an axis that starts at 0.
// integer: counts (orders, cups) never get fractional ticks.
export function niceScale(max: number, ticks = 4, integer = false): { max: number; step: number } {
  if (max <= 0) return { max: ticks, step: 1 }
  const rough = max / ticks
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  let step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!
  if (integer) step = Math.max(1, Math.ceil(step))
  return { max: step * Math.ceil(max / step), step }
}
