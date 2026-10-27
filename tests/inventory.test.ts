import { describe, expect, it } from 'vitest'
import {
  canMakeOne,
  consumptionByLine,
  marginRate,
  optionKey,
  recipeCost,
  sumUsage,
  weightedAverageCost,
  type RecipeBook,
} from '#shared/utils/inventory'

describe('weightedAverageCost', () => {
  it('blends the existing stock with the new delivery', () => {
    // 1.000g at 20đ + 1.000g at 30đ -> 25đ
    expect(weightedAverageCost(1000, 20, 1000, 30)).toBe(25)
  })

  it('restarts from the purchase price when stock is empty or negative', () => {
    expect(weightedAverageCost(0, 20, 500, 30)).toBe(30)
    expect(weightedAverageCost(-200, 20, 500, 30)).toBe(30)
  })
})

describe('consumption', () => {
  // 1 = đậu xanh (g), 2 = nước cốt dừa (ml), 3 = trân châu (g), 4 = đường (g), 5 = đá (g)
  const book: RecipeBook = {
    products: new Map([
      [10, [{ ingredientId: 1, quantity: 40 }, { ingredientId: 2, quantity: 30 }]],
      [11, [{ ingredientId: 2, quantity: 50 }]],
    ]),
    options: new Map([
      [optionKey('topping', 'Trân châu'), [{ ingredientId: 3, quantity: 20 }]],
      [optionKey('sugar', '100% đường'), [{ ingredientId: 4, quantity: 15 }]],
      [optionKey('ice', 'Đá riêng'), [{ ingredientId: 5, quantity: 150 }]],
    ]),
  }

  it('adds product recipe, chosen options and toppings, times the quantity', () => {
    const [line] = consumptionByLine(
      [{ productId: 10, quantity: 2, sugar: '100% đường', ice: 'Đá riêng', toppings: ['Trân châu'] }],
      book
    )
    expect(Object.fromEntries(line!)).toEqual({ 1: 80, 2: 60, 3: 40, 4: 30, 5: 300 })
  })

  it('ignores options without a recipe and deleted products', () => {
    const lines = consumptionByLine(
      [
        { productId: 11, quantity: 1, sugar: '50% đường', ice: '', toppings: ['Thạch dừa'] },
        { productId: null, quantity: 3, sugar: '', ice: '', toppings: [] },
      ],
      book
    )
    expect(Object.fromEntries(lines[0]!)).toEqual({ 2: 50 })
    expect(lines[1]!.size).toBe(0)
    expect(Object.fromEntries(sumUsage(lines))).toEqual({ 2: 50 })
  })
})

describe('recipes', () => {
  const recipe = [
    { ingredientId: 1, quantity: 40 },
    { ingredientId: 2, quantity: 30 },
  ]

  it('prices a serving at average cost', () => {
    expect(recipeCost(recipe, new Map([[1, 50], [2, 100]]))).toBe(5000)
  })

  it('knows when one more serving is possible', () => {
    expect(canMakeOne(recipe, new Map([[1, 40], [2, 30]]))).toBe(true)
    expect(canMakeOne(recipe, new Map([[1, 39.9], [2, 300]]))).toBe(false)
    expect(canMakeOne([], new Map())).toBe(true)
  })

  it('computes the margin', () => {
    expect(marginRate(35000, 10500)).toBeCloseTo(0.7)
    expect(marginRate(0, 100)).toBeNull()
  })
})
