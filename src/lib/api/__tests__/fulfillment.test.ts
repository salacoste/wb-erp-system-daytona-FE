/**
 * Fulfillment API Client Tests
 * Covers: getFulfillmentSummary, getFulfillmentTrends, getFulfillmentSyncStatus,
 * getFulfillmentProducts, startFulfillmentSync, fulfillmentQueryKeys.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock normalizers — return a tagged object so we can verify they were called
vi.mock('../fulfillment-normalizer', () => ({
  normalizeFulfillmentSummaryResponse: vi.fn((raw: unknown) => ({
    __normalized: 'summary',
    raw,
  })),
  normalizeFulfillmentTrendsResponse: vi.fn((raw: unknown) => ({
    __normalized: 'trends',
    raw,
  })),
  normalizeFulfillmentSyncStatusResponse: vi.fn((raw: unknown) => ({
    __normalized: 'syncStatus',
    raw,
  })),
  normalizeFulfillmentProductsResponse: vi.fn((raw: unknown) => ({
    __normalized: 'products',
    raw,
  })),
}))

import { apiClient } from '../../api-client'
import {
  getFulfillmentSummary,
  getFulfillmentTrends,
  getFulfillmentSyncStatus,
  getFulfillmentProducts,
  startFulfillmentSync,
  fulfillmentQueryKeys,
} from '../fulfillment'
import {
  normalizeFulfillmentSummaryResponse,
  normalizeFulfillmentTrendsResponse,
  normalizeFulfillmentSyncStatusResponse,
  normalizeFulfillmentProductsResponse,
} from '../fulfillment-normalizer'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// getFulfillmentSummary
// =============================================================================

describe('getFulfillmentSummary', () => {
  it('calls GET /v1/analytics/fulfillment/summary with from and to params', async () => {
    mockGet.mockResolvedValueOnce({ summary: { fbo: {}, fbs: {}, total: {} }, period: {} })
    const result = await getFulfillmentSummary({ from: '2025-01-01', to: '2025-01-07' })

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/analytics/fulfillment/summary?from=2025-01-01&to=2025-01-07',
      { skipDataUnwrap: true }
    )
    expect(normalizeFulfillmentSummaryResponse).toHaveBeenCalledWith({
      summary: { fbo: {}, fbs: {}, total: {} },
      period: {},
    })
    expect(result).toEqual({
      __normalized: 'summary',
      raw: { summary: { fbo: {}, fbs: {}, total: {} }, period: {} },
    })
  })

  it('passes skipDataUnwrap: true', async () => {
    mockGet.mockResolvedValueOnce({})
    await getFulfillmentSummary({ from: '2025-06-01', to: '2025-06-07' })

    expect(mockGet).toHaveBeenCalledWith(expect.any(String), { skipDataUnwrap: true })
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))
    await expect(getFulfillmentSummary({ from: '2025-01-01', to: '2025-01-07' })).rejects.toThrow(
      'Network error'
    )
  })
})

// =============================================================================
// getFulfillmentTrends
// =============================================================================

describe('getFulfillmentTrends', () => {
  it('calls GET with required params only', async () => {
    mockGet.mockResolvedValueOnce({ trends: [], period: {} })
    await getFulfillmentTrends({ from: '2025-01-01', to: '2025-01-07' })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('from=2025-01-01')
    expect(url).toContain('to=2025-01-07')
    expect(url).not.toContain('type=')
    expect(url).not.toContain('metric=')
  })

  it('appends optional type and metric params', async () => {
    mockGet.mockResolvedValueOnce({ trends: [], period: {} })
    await getFulfillmentTrends({
      from: '2025-01-01',
      to: '2025-01-07',
      type: 'fbs',
      metric: 'revenue',
    })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('type=fbs')
    expect(url).toContain('metric=revenue')
  })

  it('normalizes the raw response', async () => {
    const raw = { trends: [{ date: '2025-01-01' }], period: { from: 'a', to: 'b' } }
    mockGet.mockResolvedValueOnce(raw)
    const result = await getFulfillmentTrends({ from: '2025-01-01', to: '2025-01-07' })

    expect(normalizeFulfillmentTrendsResponse).toHaveBeenCalledWith(raw)
    expect(result).toEqual({ __normalized: 'trends', raw })
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Timeout'))
    await expect(getFulfillmentTrends({ from: '2025-01-01', to: '2025-01-07' })).rejects.toThrow(
      'Timeout'
    )
  })
})

// =============================================================================
// getFulfillmentSyncStatus
// =============================================================================

describe('getFulfillmentSyncStatus', () => {
  it('calls GET /v1/analytics/fulfillment/sync-status with no params', async () => {
    mockGet.mockResolvedValueOnce({ orders: null, isDataAvailable: false })
    await getFulfillmentSyncStatus()

    expect(mockGet).toHaveBeenCalledWith('/v1/analytics/fulfillment/sync-status', {
      skipDataUnwrap: true,
    })
  })

  it('normalizes the raw response', async () => {
    const raw = { orders: null, isDataAvailable: false }
    mockGet.mockResolvedValueOnce(raw)
    const result = await getFulfillmentSyncStatus()

    expect(normalizeFulfillmentSyncStatusResponse).toHaveBeenCalledWith(raw)
    expect(result).toEqual({ __normalized: 'syncStatus', raw })
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'))
    await expect(getFulfillmentSyncStatus()).rejects.toThrow('Server error')
  })
})

// =============================================================================
// getFulfillmentProducts
// =============================================================================

describe('getFulfillmentProducts', () => {
  it('calls GET with required params only', async () => {
    mockGet.mockResolvedValueOnce({ products: [], total: 0, period: {} })
    await getFulfillmentProducts({ from: '2025-01-01', to: '2025-01-07' })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('from=2025-01-01')
    expect(url).toContain('to=2025-01-07')
    expect(url).not.toContain('type=')
    expect(url).not.toContain('limit=')
    expect(url).not.toContain('sort=')
  })

  it('appends all optional params', async () => {
    mockGet.mockResolvedValueOnce({ products: [], total: 0, period: {} })
    await getFulfillmentProducts({
      from: '2025-01-01',
      to: '2025-01-07',
      type: 'fbo',
      limit: 20,
      sort: 'revenue',
    })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('type=fbo')
    expect(url).toContain('limit=20')
    expect(url).toContain('sort=revenue')
  })

  it('omits limit when undefined (not 0)', async () => {
    mockGet.mockResolvedValueOnce({ products: [], total: 0, period: {} })
    await getFulfillmentProducts({ from: '2025-01-01', to: '2025-01-07', limit: undefined })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).not.toContain('limit=')
  })

  it('includes limit when 0', async () => {
    mockGet.mockResolvedValueOnce({ products: [], total: 0, period: {} })
    await getFulfillmentProducts({ from: '2025-01-01', to: '2025-01-07', limit: 0 })

    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('limit=0')
  })

  it('normalizes the raw response', async () => {
    const raw = { products: [{ nmId: 1 }], total: 1, period: { from: 'a', to: 'b' } }
    mockGet.mockResolvedValueOnce(raw)
    const result = await getFulfillmentProducts({ from: '2025-01-01', to: '2025-01-07' })

    expect(normalizeFulfillmentProductsResponse).toHaveBeenCalledWith(raw)
    expect(result).toEqual({ __normalized: 'products', raw })
  })
})

// =============================================================================
// startFulfillmentSync
// =============================================================================

describe('startFulfillmentSync', () => {
  it('calls POST /v1/admin/fulfillment/sync with request data', async () => {
    const syncResponse = { success: true, message: 'ok', jobId: 'j1', estimatedTime: '60s' }
    mockPost.mockResolvedValueOnce(syncResponse)
    const body = { dataSource: 'both' as const, dateFrom: '2025-01-01', dateTo: '2025-01-07' }

    const result = await startFulfillmentSync(body)

    expect(mockPost).toHaveBeenCalledWith('/v1/admin/fulfillment/sync', body, {
      skipDataUnwrap: true,
    })
    expect(result).toEqual(syncResponse)
  })

  it('propagates API errors', async () => {
    mockPost.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(startFulfillmentSync({ dataSource: 'orders' })).rejects.toThrow('Forbidden')
  })
})

// =============================================================================
// fulfillmentQueryKeys
// =============================================================================

describe('fulfillmentQueryKeys', () => {
  it('has correct base key', () => {
    expect(fulfillmentQueryKeys.all).toEqual(['fulfillment'])
  })

  it('summary includes from and to', () => {
    const key = fulfillmentQueryKeys.summary('2025-01-01', '2025-01-07')
    expect(key).toEqual(['fulfillment', 'summary', '2025-01-01', '2025-01-07'])
  })

  it('trends includes optional type and metric', () => {
    const withAll = fulfillmentQueryKeys.trends('2025-01-01', '2025-01-07', 'fbo', 'orders')
    expect(withAll).toEqual(['fulfillment', 'trends', '2025-01-01', '2025-01-07', 'fbo', 'orders'])

    const minimal = fulfillmentQueryKeys.trends('2025-01-01', '2025-01-07')
    expect(minimal).toEqual([
      'fulfillment',
      'trends',
      '2025-01-01',
      '2025-01-07',
      undefined,
      undefined,
    ])
  })

  it('syncStatus is a static key', () => {
    expect(fulfillmentQueryKeys.syncStatus).toEqual(['fulfillment', 'sync-status'])
  })

  it('products includes optional type and sort', () => {
    const withAll = fulfillmentQueryKeys.products('2025-01-01', '2025-01-07', 'fbs', 'returns')
    expect(withAll).toEqual([
      'fulfillment',
      'products',
      '2025-01-01',
      '2025-01-07',
      'fbs',
      'returns',
    ])

    const minimal = fulfillmentQueryKeys.products('2025-01-01', '2025-01-07')
    expect(minimal).toEqual([
      'fulfillment',
      'products',
      '2025-01-01',
      '2025-01-07',
      undefined,
      undefined,
    ])
  })
})
