/**
 * Boundary normalizer tests for advertising-campaigns, liquidity-trends,
 * orders-detail, fbs-backfill, and tariffs-admin.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeCampaign,
  normalizeCampaignsResponse,
  normalizeSyncStatusResponse,
} from '../advertising-campaigns-normalizer'
import { normalizeLiquidityTrendsResponse } from '../liquidity-normalizer'
import { normalizeOrderDetail } from '../orders-detail-normalizer'
import { normalizeBackfillStatusResponse } from '../fbs-backfill-normalizer'
import { normalizeTariffAuditResponse } from '../tariffs-admin-normalizer'

// ---------------------------------------------------------------------------
// Advertising Campaigns
// ---------------------------------------------------------------------------

describe('normalizeCampaign', () => {
  const fullRaw = {
    id: 'c-1',
    advertId: 100,
    name: 'Test Campaign',
    type: 8,
    typeLabel: 'Поиск',
    status: 9,
    statusLabel: 'Активна',
    nmIds: [123, 456],
    productsCount: 2,
    budget: null,
    dailyBudget: 500,
    startDate: '2026-01-01',
    endDate: '2026-02-01',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    placements: { search: true, recommendations: false },
  }

  it('fully-populated normalizes correctly', () => {
    const result = normalizeCampaign(fullRaw)
    expect(result.campaign_id).toBe(100)
    expect(result.name).toBe('Test Campaign')
    expect(result.type_name).toBe('Поиск')
    expect(result.status).toBe(9)
    expect(result.nm_ids).toEqual(['123', '456'])
    expect(result.sku_count).toBe(2)
    expect(result.placements).toEqual({ search: true, recommendations: false, carousel: undefined })
  })

  it('missing fields default safely', () => {
    const result = normalizeCampaign({})
    expect(result.campaign_id).toBe(0)
    expect(result.type_name).toBe('Неизвестно')
    expect(result.nm_ids).toEqual([])
    expect(result.placements).toBeNull()
    expect(result.end_time).toBeNull()
  })

  it('null endDate preserved as null', () => {
    const result = normalizeCampaign({ ...fullRaw, endDate: null })
    expect(result.end_time).toBeNull()
  })
})

describe('normalizeCampaignsResponse', () => {
  it('counts active campaigns (status=9)', () => {
    const result = normalizeCampaignsResponse({
      campaigns: [
        { advertId: 1, status: 9 },
        { advertId: 2, status: 7 },
        { advertId: 3, status: 9 },
      ],
      total: 3,
    })
    expect(result.meta.total_count).toBe(3)
    expect(result.meta.active_count).toBe(2)
    expect(result.data).toHaveLength(3)
  })

  it('non-array campaigns defaults to empty', () => {
    const result = normalizeCampaignsResponse({})
    expect(result.data).toEqual([])
    expect(result.meta.total_count).toBe(0)
  })
})

describe('normalizeSyncStatusResponse', () => {
  it('fully-populated normalizes correctly', () => {
    const result = normalizeSyncStatusResponse({
      lastSyncAt: '2026-01-15T10:00:00Z',
      nextScheduledSync: '2026-01-16T10:00:00Z',
      status: 'completed',
      campaignsSynced: 42,
      dataAvailableFrom: '2026-01-01',
      dataAvailableTo: '2026-01-15',
      lastTask: {
        taskUuid: 'uuid-1',
        status: 'completed',
        startedAt: '2026-01-15T09:00:00Z',
        finishedAt: '2026-01-15T10:00:00Z',
        error: null,
      },
    })
    expect(result.lastSyncAt).toBe('2026-01-15T10:00:00Z')
    expect(result.campaignsSynced).toBe(42)
    expect(result.lastTask?.taskUuid).toBe('uuid-1')
    expect(result.lastTask?.error).toBeNull()
  })

  it('null fields preserved', () => {
    const result = normalizeSyncStatusResponse({})
    expect(result.lastSyncAt).toBeNull()
    expect(result.dataAvailableFrom).toBeNull()
    expect(result.lastTask).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Liquidity Trends
// ---------------------------------------------------------------------------

describe('normalizeLiquidityTrendsResponse', () => {
  it('fully-populated normalizes correctly', () => {
    const result = normalizeLiquidityTrendsResponse({
      meta: { cabinet_id: 'cab-1', period_days: 30, generated_at: '2026-01-15T00:00:00Z' },
      trends: [
        {
          date: '2026-01-01',
          distribution: { highly_liquid_pct: 40, medium_pct: 30, low_pct: 20, illiquid_pct: 10 },
          frozen_capital: 500000,
          avg_turnover_days: 14,
        },
      ],
      insights: [{ type: 'warning', message: 'Illiquid stock growing' }],
    })
    expect(result.meta.cabinet_id).toBe('cab-1')
    expect(result.trends).toHaveLength(1)
    expect(result.trends[0].distribution.illiquid_pct).toBe(10)
    expect(result.insights).toHaveLength(1)
    expect(result.insights[0].message).toBe('Illiquid stock growing')
  })

  it('missing arrays default to empty', () => {
    const result = normalizeLiquidityTrendsResponse({ meta: {} })
    expect(result.trends).toEqual([])
    expect(result.insights).toEqual([])
    expect(result.meta.cabinet_id).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Orders Detail
// ---------------------------------------------------------------------------

describe('normalizeOrderDetail', () => {
  const fullRaw = {
    orderId: '123456789',
    orderUid: 'uid-1',
    nmId: 98765,
    vendorCode: 'VC-001',
    productName: 'T-Shirt Blue',
    price: 1500,
    salePrice: 1200,
    supplierStatus: 'confirm',
    wbStatus: 'sold',
    warehouseId: 50,
    deliveryType: 'fbs',
    isB2B: false,
    cargoType: null,
    createdAt: '2026-01-10T08:00:00Z',
    statusUpdatedAt: '2026-01-10T12:00:00Z',
    chrtId: 54321,
    address: { fullAddress: 'Moscow, Tverskaya 1', longitude: 37.6, latitude: 55.7 },
    statusHistory: [
      { supplierStatus: 'new', wbStatus: 'waiting', changedAt: '2026-01-10T08:00:00Z' },
    ],
    processingTimeSeconds: 14400,
    syncedAt: '2026-01-10T13:00:00Z',
  }

  it('fully-populated normalizes correctly', () => {
    const result = normalizeOrderDetail(fullRaw)
    expect(result.orderId).toBe('123456789')
    expect(result.nmId).toBe(98765)
    expect(result.price).toBe(1500)
    expect(result.address?.fullAddress).toBe('Moscow, Tverskaya 1')
    expect(result.statusHistory).toHaveLength(1)
    expect(result.processingTimeSeconds).toBe(14400)
  })

  it('null productName preserved', () => {
    const result = normalizeOrderDetail({ ...fullRaw, productName: null })
    expect(result.productName).toBeNull()
  })

  it('null address preserved', () => {
    const result = normalizeOrderDetail({ ...fullRaw, address: null })
    expect(result.address).toBeNull()
  })

  it('missing fields default safely', () => {
    const result = normalizeOrderDetail({})
    expect(result.orderId).toBe('')
    expect(result.nmId).toBe(0)
    expect(result.isB2B).toBe(false)
    expect(result.statusHistory).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// FBS Backfill
// ---------------------------------------------------------------------------

describe('normalizeBackfillStatusResponse', () => {
  it('fully-populated normalizes correctly', () => {
    const result = normalizeBackfillStatusResponse([
      {
        cabinetId: 'cab-1',
        cabinetName: 'Test Cabinet',
        reportsStatus: 'completed',
        analyticsStatus: 'in_progress',
        overallProgress: 75,
        estimatedEta: '2026-01-20T00:00:00Z',
        errors: [],
      },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].cabinetId).toBe('cab-1')
    expect(result[0].overallProgress).toBe(75)
    expect(result[0].reportsStatus).toBe('completed')
  })

  it('null eta preserved', () => {
    const result = normalizeBackfillStatusResponse([{ estimatedEta: null }])
    expect(result[0].estimatedEta).toBeNull()
  })

  it('non-array returns empty', () => {
    expect(normalizeBackfillStatusResponse(null)).toEqual([])
    expect(normalizeBackfillStatusResponse('oops')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Tariffs Admin
// ---------------------------------------------------------------------------

describe('normalizeTariffAuditResponse', () => {
  it('fully-populated normalizes correctly', () => {
    const result = normalizeTariffAuditResponse({
      data: [
        {
          id: 1,
          action: 'UPDATE',
          field_name: 'baseLogisticsRate',
          old_value: '50',
          new_value: '55',
          user_id: 'user-1',
          user_email: 'admin@test.com',
          ip_address: '192.168.1.1',
          created_at: '2026-01-15T10:00:00Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 100, total_pages: 5 },
    })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].action).toBe('UPDATE')
    expect(result.data[0].old_value).toBe('50')
    expect(result.meta.total).toBe(100)
    expect(result.meta.total_pages).toBe(5)
  })

  it('null old_value/new_value preserved', () => {
    const result = normalizeTariffAuditResponse({
      data: [{ old_value: null, new_value: '10' }],
      meta: {},
    })
    expect(result.data[0].old_value).toBeNull()
    expect(result.data[0].new_value).toBe('10')
  })

  it('missing data defaults to empty array', () => {
    const result = normalizeTariffAuditResponse({})
    expect(result.data).toEqual([])
    expect(result.meta.total).toBe(0)
  })
})
