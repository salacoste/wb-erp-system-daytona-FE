/**
 * Boundary Normalizer Tests — Advertising Analytics
 *
 * Covers the scalar helpers (toNum, toNullableNum, toStr) and the main
 * normalizeAdvertisingResponse function for nullability, type coercion,
 * and empty/full response shapes per CLAUDE.md § Boundary Normalizer Pattern.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAdvertisingResponse } from '../advertising-analytics-normalizer'

// ---------------------------------------------------------------------------
// Full response — happy path
// ---------------------------------------------------------------------------

describe('normalizeAdvertisingResponse', () => {
  it('maps a full backend response to the frontend-canonical shape', () => {
    const raw = {
      query: { cabinetId: 'cab-1', from: '2025-12-01', to: '2025-12-21', viewBy: 'sku' },
      items: [
        {
          key: 'item-1',
          nmId: 147205694,
          campaignId: 42,
          label: 'Футболка',
          brand: 'BrandX',
          category: 'Одежда',
          views: 1000,
          clicks: 50,
          orders: 10,
          spend: 500.5,
          totalSales: 5000,
          revenue: 4500,
          profit: 2000,
          organicSales: 300,
          organicContribution: 6.5,
          roas: 9.0,
          roi: 300,
          ctr: 5.0,
          cpc: 10.01,
          conversionRate: 20,
          profitAfterAds: 1500,
          efficiency: { status: 'excellent' },
        },
      ],
      summary: {
        totalSpend: 500.5,
        totalSales: 5000,
        totalRevenue: 4500,
        totalProfit: 2000,
        avgRoas: 9.0,
        avgRoi: 300,
        avgCtr: 5.0,
        avgConversionRate: 20,
        totalOrganicSales: 300,
        avgOrganicContribution: 6.5,
      },
      cachedAt: '2025-12-22T00:00:00Z',
      daily: [
        {
          date: '2025-12-01',
          spend: 100,
          views: 500,
          clicks: 25,
          orders: 5,
          ctr: 5.0,
          cpc: 4.0,
          revenueAttributed: 900,
        },
      ],
      multiCampaignSkuWarnings: [
        { nmId: 147205694, campaigns: [42, 99], message: 'SKU in multiple campaigns' },
      ],
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')

    // Meta
    expect(result.meta.cabinet_id).toBe('cab-1')
    expect(result.meta.date_range.from).toBe('2025-12-01')
    expect(result.meta.date_range.to).toBe('2025-12-21')
    expect(result.meta.view_by).toBe('sku')
    expect(result.meta.last_sync).toBe('2025-12-22T00:00:00Z')

    // Summary
    expect(result.summary.total_spend).toBe(500.5)
    expect(result.summary.total_sales).toBe(5000)
    expect(result.summary.total_revenue).toBe(4500)
    expect(result.summary.overall_roas).toBe(9.0)
    expect(result.summary.overall_roi).toBe(300)

    // Item
    const item = result.data[0]
    expect(item.key).toBe('item-1')
    expect(item.sku_id).toBe('147205694')
    expect(item.campaign_id).toBe(42)
    expect(item.product_name).toBe('Футболка')
    expect(item.brand).toBe('BrandX')
    expect(item.category).toBe('Одежда')
    expect(item.views).toBe(1000)
    expect(item.spend).toBe(500.5)
    expect(item.revenue).toBe(4500)
    expect(item.roas).toBe(9.0)
    expect(item.efficiency_status).toBe('excellent')

    // Daily
    expect(result.daily).toHaveLength(1)
    expect(result.daily![0].date).toBe('2025-12-01')
    expect(result.daily![0].spend).toBe(100)
    expect(result.daily![0].ctr).toBe(5.0)

    // Warnings
    expect(result.multiCampaignSkuWarnings).toHaveLength(1)
    expect(result.multiCampaignSkuWarnings![0].nmId).toBe(147205694)
    expect(result.multiCampaignSkuWarnings![0].campaigns).toEqual([42, 99])
  })

  // ---------------------------------------------------------------------------
  // Nullable / missing fields
  // ---------------------------------------------------------------------------

  it('preserves null for nullable numeric fields (anti-pattern #8)', () => {
    const raw = {
      items: [
        {
          key: 'item-null',
          nmId: 100,
          revenue: null,
          profit: null,
          roas: null,
          roi: null,
          efficiency: { status: null },
        },
      ],
      summary: { avgRoas: null, avgRoi: null },
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    const item = result.data[0]

    expect(item.revenue).toBeNull()
    expect(item.profit).toBeNull()
    expect(item.roas).toBeNull()
    expect(item.roi).toBeNull()
    expect(result.summary.overall_roas).toBeNull()
    expect(result.summary.overall_roi).toBeNull()
  })

  it('treats undefined nullable fields as null', () => {
    const raw = {
      items: [{ nmId: 100 }],
      summary: {},
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    const item = result.data[0]

    expect(item.revenue).toBeNull()
    expect(item.profit).toBeNull()
    expect(item.roas).toBeNull()
    expect(result.summary.overall_roas).toBeNull()
    expect(result.summary.overall_roi).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Type coercion edge cases
  // ---------------------------------------------------------------------------

  it('toNum: NaN and non-numeric coerce to 0', () => {
    const raw = {
      items: [
        { views: NaN, clicks: 'not-a-number', spend: undefined },
      ],
      summary: {},
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    const item = result.data[0]

    expect(item.views).toBe(0)
    expect(item.clicks).toBe(0)
    expect(item.spend).toBe(0)
  })

  it('toNullableNum: NaN on a present field returns null', () => {
    const raw = {
      items: [{ nmId: 100, revenue: NaN, roas: 'bad' }],
      summary: {},
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    const item = result.data[0]

    expect(item.revenue).toBeNull()
    expect(item.roas).toBeNull()
  })

  it('toStr: empty string on label becomes undefined for product_name', () => {
    const raw = {
      items: [{ nmId: 100, label: '', brand: '', category: '' }],
      summary: {},
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    const item = result.data[0]

    expect(item.product_name).toBeUndefined()
    expect(item.brand).toBeUndefined()
    expect(item.category).toBeUndefined()
  })

  it('campaign_id is returned as number, not string', () => {
    const raw = {
      items: [{ nmId: 100, campaignId: '42' }],
      summary: {},
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.data[0].campaign_id).toBe(42)
    expect(typeof result.data[0].campaign_id).toBe('number')
  })

  // ---------------------------------------------------------------------------
  // Empty / missing arrays
  // ---------------------------------------------------------------------------

  it('empty items array produces empty data', () => {
    const raw = { items: [], summary: {} }
    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.data).toEqual([])
  })

  it('missing items array produces empty data', () => {
    const raw = { summary: {} }
    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.data).toEqual([])
  })

  it('missing daily array omits daily from result', () => {
    const raw = { items: [], summary: {} }
    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.daily).toBeUndefined()
  })

  it('missing multiCampaignSkuWarnings omits from result', () => {
    const raw = { items: [], summary: {} }
    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.multiCampaignSkuWarnings).toBeUndefined()
  })

  // ---------------------------------------------------------------------------
  // Null/undefined root input
  // ---------------------------------------------------------------------------

  it('null root input produces safe empty shape', () => {
    const result = normalizeAdvertisingResponse(null, '2025-12-01', '2025-12-21')
    expect(result.data).toEqual([])
    expect(result.summary.total_spend).toBe(0)
    expect(result.meta.cabinet_id).toBe('unknown')
    expect(result.meta.date_range.from).toBe('2025-12-01')
    expect(result.daily).toBeUndefined()
    expect(result.multiCampaignSkuWarnings).toBeUndefined()
  })

  it('undefined root input produces safe empty shape', () => {
    const result = normalizeAdvertisingResponse(undefined, '2025-12-01', '2025-12-21')
    expect(result.data).toEqual([])
    expect(result.meta.view_by).toBe('sku')
  })

  // ---------------------------------------------------------------------------
  // Meta fallbacks
  // ---------------------------------------------------------------------------

  it('meta falls back to params when query fields are missing', () => {
    const raw = { items: [], summary: {} }
    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-31', 'campaign')

    expect(result.meta.date_range.from).toBe('2025-12-01')
    expect(result.meta.date_range.to).toBe('2025-12-31')
    expect(result.meta.view_by).toBe('campaign')
    expect(result.meta.last_sync).toBeTruthy()
  })

  it('meta falls back to "sku" view_by when neither query nor param provided', () => {
    const raw = { items: [], summary: {} }
    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.meta.view_by).toBe('sku')
  })

  // ---------------------------------------------------------------------------
  // Efficiency status fallback
  // ---------------------------------------------------------------------------

  it('efficiency_status defaults to "unknown" when status is empty or missing', () => {
    const raw = {
      items: [
        { nmId: 1, efficiency: {} },
        { nmId: 2, efficiency: { status: '' } },
      ],
      summary: {},
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.data[0].efficiency_status).toBe('unknown')
    expect(result.data[1].efficiency_status).toBe('unknown')
  })

  // ---------------------------------------------------------------------------
  // Key fallback
  // ---------------------------------------------------------------------------

  it('item key falls back to "item-{index}" when key is empty', () => {
    const raw = {
      items: [{ nmId: 1 }, { nmId: 2, key: '' }],
      summary: {},
    }

    const result = normalizeAdvertisingResponse(raw, '2025-12-01', '2025-12-21')
    expect(result.data[0].key).toBe('item-0')
    expect(result.data[1].key).toBe('item-1')
  })
})
