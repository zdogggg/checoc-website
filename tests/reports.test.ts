import { describe, expect, it } from 'vitest'
import {
  compactVnd,
  eachDay,
  isIsoDay,
  niceScale,
  pctChange,
  presetRange,
  previousRange,
  rangeDays,
} from '#shared/utils/reports'

describe('date ranges', () => {
  it('builds presets from the shop day', () => {
    expect(presetRange('today', '2026-10-27')).toEqual({ from: '2026-10-27', to: '2026-10-27' })
    expect(presetRange('7d', '2026-10-27')).toEqual({ from: '2026-10-21', to: '2026-10-27' })
    expect(presetRange('this-month', '2026-10-27')).toEqual({ from: '2026-10-01', to: '2026-10-27' })
    expect(presetRange('last-month', '2026-03-15')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(presetRange('last-month', '2026-01-05')).toEqual({ from: '2025-12-01', to: '2025-12-31' })
  })

  it('finds the previous period of the same length', () => {
    expect(previousRange('2026-10-21', '2026-10-27')).toEqual({ from: '2026-10-14', to: '2026-10-20' })
    expect(previousRange('2026-03-01', '2026-03-01')).toEqual({ from: '2026-02-28', to: '2026-02-28' })
  })

  it('counts and lists days inclusively', () => {
    expect(rangeDays('2026-10-01', '2026-10-31')).toBe(31)
    expect(eachDay('2026-02-27', '2026-03-02')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'])
  })

  it('validates calendar days', () => {
    expect(isIsoDay('2026-02-28')).toBe(true)
    expect(isIsoDay('2026-02-30')).toBe(false)
    expect(isIsoDay('26-2-1')).toBe(false)
  })
})

describe('numbers', () => {
  it('computes relative change, null without a baseline', () => {
    expect(pctChange(150, 100)).toBe(0.5)
    expect(pctChange(50, 100)).toBe(-0.5)
    expect(pctChange(10, 0)).toBeNull()
  })

  it('compacts VND for axis ticks', () => {
    expect(compactVnd(950)).toBe('950')
    expect(compactVnd(12_400)).toBe('12K')
    expect(compactVnd(1_250_000)).toBe('1,3Tr')
  })

  it('rounds axis maxima to clean steps', () => {
    expect(niceScale(87_000)).toEqual({ max: 100_000, step: 25_000 })
    expect(niceScale(3)).toEqual({ max: 3, step: 1 })
    expect(niceScale(0)).toEqual({ max: 4, step: 1 })
    // Counts: 2 orders must not produce 0.5 steps
    expect(niceScale(2)).toEqual({ max: 2, step: 0.5 })
    expect(niceScale(2, 4, true)).toEqual({ max: 2, step: 1 })
  })
})
