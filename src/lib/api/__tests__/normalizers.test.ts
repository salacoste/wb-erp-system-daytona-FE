/**
 * Boundary Normalizer Tests — Story 89.1-FE
 * Tests all 5 normalizer modules for the top-5 high-risk API endpoints.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeCommissionsResponse,
  normalizeWarehousesResponse,
  normalizeAcceptanceCoefficientsResponse,
  normalizeTariffSettings,
} from '../tariffs-normalizer'
import {
  normalizeSuppliesListResponse,
  normalizeSupplyDetailResponse,
} from '../supplies-normalizer'
import {
  normalizeTrendsResponse,
  normalizeSeasonalResponse,
  normalizeCompareResponse,
} from '../fbs-analytics-normalizer'
import {
  normalizeLocalHistoryResponse,
  normalizeWbHistoryResponse,
  normalizeFullHistoryResponse,
} from '../orders-history-normalizer'
import {
  normalizeCabinetResponse,
  normalizeJamStatusResponse,
  normalizeSellerInfoResponse,
  normalizeTokenHealthResponse,
} from '../cabinet-normalizer'

// ============================================================================
// Tariffs Normalizers
// ============================================================================

describe('tariffs-normalizer', () => {
  describe('normalizeCommissionsResponse', () => {
    it('handles standard response shape', () => {
      const raw = {
        commissions: [
          {
            parentID: 1,
            parentName: 'Одежда',
            subjectID: 10,
            subjectName: 'Платья',
            paidStorageKgvp: 15,
            kgvpMarketplace: 18,
            kgvpSupplier: 20,
            kgvpSupplierExpress: 22,
          },
        ],
        meta: { total: 1, cached: true, cache_ttl_seconds: 86400, fetched_at: '2026-01-01' },
      }
      const result = normalizeCommissionsResponse(raw)
      expect(result.commissions).toHaveLength(1)
      expect(result.commissions[0].parentID).toBe(1)
      expect(result.meta.total).toBe(1)
      expect(result.meta.cached).toBe(true)
    })

    it('handles null/undefined input gracefully', () => {
      const result = normalizeCommissionsResponse(null)
      expect(result.commissions).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('handles camelCase field variants (backend drift)', () => {
      const raw = {
        commissions: [
          {
            parent_id: 5,
            parent_name: 'Test',
            subject_id: 50,
            subject_name: 'Sub',
            paid_storage_kgvp: 10,
            kgvp_marketplace: 12,
            kgvp_supplier: 14,
            kgvp_supplier_express: 16,
          },
        ],
        meta: { total: 1, cached: false, cacheTtlSeconds: 3600, fetchedAt: '2026-04-01' },
      }
      const result = normalizeCommissionsResponse(raw)
      expect(result.commissions[0].parentID).toBe(5)
      expect(result.commissions[0].parentName).toBe('Test')
      expect(result.meta.cache_ttl_seconds).toBe(3600)
    })
  })

  describe('normalizeWarehousesResponse', () => {
    it('normalizes standard response', () => {
      const raw = { warehouses: [{ id: 1, name: 'Подольск' }], updated_at: '2026-01-01' }
      const result = normalizeWarehousesResponse(raw)
      expect(result.warehouses).toHaveLength(1)
      expect(result.warehouses[0].name).toBe('Подольск')
    })

    it('handles empty warehouses', () => {
      const result = normalizeWarehousesResponse({})
      expect(result.warehouses).toEqual([])
    })
  })

  describe('normalizeAcceptanceCoefficientsResponse', () => {
    it('normalizes coefficients with delivery/storage', () => {
      const raw = {
        coefficients: [
          {
            warehouseId: 1,
            warehouseName: 'WH',
            date: '2026-01-01',
            coefficient: 1.5,
            isAvailable: true,
            allowUnload: true,
            boxTypeId: 2,
            boxTypeName: 'Box',
            delivery: { coefficient: 1.2, baseLiterRub: 10, additionalLiterRub: 5 },
            storage: { coefficient: 0.8, baseLiterRub: 3, additionalLiterRub: 1 },
            isSortingCenter: false,
          },
        ],
        meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 3600 },
      }
      const result = normalizeAcceptanceCoefficientsResponse(raw)
      expect(result.coefficients[0].delivery.baseLiterRub).toBe(10)
      expect(result.coefficients[0].storage.coefficient).toBe(0.8)
    })

    it('handles null input', () => {
      const result = normalizeAcceptanceCoefficientsResponse(null)
      expect(result.coefficients).toEqual([])
    })
  })

  describe('normalizeTariffSettings', () => {
    it('normalizes snake_case fields', () => {
      const raw = {
        default_commission_fbo_pct: 15,
        default_commission_fbs_pct: 18,
        acceptance_box_rate_per_liter: 5,
        acceptance_pallet_rate: 50,
        logistics_volume_tiers: [{ min: 0, max: 1, rate: 33 }],
        logistics_large_first_liter_rate: 10,
        logistics_large_additional_liter_rate: 5,
        return_logistics_fbo_rate: 20,
        return_logistics_fbs_rate: 25,
        storage_free_days: 1,
        fbs_uses_fbo_logistics_rates: true,
        effective_from: '2026-01-01',
      }
      const result = normalizeTariffSettings(raw)
      expect(result.default_commission_fbo_pct).toBe(15)
      expect(result.logistics_volume_tiers).toHaveLength(1)
      expect(result.fbs_uses_fbo_logistics_rates).toBe(true)
    })

    it('handles camelCase variant', () => {
      const raw = {
        defaultCommissionFboPct: 12,
        defaultCommissionFbsPct: 15,
        logisticsVolumeTiers: [],
      }
      const result = normalizeTariffSettings(raw)
      expect(result.default_commission_fbo_pct).toBe(12)
      expect(result.logistics_volume_tiers).toEqual([])
    })
  })
})

// ============================================================================
// Supplies Normalizers
// ============================================================================

describe('supplies-normalizer', () => {
  it('normalizes list response with items and pagination', () => {
    const raw = {
      items: [{ id: 'WB-123', name: 'Supply 1', status: 'OPEN', createdAt: '2026-01-01' }],
      pagination: { total: 1, limit: 50, offset: 0 },
    }
    const result = normalizeSuppliesListResponse(raw)
    expect(result.items).toHaveLength(1)
    expect(result.pagination.total).toBe(1)
  })

  it('handles null input', () => {
    const result = normalizeSuppliesListResponse(null)
    expect(result.items).toEqual([])
    expect(result.pagination.total).toBe(0)
  })

  it('normalizes detail response', () => {
    const raw = { id: 'WB-123', name: 'Test', status: 'OPEN', created_at: '2026-01-01' }
    const result = normalizeSupplyDetailResponse(raw)
    expect(result.id).toBe('WB-123')
    expect(result.createdAt).toBe('2026-01-01')
  })
})

// ============================================================================
// FBS Analytics Normalizers
// ============================================================================

describe('fbs-analytics-normalizer', () => {
  it('normalizes trends — null revenue coerced to 0 (type is non-nullable number)', () => {
    const raw = {
      trends: [
        { date: '2026-01-01', ordersCount: 10, revenue: null, cancellations: 1, returns: 2 },
      ],
      period: { from: '2026-01-01', to: '2026-01-07', daysIncluded: 7 },
    }
    const result = normalizeTrendsResponse(raw)
    // FBS TrendDataPoint.revenue is `number` (not nullable); null coerced to 0
    expect(result.trends[0].revenue).toBe(0)
    expect(result.trends[0].ordersCount).toBe(10)
  })

  it('normalizes seasonal response passthrough', () => {
    const raw = { patterns: { monthly: [1, 2, 3] }, summary: { avg: 5 }, insights: [] }
    const result = normalizeSeasonalResponse(raw)
    expect(result.patterns).toBeDefined()
  })

  it('normalizes compare with snake_case fallback', () => {
    const raw = { comparison: { orders_change_percent: 15, revenue_change_percent: -5 } }
    const result = normalizeCompareResponse(raw)
    expect(result.comparison.ordersChangePercent).toBe(15)
    expect(result.comparison.revenueChangePercent).toBe(-5)
  })
})

// ============================================================================
// Orders History Normalizers
// ============================================================================

describe('orders-history-normalizer', () => {
  it('normalizes local history with orderId fallback', () => {
    const raw = {
      order_id: 'ORD-1',
      current_status: 'delivered',
      entries: [{ status: 'new', created_at: '2026-01-01' }],
    }
    const result = normalizeLocalHistoryResponse(raw)
    expect(result.orderId).toBe('ORD-1')
    expect(result.currentStatus).toBe('delivered')
  })

  it('normalizes WB history with wbStatusCode', () => {
    const raw = {
      orderId: 'ORD-1',
      entries: [{ status: 'in_transit', dt: '2026-01-01', wb_status_code: 5 }],
    }
    const result = normalizeWbHistoryResponse(raw)
    expect(result.orderId).toBe('ORD-1')
  })

  it('normalizes full history with source discriminator', () => {
    const raw = {
      orderId: 'ORD-1',
      entries: [{ source: 'local', status: 'new', timestamp: '2026-01-01' }],
    }
    const result = normalizeFullHistoryResponse(raw)
    expect(result.orderId).toBe('ORD-1')
  })

  it('handles null input for all variants', () => {
    expect(normalizeLocalHistoryResponse(null).orderId).toBe('')
    expect(normalizeWbHistoryResponse(null).orderId).toBe('')
    expect(normalizeFullHistoryResponse(null).orderId).toBe('')
  })
})

// ============================================================================
// Cabinet Normalizers
// ============================================================================

describe('cabinet-normalizer', () => {
  it('normalizes cabinet with dual-lookup for tax fields', () => {
    const raw = { id: 'cab-1', name: 'Test', tax_system: 'usn6', vat_payer: true, vat_rate: 20 }
    const result = normalizeCabinetResponse(raw)
    expect(result.taxSystem).toBe('usn6')
    expect(result.vatPayer).toBe(true)
    expect(result.vatRate).toBe(20)
  })

  it('F-42: taxSystem null/unset/invalid → null (NOT "none"); valid values pass through', () => {
    // Backend sends taxSystem:null when unset — must stay null so the radio shows
    // "Не настроена" instead of matching no option (blank).
    expect(normalizeCabinetResponse({ id: 'c', name: 'N', taxSystem: null }).taxSystem).toBeNull()
    expect(normalizeCabinetResponse({ id: 'c', name: 'N' }).taxSystem).toBeNull()
    expect(normalizeCabinetResponse({ id: 'c', name: 'N', taxSystem: 'none' }).taxSystem).toBeNull()
    expect(
      normalizeCabinetResponse({ id: 'c', name: 'N', taxSystem: 'bogus' }).taxSystem
    ).toBeNull()
    expect(normalizeCabinetResponse({ id: 'c', name: 'N', taxSystem: 'usn15' }).taxSystem).toBe(
      'usn15'
    )
    expect(normalizeCabinetResponse({ id: 'c', name: 'N', tax_system: 'manual' }).taxSystem).toBe(
      'manual'
    )
  })

  it('normalizes jam status with unknown tier fallback', () => {
    const result = normalizeJamStatusResponse({ tier: 'super_new_tier', available: true })
    expect(result.tier).toBe('unknown')
    expect(result.available).toBe(true)
  })

  it('normalizes valid jam tiers (none | standard | advanced per JamTier union)', () => {
    expect(normalizeJamStatusResponse({ tier: 'standard' }).tier).toBe('standard')
    expect(normalizeJamStatusResponse({ tier: 'ADVANCED' }).tier).toBe('advanced')
    expect(normalizeJamStatusResponse({ tier: 'None' }).tier).toBe('none')
    // 'basic' and 'premium' are NOT in the JamTier union → fall back to 'unknown'
    expect(normalizeJamStatusResponse({ tier: 'basic' }).tier).toBe('unknown')
    expect(normalizeJamStatusResponse({ tier: 'premium' }).tier).toBe('unknown')
  })

  it('normalizes seller info with snake_case fallback', () => {
    const raw = { sid: 'seller-1', trade_mark: 'Brand', available: true, name: 'Seller' }
    const result = normalizeSellerInfoResponse(raw)
    expect(result.sid).toBe('seller-1')
    // Field is `tradeMark` (camelCase) in the type, not `trademark`
    expect(result.tradeMark).toBe('Brand')
    expect(result.name).toBe('Seller')
  })

  it('normalizes token health', () => {
    const raw = { is_healthy: false, last_checked_at: '2026-01-01', error_count: 3 }
    const result = normalizeTokenHealthResponse(raw)
    expect(result.healthy).toBe(false)
    expect(result.errorCount).toBe(3)
  })

  it('handles null input for all cabinet normalizers', () => {
    expect(normalizeCabinetResponse(null).id).toBe('')
    expect(normalizeJamStatusResponse(null).tier).toBe('unknown')
    expect(normalizeSellerInfoResponse(null).sid).toBe('')
    expect(normalizeTokenHealthResponse(null).healthy).toBe(true)
  })
})
