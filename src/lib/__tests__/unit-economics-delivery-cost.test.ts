/**
 * Unit tests for Story 77.4: delivery_to_warehouse cost category
 * Tests: type extensions, COST_CATEGORIES config, waterfall transform, WB fees exclusion
 */
import { describe, it, expect } from 'vitest'
import type { CostsPct, CostsRub, CostCategoryConfig } from '@/types/unit-economics'
import { COST_CATEGORIES } from '@/lib/unit-economics-config'
import {
  transformToWaterfallData,
  calculateWbFeesPct,
  calculateWbFeesRub,
} from '@/lib/unit-economics-utils'

describe('delivery_to_warehouse type extensions', () => {
  it('CostsPct accepts delivery_to_warehouse as optional', () => {
    const withDelivery: CostsPct = {
      cogs: 30,
      commission: 10,
      logistics_delivery: 8,
      logistics_return: 2,
      storage: 5,
      paid_acceptance: 1,
      penalties: 0.5,
      other_deductions: 1,
      advertising: 3,
      delivery_to_warehouse: 4.2,
    }
    expect(withDelivery.delivery_to_warehouse).toBe(4.2)
  })

  it('CostsPct works without delivery_to_warehouse', () => {
    const without: CostsPct = {
      cogs: 30,
      commission: 10,
      logistics_delivery: 8,
      logistics_return: 2,
      storage: 5,
      paid_acceptance: 1,
      penalties: 0.5,
      other_deductions: 1,
      advertising: 3,
    }
    expect(without.delivery_to_warehouse).toBeUndefined()
  })

  it('CostsRub accepts delivery_to_warehouse as optional', () => {
    const withDelivery: CostsRub = {
      cogs: 300,
      commission: 100,
      logistics_delivery: 80,
      logistics_return: 20,
      storage: 50,
      paid_acceptance: 10,
      penalties: 5,
      other_deductions: 10,
      advertising: 30,
      delivery_to_warehouse: 42,
    }
    expect(withDelivery.delivery_to_warehouse).toBe(42)
  })

  it('CostCategoryConfig supports seller_costs group', () => {
    const config: CostCategoryConfig = {
      key: 'delivery_to_warehouse',
      label: 'Доставка на склад',
      color: '#06B6D4',
      group: 'seller_costs',
    }
    expect(config.group).toBe('seller_costs')
  })
})

describe('COST_CATEGORIES includes delivery_to_warehouse', () => {
  const deliveryCategory = COST_CATEGORIES.find(c => c.key === 'delivery_to_warehouse')

  it('exists in COST_CATEGORIES', () => {
    expect(deliveryCategory).toBeDefined()
  })

  it('has correct label and color', () => {
    expect(deliveryCategory!.label).toBe('Доставка на склад')
    expect(deliveryCategory!.color).toBe('#06B6D4')
    expect(deliveryCategory!.group).toBe('seller_costs')
  })

  it('is positioned after storage and before paid_acceptance', () => {
    const keys = COST_CATEGORIES.map(c => c.key)
    const storageIdx = keys.indexOf('storage')
    const deliveryIdx = keys.indexOf('delivery_to_warehouse')
    const acceptanceIdx = keys.indexOf('paid_acceptance')
    expect(deliveryIdx).toBe(storageIdx + 1)
    expect(deliveryIdx).toBe(acceptanceIdx - 1)
  })

  it('has 10 total categories', () => {
    expect(COST_CATEGORIES).toHaveLength(10)
  })
})

describe('transformToWaterfallData with delivery_to_warehouse', () => {
  const baseCostsPct: CostsPct = {
    cogs: 30,
    commission: 10,
    logistics_delivery: 8,
    logistics_return: 2,
    storage: 5,
    paid_acceptance: 1,
    penalties: 0.5,
    other_deductions: 1,
    advertising: 3,
  }
  const baseCostsRub: CostsRub = {
    cogs: 300,
    commission: 100,
    logistics_delivery: 80,
    logistics_return: 20,
    storage: 50,
    paid_acceptance: 10,
    penalties: 5,
    other_deductions: 10,
    advertising: 30,
  }

  it('includes delivery_to_warehouse bar when present and > 0', () => {
    const costsPct: CostsPct = { ...baseCostsPct, delivery_to_warehouse: 4.2 }
    const costsRub: CostsRub = { ...baseCostsRub, delivery_to_warehouse: 42 }
    const result = transformToWaterfallData(1000, costsPct, costsRub)

    const deliveryBar = result.find(d => d.name === 'Доставка на склад')
    expect(deliveryBar).toBeDefined()
    expect(deliveryBar!.value).toBe(-42)
    expect(deliveryBar!.color).toBe('#06B6D4')
  })

  it('omits delivery_to_warehouse bar when absent', () => {
    const result = transformToWaterfallData(1000, baseCostsPct, baseCostsRub)
    const deliveryBar = result.find(d => d.name === 'Доставка на склад')
    expect(deliveryBar).toBeUndefined()
  })

  it('omits delivery_to_warehouse bar when zero', () => {
    const costsPct: CostsPct = { ...baseCostsPct, delivery_to_warehouse: 0 }
    const costsRub: CostsRub = { ...baseCostsRub, delivery_to_warehouse: 0 }
    const result = transformToWaterfallData(1000, costsPct, costsRub)
    const deliveryBar = result.find(d => d.name === 'Доставка на склад')
    expect(deliveryBar).toBeUndefined()
  })

  it('correctly adjusts running total when delivery_to_warehouse present', () => {
    const costsRub: CostsRub = {
      cogs: 0,
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
      penalties: 0,
      other_deductions: 0,
      advertising: 0,
      delivery_to_warehouse: 100,
    }
    const costsPct: CostsPct = {
      cogs: 0,
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
      penalties: 0,
      other_deductions: 0,
      advertising: 0,
      delivery_to_warehouse: 10,
    }
    const result = transformToWaterfallData(1000, costsPct, costsRub)
    const profitBar = result.find(d => d.isProfit)
    expect(profitBar!.runningTotal).toBe(900)
  })
})

describe('calculateWbFeesPct/Rub excludes delivery_to_warehouse', () => {
  it('calculateWbFeesPct does NOT include delivery_to_warehouse', () => {
    const costsPct: CostsPct = {
      cogs: 30,
      commission: 10,
      logistics_delivery: 8,
      logistics_return: 2,
      storage: 5,
      paid_acceptance: 1,
      penalties: 0.5,
      other_deductions: 1,
      advertising: 3,
      delivery_to_warehouse: 4.2,
    }
    const wbFees = calculateWbFeesPct(costsPct)
    // Should be: 10 + 8 + 2 + 5 + 1 = 26 (NOT 30.2)
    expect(wbFees).toBe(26)
  })

  it('calculateWbFeesRub does NOT include delivery_to_warehouse', () => {
    const costsRub: CostsRub = {
      cogs: 300,
      commission: 100,
      logistics_delivery: 80,
      logistics_return: 20,
      storage: 50,
      paid_acceptance: 10,
      penalties: 5,
      other_deductions: 10,
      advertising: 30,
      delivery_to_warehouse: 42,
    }
    const wbFees = calculateWbFeesRub(costsRub)
    // Should be: 100 + 80 + 20 + 50 + 10 = 260 (NOT 302)
    expect(wbFees).toBe(260)
  })
})
