/**
 * Tests for price-elasticity.ts normalizer functions.
 * Covers: normalizeBatchResponse (via export), normalizeSkuResponse (via export).
 *
 * Note: The normalizer functions are NOT exported — they are internal to price-elasticity.ts.
 * We test the exported API functions by mocking apiClient, or test the normalizers indirectly.
 * Since the normalizers are private, we test via the exported query functions with mocked apiClient.
 * However, a simpler approach: the normalizers are plain functions we can exercise through the
 * exported API by mocking apiClient.get to return raw data.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  getPriceElasticityBatch,
  getPriceElasticitySku,
  priceElasticityQueryKeys,
} from '../price-elasticity'

// Mock apiClient to return raw data so normalizers are exercised
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'

const mockedGet = vi.mocked(apiClient.get)

// ---------------------------------------------------------------------------
// getPriceElasticityBatch → normalizeBatchResponse
// ---------------------------------------------------------------------------

describe('getPriceElasticityBatch (normalizeBatchResponse)', () => {
  it('happy path: normalizes batch response with all fields', async () => {
    mockedGet.mockResolvedValueOnce({
      items: [
        {
          nmId: 12345,
          elasticity: -1.5,
          rSquared: 0.85,
          dataPoints: 30,
          source: 'historical',
          confidence: 'high',
        },
      ],
      total: 100,
      byConfidence: { high: 40, medium: 35, low: 25 },
    })
    const result = await getPriceElasticityBatch()
    expect(result.items).toHaveLength(1)
    expect(result.items[0].nmId).toBe(12345)
    expect(result.items[0].elasticity).toBe(-1.5)
    expect(result.items[0].rSquared).toBe(0.85)
    expect(result.items[0].dataPoints).toBe(30)
    expect(result.items[0].source).toBe('historical')
    expect(result.items[0].confidence).toBe('high')
    expect(result.total).toBe(100)
    expect(result.byConfidence).toEqual({ high: 40, medium: 35, low: 25 })
  })

  it('defaults confidence to low for unknown value', async () => {
    mockedGet.mockResolvedValueOnce({
      items: [
        { nmId: 1, elasticity: 0, rSquared: 0, dataPoints: 0, source: '', confidence: 'invalid' },
      ],
      total: 1,
      byConfidence: {},
    })
    const result = await getPriceElasticityBatch()
    expect(result.items[0].confidence).toBe('low')
  })

  it('defaults all byConfidence counts to 0 when missing', async () => {
    mockedGet.mockResolvedValueOnce({
      items: [],
      total: 0,
      byConfidence: null,
    })
    const result = await getPriceElasticityBatch()
    expect(result.byConfidence).toEqual({ high: 0, medium: 0, low: 0 })
  })

  it('handles missing items array', async () => {
    mockedGet.mockResolvedValueOnce({ total: 0, byConfidence: {} })
    const result = await getPriceElasticityBatch()
    expect(result.items).toEqual([])
  })

  it('handles null/undefined raw input for byConfidence', async () => {
    mockedGet.mockResolvedValueOnce(undefined as unknown as Record<string, unknown>)
    const result = await getPriceElasticityBatch()
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.byConfidence).toEqual({ high: 0, medium: 0, low: 0 })
  })

  it('defaults null fields to 0/empty for count/string fields', async () => {
    mockedGet.mockResolvedValueOnce({
      items: [{ nmId: null, elasticity: null, rSquared: null, dataPoints: null, source: null }],
      total: null,
      byConfidence: {},
    })
    const result = await getPriceElasticityBatch()
    const item = result.items[0]
    expect(item.nmId).toBe(0)
    expect(item.elasticity).toBe(0)
    expect(item.rSquared).toBe(0)
    expect(item.dataPoints).toBe(0)
    expect(item.source).toBe('')
    expect(item.confidence).toBe('low')
    expect(result.total).toBe(0)
  })

  it('validates all three confidence levels', async () => {
    for (const c of ['high', 'medium', 'low'] as const) {
      mockedGet.mockResolvedValueOnce({
        items: [{ nmId: 1, confidence: c }],
        total: 1,
        byConfidence: {},
      })
      const result = await getPriceElasticityBatch()
      expect(result.items[0].confidence).toBe(c)
    }
  })
})

// ---------------------------------------------------------------------------
// getPriceElasticitySku → normalizeSkuResponse
// ---------------------------------------------------------------------------

describe('getPriceElasticitySku (normalizeSkuResponse)', () => {
  it('happy path: normalizes single SKU response', async () => {
    mockedGet.mockResolvedValueOnce({
      nmId: 98765,
      elasticity: -2.1,
      rSquared: 0.92,
      dataPoints: 45,
      source: 'historical',
      confidence: 'medium',
      profitMaxPrice: 1250.5,
    })
    const result = await getPriceElasticitySku(98765)
    expect(result.nmId).toBe(98765)
    expect(result.elasticity).toBe(-2.1)
    expect(result.rSquared).toBe(0.92)
    expect(result.dataPoints).toBe(45)
    expect(result.source).toBe('historical')
    expect(result.confidence).toBe('medium')
    expect(result.profitMaxPrice).toBe(1250.5)
  })

  it('preserves null profitMaxPrice (anti-pattern #8 — money field)', async () => {
    mockedGet.mockResolvedValueOnce({
      nmId: 1,
      profitMaxPrice: null,
    })
    const result = await getPriceElasticitySku(1)
    expect(result.profitMaxPrice).toBeNull()
  })

  it('defaults profitMaxPrice to null when missing', async () => {
    mockedGet.mockResolvedValueOnce({})
    const result = await getPriceElasticitySku(1)
    expect(result.profitMaxPrice).toBeNull()
  })

  it('defaults null count fields to 0', async () => {
    mockedGet.mockResolvedValueOnce({
      nmId: null,
      elasticity: null,
      rSquared: null,
      dataPoints: null,
      source: null,
      confidence: null,
    })
    const result = await getPriceElasticitySku(1)
    expect(result.nmId).toBe(0)
    expect(result.elasticity).toBe(0)
    expect(result.rSquared).toBe(0)
    expect(result.dataPoints).toBe(0)
    expect(result.source).toBe('')
    expect(result.confidence).toBe('low')
  })

  it('handles undefined raw input', async () => {
    mockedGet.mockResolvedValueOnce(undefined as unknown as Record<string, unknown>)
    const result = await getPriceElasticitySku(1)
    expect(result.nmId).toBe(0)
    expect(result.source).toBe('')
    expect(result.profitMaxPrice).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// priceElasticityQueryKeys
// ---------------------------------------------------------------------------

describe('priceElasticityQueryKeys', () => {
  it('produces correct base key', () => {
    expect(priceElasticityQueryKeys.all).toEqual(['price-elasticity'])
  })

  it('produces correct batch key with params', () => {
    const key = priceElasticityQueryKeys.batch({ limit: 10, offset: 20 })
    expect(key).toEqual(['price-elasticity', 'batch', { limit: 10, offset: 20 }])
  })

  it('produces correct batch key with empty params', () => {
    const key = priceElasticityQueryKeys.batch({})
    expect(key).toEqual(['price-elasticity', 'batch', {}])
  })

  it('produces correct sku key', () => {
    const key = priceElasticityQueryKeys.sku(12345)
    expect(key).toEqual(['price-elasticity', 'sku', 12345])
  })
})
