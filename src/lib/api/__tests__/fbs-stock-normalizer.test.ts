/**
 * Boundary Normalizer Tests — FBS Stock — Story 96.11-FE
 *
 * Verifies the 3 normalizer functions in fbs-stock-normalizer.ts:
 *   - normalizeFbsStockGroupsResponse
 *   - normalizeFbsStockSizesResponse
 *   - normalizeFbsStockRegionsResponse
 *
 * Key assertions per CLAUDE.md § Boundary Normalizer Pattern:
 *   - Dual-lookup: both snake_case and camelCase inputs normalize correctly.
 *   - Null-preservation: stockValue/daysOfCover preserve null (anti-pattern #8).
 *   - Empty-array: missing/malformed arrays produce empty arrays (not crashes).
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeFbsStockGroupsResponse,
  normalizeFbsStockSizesResponse,
  normalizeFbsStockRegionsResponse,
} from '../fbs-stock-normalizer'

// ---------------------------------------------------------------------------
// normalizeFbsStockGroupsResponse
// ---------------------------------------------------------------------------

describe('normalizeFbsStockGroupsResponse', () => {
  it('happy path: snake_case input maps to camelCase frontend shape', () => {
    const raw = {
      data: {
        groups: [
          {
            group_name: 'Одежда',
            sku_count: 15,
            stock_units: 120,
            stock_value: 45000.5,
            average_daily_outgoing: 3,
            days_of_cover: 40.0,
          },
        ],
      },
      period: { from: '2026-04-01', to: '2026-04-30' },
      generated_at: '2026-04-30T12:00:00Z',
    }
    const result = normalizeFbsStockGroupsResponse(raw)
    expect(result.generatedAt).toBe('2026-04-30T12:00:00Z')
    expect(result.period.from).toBe('2026-04-01')
    expect(result.period.to).toBe('2026-04-30')
    expect(result.data.groups).toHaveLength(1)
    const g = result.data.groups[0]
    expect(g.groupName).toBe('Одежда')
    expect(g.skuCount).toBe(15)
    expect(g.stockUnits).toBe(120)
    expect(g.stockValue).toBe(45000.5)
    expect(g.averageDailyOutgoing).toBe(3)
    expect(g.daysOfCover).toBe(40.0)
  })

  it('camelCase input (dual-lookup fallback) normalizes correctly', () => {
    const raw = {
      data: {
        groups: [
          {
            groupName: 'Обувь',
            skuCount: 5,
            stockUnits: 30,
            stockValue: 12000,
            averageDailyOutgoing: 1,
            daysOfCover: 30,
          },
        ],
      },
      period: { from: '2026-04-01', to: '2026-04-07' },
      generatedAt: '2026-04-07T10:00:00Z',
    }
    const result = normalizeFbsStockGroupsResponse(raw)
    const g = result.data.groups[0]
    expect(g.groupName).toBe('Обувь')
    expect(g.stockValue).toBe(12000)
    expect(result.generatedAt).toBe('2026-04-07T10:00:00Z')
  })

  it('null stockValue is preserved as null (CLAUDE.md anti-pattern #8)', () => {
    const raw = {
      data: {
        groups: [
          {
            group_name: 'Аксессуары',
            sku_count: 2,
            stock_units: 10,
            stock_value: null,
            average_daily_outgoing: 0,
            days_of_cover: null,
          },
        ],
      },
      period: { from: '', to: '' },
      generated_at: '',
    }
    const result = normalizeFbsStockGroupsResponse(raw)
    const g = result.data.groups[0]
    expect(g.stockValue).toBeNull()
    expect(g.daysOfCover).toBeNull()
  })

  it('missing groups array produces empty array (no crash)', () => {
    const result = normalizeFbsStockGroupsResponse({ data: {}, period: {}, generated_at: '' })
    expect(result.data.groups).toEqual([])
  })

  it('null/undefined input produces safe empty shape', () => {
    const result = normalizeFbsStockGroupsResponse(null)
    expect(result.data.groups).toEqual([])
    expect(result.period.from).toBe('')
    expect(result.generatedAt).toBe('')
  })
})

// ---------------------------------------------------------------------------
// normalizeFbsStockSizesResponse
// ---------------------------------------------------------------------------

describe('normalizeFbsStockSizesResponse', () => {
  it('happy path: snake_case input maps to camelCase frontend shape', () => {
    const raw = {
      data: {
        sizes: [
          {
            size: 'XL',
            nm_id: 987654,
            sku_count: 3,
            stock_units: 25,
            average_daily_outgoing: 2,
            days_of_cover: 12.5,
          },
        ],
      },
      period: { from: '2026-04-01', to: '2026-04-30' },
      generated_at: '2026-04-30T08:00:00Z',
    }
    const result = normalizeFbsStockSizesResponse(raw)
    expect(result.data.sizes).toHaveLength(1)
    const s = result.data.sizes[0]
    expect(s.size).toBe('XL')
    expect(s.nmId).toBe(987654)
    expect(s.skuCount).toBe(3)
    expect(s.stockUnits).toBe(25)
    expect(s.averageDailyOutgoing).toBe(2)
    expect(s.daysOfCover).toBe(12.5)
  })

  it('null daysOfCover is preserved as null (CLAUDE.md anti-pattern #8)', () => {
    const raw = {
      data: {
        sizes: [
          {
            size: 'S',
            nm_id: 111,
            sku_count: 1,
            stock_units: 0,
            average_daily_outgoing: 0,
            days_of_cover: null,
          },
        ],
      },
      period: { from: '', to: '' },
      generated_at: '',
    }
    const result = normalizeFbsStockSizesResponse(raw)
    expect(result.data.sizes[0].daysOfCover).toBeNull()
  })

  it('missing sizes array produces empty array', () => {
    const result = normalizeFbsStockSizesResponse({ data: {}, period: {}, generated_at: '' })
    expect(result.data.sizes).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// normalizeFbsStockRegionsResponse
// ---------------------------------------------------------------------------

describe('normalizeFbsStockRegionsResponse', () => {
  it('happy path: snake_case input maps to camelCase frontend shape', () => {
    const raw = {
      data: {
        regions: [
          {
            region_name: 'Центральный',
            warehouse_count: 5,
            stock_units: 500,
            stock_value: 200000,
            share_of_total_pct: 45.2,
          },
        ],
      },
      generated_at: '2026-04-30T06:00:00Z',
    }
    const result = normalizeFbsStockRegionsResponse(raw)
    expect(result.generatedAt).toBe('2026-04-30T06:00:00Z')
    expect(result.data.regions).toHaveLength(1)
    const r = result.data.regions[0]
    expect(r.regionName).toBe('Центральный')
    expect(r.warehouseCount).toBe(5)
    expect(r.stockUnits).toBe(500)
    expect(r.stockValue).toBe(200000)
    expect(r.shareOfTotalPct).toBe(45.2)
  })

  it('null stockValue is preserved as null (CLAUDE.md anti-pattern #8)', () => {
    const raw = {
      data: {
        regions: [
          {
            region_name: 'Сибирь',
            warehouse_count: 2,
            stock_units: 10,
            stock_value: null,
            share_of_total_pct: 5,
          },
        ],
      },
      generated_at: '',
    }
    const result = normalizeFbsStockRegionsResponse(raw)
    expect(result.data.regions[0].stockValue).toBeNull()
  })

  it('null shareOfTotalPct is preserved as null (CLAUDE.md anti-pattern #8 — ratio)', () => {
    const raw = {
      data: {
        regions: [
          {
            region_name: 'Дальний Восток',
            warehouse_count: 1,
            stock_units: 5,
            stock_value: null,
            share_of_total_pct: null,
          },
        ],
      },
      generated_at: '',
    }
    const result = normalizeFbsStockRegionsResponse(raw)
    expect(result.data.regions[0].shareOfTotalPct).toBeNull()
  })

  it('missing regions array produces empty array', () => {
    const result = normalizeFbsStockRegionsResponse({ data: {}, generated_at: '' })
    expect(result.data.regions).toEqual([])
  })

  it('null/undefined input produces safe empty shape (no period field expected)', () => {
    const result = normalizeFbsStockRegionsResponse(undefined)
    expect(result.data.regions).toEqual([])
    expect(result.generatedAt).toBe('')
  })
})
