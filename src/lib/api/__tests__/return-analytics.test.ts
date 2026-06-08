/**
 * Return Analytics API Client Tests
 * Covers: getReturnReasons, getReturnsBySku (raw + pre-aggregated paths),
 * aggregateRawRecords (additional edge cases beyond existing aggregate test),
 * returnQueryKeys, RETURN_CACHE.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock normalizer — return realistic shape so source-code logging doesn't crash
vi.mock('../return-analytics-normalizer', () => ({
  normalizeReturnReasonsResponse: vi.fn(() => ({
    summary: {
      totalReturns: 0,
      cancelBeforeShipment: 0,
      refusalAtPvz: 0,
      returnAfterReceipt: 0,
      overallReturnRate: 0,
      classificationCoverage: 0,
    },
    byCategory: [],
    period: { from: '', to: '' },
  })),
}))

import { apiClient } from '../../api-client'
import {
  getReturnReasons,
  getReturnsBySku,
  aggregateRawRecords,
  returnQueryKeys,
  RETURN_CACHE,
} from '../return-analytics'
import { normalizeReturnReasonsResponse } from '../return-analytics-normalizer'

const mockGet = vi.mocked(apiClient.get)

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// getReturnReasons
// =============================================================================

describe('getReturnReasons', () => {
  it('calls GET /v1/analytics/returns/reasons with no params', async () => {
    mockGet.mockResolvedValueOnce({ summary: {}, byCategory: [], period: {} })
    await getReturnReasons()

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('/v1/analytics/returns/reasons?')
    // Empty URLSearchParams still produces "?" at end
  })

  it('appends from, to, locale params', async () => {
    mockGet.mockResolvedValueOnce({ summary: {}, byCategory: [], period: {} })
    await getReturnReasons('2025-01-01', '2025-01-07', 'en')

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('from=2025-01-01')
    expect(url).toContain('to=2025-01-07')
    expect(url).toContain('locale=en')
  })

  it('omits optional params when undefined', async () => {
    mockGet.mockResolvedValueOnce({})
    await getReturnReasons('2025-01-01')

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('from=2025-01-01')
    expect(url).not.toContain('to=')
    expect(url).not.toContain('locale=')
  })

  it('normalizes the raw response', async () => {
    const raw = { summary: { totalReturns: 10 }, byCategory: [], period: {} }
    mockGet.mockResolvedValueOnce(raw)

    const result = await getReturnReasons('2025-01-01', '2025-01-07')

    expect(normalizeReturnReasonsResponse).toHaveBeenCalledWith(raw)
    // Result is the normalizer's return value (mocked shape)
    expect(result.summary.totalReturns).toBe(0)
    expect(result.byCategory).toEqual([])
  })

  it('passes skipDataUnwrap: true', async () => {
    mockGet.mockResolvedValueOnce({})
    await getReturnReasons()

    expect(mockGet).toHaveBeenCalledWith(expect.any(String), { skipDataUnwrap: true })
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))
    await expect(getReturnReasons()).rejects.toThrow('Network error')
  })
})

// =============================================================================
// getReturnsBySku — raw records path
// =============================================================================

describe('getReturnsBySku — raw classification records', () => {
  it('detects raw format and aggregates records', async () => {
    const rawRecords = [
      { nmId: 100, returnCategory: 'cancel_before_shipment' },
      { nmId: 100, returnCategory: 'refusal_at_pvz' },
      { nmId: 200, returnCategory: 'return_after_receipt' },
    ]
    mockGet.mockResolvedValueOnce({
      data: rawRecords,
      pagination: { count: 3, hasMore: false },
    })

    const result = await getReturnsBySku({ from: '2025-01-01', to: '2025-01-07' })

    // Should aggregate into per-SKU items
    expect(result.data).toHaveLength(2)
    const sku100 = result.data.find(i => i.nmId === 100)
    expect(sku100).toBeDefined()
    expect(sku100!.totalReturns).toBe(2)
    expect(sku100!.cancelBeforeShipment).toBe(1)
    expect(sku100!.refusalAtPvz).toBe(1)
    expect(sku100!.returnRate).toBeNull() // raw records carry no salesCount
  })

  it('uses pagination from raw response when available', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ nmId: 1, returnCategory: 'cancel_before_shipment' }],
      pagination: { count: 50, hasMore: true },
    })

    const result = await getReturnsBySku({ from: '2025-01-01' })
    expect(result.pagination.count).toBe(50)
    expect(result.pagination.hasMore).toBe(true)
  })

  it('provides default pagination when missing from raw response', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ nmId: 1, returnCategory: 'cancel_before_shipment' }],
    })

    const result = await getReturnsBySku({})
    expect(result.pagination).toEqual({ count: 1, hasMore: false })
  })
})

// =============================================================================
// getReturnsBySku — pre-aggregated path
// =============================================================================

describe('getReturnsBySku — pre-aggregated response', () => {
  it('returns pre-aggregated data as-is when no returnCategory field', async () => {
    const preAggregated = {
      data: [{ nmId: 100, totalReturns: 5, returnRate: 0.12, anomalyFlag: false }],
      pagination: { count: 1, hasMore: false },
      summary: { totalSkus: 1, anomalyCount: 0 },
    }
    mockGet.mockResolvedValueOnce(preAggregated)

    const result = await getReturnsBySku({ from: '2025-01-01', to: '2025-01-07' })

    expect(result.data).toHaveLength(1)
    expect(result.data[0].totalReturns).toBe(5)
    expect(result.pagination.count).toBe(1)
    expect(result.summary.totalSkus).toBe(1)
  })

  it('returns empty data for empty response', async () => {
    mockGet.mockResolvedValueOnce({ data: [], pagination: { count: 0, hasMore: false } })

    const result = await getReturnsBySku({})
    expect(result.data).toHaveLength(0)
  })
})

// =============================================================================
// getReturnsBySku — query params
// =============================================================================

describe('getReturnsBySku — query parameter building', () => {
  it('sends all optional params', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })

    await getReturnsBySku({
      from: '2025-01-01',
      to: '2025-01-07',
      nmId: 12345,
      anomalyOnly: true,
      sortBy: 'totalReturns',
      sortOrder: 'desc',
      limit: 50,
      cursor: 'abc',
    })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('from=2025-01-01')
    expect(url).toContain('to=2025-01-07')
    expect(url).toContain('nmId=12345')
    expect(url).toContain('anomalyOnly=true')
    expect(url).toContain('sortBy=totalReturns')
    expect(url).toContain('sortOrder=desc')
    expect(url).toContain('limit=50')
    expect(url).toContain('cursor=abc')
  })

  it('omits undefined/null params', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })

    await getReturnsBySku({ from: '2025-01-01' })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('from=2025-01-01')
    expect(url).not.toContain('to=')
    expect(url).not.toContain('nmId=')
    expect(url).not.toContain('anomalyOnly=')
    expect(url).not.toContain('sortBy=')
  })

  it('sends nmId=0 when explicitly 0', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })

    await getReturnsBySku({ nmId: 0 })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('nmId=0')
  })

  it('sends anomalyOnly=false when explicitly false', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })

    await getReturnsBySku({ anomalyOnly: false })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('anomalyOnly=false')
  })

  it('passes skipDataUnwrap: true', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await getReturnsBySku({})

    expect(mockGet).toHaveBeenCalledWith(expect.any(String), { skipDataUnwrap: true })
  })
})

// =============================================================================
// aggregateRawRecords — additional edge cases
// =============================================================================

describe('aggregateRawRecords — edge cases', () => {
  it('handles multiple nmIds each with multiple categories', () => {
    const records = [
      { nmId: 1, returnCategory: 'cancel_before_shipment' },
      { nmId: 1, returnCategory: 'cancel_before_shipment' },
      { nmId: 1, returnCategory: 'refusal_at_pvz' },
      { nmId: 2, returnCategory: 'return_after_receipt' },
      { nmId: 2, returnCategory: 'return_after_receipt' },
      { nmId: 2, returnCategory: 'return_after_receipt' },
    ]

    const result = aggregateRawRecords(records)

    expect(result).toHaveLength(2)

    const sku1 = result.find(i => i.nmId === 1)!
    expect(sku1.cancelBeforeShipment).toBe(2)
    expect(sku1.refusalAtPvz).toBe(1)
    expect(sku1.returnAfterReceipt).toBe(0)
    expect(sku1.totalReturns).toBe(3)

    const sku2 = result.find(i => i.nmId === 2)!
    expect(sku2.cancelBeforeShipment).toBe(0)
    expect(sku2.refusalAtPvz).toBe(0)
    expect(sku2.returnAfterReceipt).toBe(3)
    expect(sku2.totalReturns).toBe(3)
  })

  it('always sets productName to empty string and anomalyFlag to false', () => {
    const result = aggregateRawRecords([{ nmId: 99, returnCategory: 'cancel_before_shipment' }])

    expect(result[0].productName).toBe('')
    expect(result[0].brand).toBe('')
    expect(result[0].anomalyFlag).toBe(false)
  })

  it('handles single record', () => {
    const result = aggregateRawRecords([{ nmId: 42, returnCategory: 'refusal_at_pvz' }])

    expect(result).toHaveLength(1)
    expect(result[0].nmId).toBe(42)
    expect(result[0].refusalAtPvz).toBe(1)
    expect(result[0].totalReturns).toBe(1)
  })

  it('ignores unknown returnCategory values', () => {
    const result = aggregateRawRecords([
      { nmId: 1, returnCategory: 'unknown_category' },
      { nmId: 1, returnCategory: 'cancel_before_shipment' },
    ])

    // Unknown category is not counted in cancel/refusal/receipt but nmId still gets entry
    const sku = result[0]
    expect(sku.cancelBeforeShipment).toBe(1)
    expect(sku.refusalAtPvz).toBe(0)
    expect(sku.returnAfterReceipt).toBe(0)
    // totalReturns still reflects only the known categories tallied
    expect(sku.totalReturns).toBe(1)
  })
})

// =============================================================================
// returnQueryKeys
// =============================================================================

describe('returnQueryKeys', () => {
  it('has correct base key', () => {
    expect(returnQueryKeys.all).toEqual(['return-analytics'])
  })

  it('reasons includes from and to', () => {
    const key = returnQueryKeys.reasons('2025-01-01', '2025-01-07')
    expect(key).toEqual(['return-analytics', 'reasons', '2025-01-01', '2025-01-07'])
  })

  it('reasons handles undefined args', () => {
    const key = returnQueryKeys.reasons()
    expect(key).toEqual(['return-analytics', 'reasons', undefined, undefined])
  })

  it('bySku includes the full params object', () => {
    const key = returnQueryKeys.bySku({ from: '2025-01-01', nmId: 123 })
    expect(key).toEqual(['return-analytics', 'by-sku', { from: '2025-01-01', nmId: 123 }])
  })
})

// =============================================================================
// RETURN_CACHE
// =============================================================================

describe('RETURN_CACHE', () => {
  it('has expected cache durations', () => {
    expect(RETURN_CACHE.staleTime).toBe(4 * 60 * 1000) // 4 minutes
    expect(RETURN_CACHE.gcTime).toBe(30 * 60 * 1000) // 30 minutes
  })
})
