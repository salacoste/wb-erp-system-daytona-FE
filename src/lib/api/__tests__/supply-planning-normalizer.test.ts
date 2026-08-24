/**
 * Boundary Normalizer Tests — Supply Planning
 */

import { describe, it, expect } from 'vitest'
import { normalizeSupplyPlanningResponse } from '../supply-planning-normalizer'

describe('normalizeSupplyPlanningResponse', () => {
  const fullRaw = {
    meta: {
      cabinet_id: 'cab-1',
      velocity_weeks: 4,
      safety_stock_days: 14,
      stocks_updated_at: '2025-01-01T00:00:00Z',
      generated_at: '2025-01-01T12:00:00Z',
    },
    summary: {
      total_skus: 100,
      out_of_stock_count: 5,
      stockout_critical: 3,
      stockout_warning: 10,
      stockout_low: 15,
      healthy_stock: 67,
      reorder_urgent: 8,
      reorder_soon: 20,
      total_in_transit_units: 500,
      total_reorder_value: 150000,
    },
    data: [
      {
        sku_id: '12345',
        product_name: 'Product A',
        category: 'Electronics',
        brand: 'BrandX',
        current_stock: 50,
        in_transit: 10,
        effective_stock: 60,
        avg_daily_sales: 5.2,
        velocity_trend: 'growing',
        days_until_stockout: 11.5,
        stockout_date: '2025-01-12',
        stockout_risk: 'warning',
        safety_stock_units: 73,
        reorder_quantity: 23,
        reorder_status: 'soon',
        reorder_value: 11500,
        cogs_per_unit: 500,
        has_cogs: true,
        selling_price: 780,
        warehouses: [
          { name: 'Koledino', stock: 30 },
          { name: 'Electrostal', stock: 20 },
        ],
      },
    ],
  }

  it('maps full supply planning response', () => {
    const result = normalizeSupplyPlanningResponse(fullRaw)
    expect(result.meta.cabinet_id).toBe('cab-1')
    expect(result.summary.total_skus).toBe(100)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].sku_id).toBe('12345')
    expect(result.data[0].warehouses).toHaveLength(2)
    expect(result.data[0].reorder_value).toBe(11500)
  })

  it('handles null input', () => {
    const result = normalizeSupplyPlanningResponse(null)
    expect(result.meta.cabinet_id).toBe('')
    expect(result.summary.total_skus).toBe(0)
    expect(result.data).toHaveLength(0)
  })

  it('handles missing data array', () => {
    const result = normalizeSupplyPlanningResponse({ meta: {}, summary: {} })
    expect(result.data).toHaveLength(0)
  })

  it('handles item with missing optional fields', () => {
    const result = normalizeSupplyPlanningResponse({
      meta: {},
      summary: {},
      data: [{ sku_id: '123' }],
    })
    expect(result.data[0].category).toBeUndefined()
    expect(result.data[0].brand).toBeUndefined()
    expect(result.data[0].cogs_per_unit).toBeNull()
    expect(result.data[0].selling_price).toBeNull()
    expect(result.data[0].warehouses).toHaveLength(0)
  })

  it('handles missing reorder_value — falls to undefined (AP#8)', () => {
    const result = normalizeSupplyPlanningResponse({
      meta: {},
      summary: {},
      data: [{ sku_id: '123' }],
    })
    expect(result.data[0].reorder_value).toBeUndefined()
  })

  // Story 169.13 (pattern #218/#226): absent/unrecognized enum values must map to
  // 'unknown' — never an optimistic known tier.

  it('missing stockout_risk falls to unknown (NOT healthy)', () => {
    const result = normalizeSupplyPlanningResponse({
      meta: {},
      summary: {},
      data: [{ sku_id: '123' }],
    })
    expect(result.data[0].stockout_risk).toBe('unknown')
  })

  it('unrecognized stockout_risk falls to unknown', () => {
    const result = normalizeSupplyPlanningResponse({
      meta: {},
      summary: {},
      data: [{ sku_id: '123', stockout_risk: 'on-fire' }],
    })
    expect(result.data[0].stockout_risk).toBe('unknown')
  })

  it('missing reorder_status falls to unknown (NOT ok)', () => {
    const result = normalizeSupplyPlanningResponse({
      meta: {},
      summary: {},
      data: [{ sku_id: '123' }],
    })
    expect(result.data[0].reorder_status).toBe('unknown')
  })

  it('unrecognized reorder_status falls to unknown', () => {
    const result = normalizeSupplyPlanningResponse({
      meta: {},
      summary: {},
      data: [{ sku_id: '123', reorder_status: 42 }],
    })
    expect(result.data[0].reorder_status).toBe('unknown')
  })

  it('missing avg_daily_sales stays null (AP#8, no ?? 0)', () => {
    const result = normalizeSupplyPlanningResponse({
      meta: {},
      summary: {},
      data: [{ sku_id: '123' }],
    })
    expect(result.data[0].avg_daily_sales).toBeNull()
  })

  it('missing summary total_reorder_value stays null (AP#8, no ?? 0)', () => {
    const result = normalizeSupplyPlanningResponse({ meta: {}, summary: {} })
    expect(result.summary.total_reorder_value).toBeNull()
  })

  it('valid enum and numeric values pass through unchanged (regression pins)', () => {
    const result = normalizeSupplyPlanningResponse(fullRaw)
    expect(result.data[0].stockout_risk).toBe('warning')
    expect(result.data[0].reorder_status).toBe('soon')
    expect(result.data[0].avg_daily_sales).toBe(5.2)
    expect(result.summary.total_reorder_value).toBe(150000)
    expect(result.data[0].has_cogs).toBe(true)
  })
})
