/**
 * AI Evaluations normalizer tests — Story 108.1-FE, extended Story 110.3-FE (Tasks 1 & 2)
 * Covers null preservation for mape/accuracy ratio fields,
 * count field semantic-zeros, and empty array defaults.
 * Task 1: getSkuAccuracy URL param tests (modelId, nmId threaded to URL).
 * Task 2: naiveAccuracyPercent + evaluationCount normalizer tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeAiEvaluationListResponse,
  normalizeSkuAccuracyListResponse,
  getSkuAccuracy,
} from '../evaluations'
import * as apiClientModule from '@/lib/api-client'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const mockApiClient = vi.mocked(apiClientModule.apiClient)

// ── Task 1: getSkuAccuracy URL params ────────────────────────────────────────

describe('getSkuAccuracy URL params (Task 1 — Story 110.3-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiClient.get.mockResolvedValue({ skuAccuracies: [] })
  })

  // iter-63: the backend whitelist REJECTS an unknown `modelId` query param with HTTP 400
  // ("modelId should not exist"), so modelId MUST NOT be sent until #166 ships server-side scoping.
  // modelId remains in the params type (used for cache-key scoping in useAiSkuAccuracy), just not in the URL.
  it('does NOT send modelId as a query param (backend rejects it — #166)', async () => {
    await getSkuAccuracy({ modelId: 'model-abc' })
    const url: string = mockApiClient.get.mock.calls[0][0]
    expect(url).not.toContain('modelId')
  })

  it('sends a clean URL with no query string when only modelId is given', async () => {
    await getSkuAccuracy({ modelId: 'model-abc' })
    const url: string = mockApiClient.get.mock.calls[0][0]
    expect(url).toBe('/v1/ai/evaluations/sku-accuracy')
  })

  it('includes nmId as query param when provided (backend accepts nmId)', async () => {
    await getSkuAccuracy({ modelId: 'model-abc', nmId: 12345 })
    const url: string = mockApiClient.get.mock.calls[0][0]
    expect(url).not.toContain('modelId')
    expect(url).toContain('nmId=12345')
  })

  it('omits nmId from query params when not provided', async () => {
    await getSkuAccuracy({ modelId: 'model-abc' })
    const url: string = mockApiClient.get.mock.calls[0][0]
    expect(url).not.toContain('nmId=')
  })

  it('includes format param when provided', async () => {
    await getSkuAccuracy({ modelId: 'model-abc', format: 'csv' })
    expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('format=csv'))
  })
})

// ── Task 2: naiveAccuracyPercent + evaluationCount normalizer ────────────────

describe('normalizeSkuAccuracyListResponse — Task 2 new fields (Story 110.3-FE)', () => {
  it('preserves null for naiveAccuracyPercent (ratio field — AP#8)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [{ nmId: 1, history: [] }],
    })
    expect(result.skuAccuracies[0].naiveAccuracyPercent).toBeNull()
  })

  it('passes through non-null naiveAccuracyPercent', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [{ nmId: 1, history: [], naiveAccuracyPercent: 81.7 }],
    })
    expect(result.skuAccuracies[0].naiveAccuracyPercent).toBe(81.7)
  })

  it('uses semantic-zero for evaluationCount when missing (SEMANTIC-ZERO)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [{ nmId: 1, history: [] }],
    })
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: count assertion in test
    expect(result.skuAccuracies[0].evaluationCount).toBe(0)
  })

  it('passes through non-zero evaluationCount', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [{ nmId: 1, history: [], evaluationCount: 6 }],
    })
    expect(result.skuAccuracies[0].evaluationCount).toBe(6)
  })
})

describe('normalizeAiEvaluationListResponse', () => {
  it('defaults evaluations to empty array when null', () => {
    expect(normalizeAiEvaluationListResponse({ evaluations: null }).evaluations).toEqual([])
    expect(normalizeAiEvaluationListResponse({}).evaluations).toEqual([])
  })

  it('preserves null for cabinetMape (ratio field — not yet evaluated)', () => {
    expect(normalizeAiEvaluationListResponse({ cabinetMape: null }).cabinetMape).toBeNull()
    expect(normalizeAiEvaluationListResponse({}).cabinetMape).toBeNull()
  })

  it('preserves null for evaluatedAt when never evaluated', () => {
    expect(normalizeAiEvaluationListResponse({}).evaluatedAt).toBeNull()
  })

  it('uses semantic-zero for skuCount when missing', () => {
    expect(normalizeAiEvaluationListResponse({}).skuCount).toBe(0)
  })

  it('preserves null mapeUnits/mapeRevenue in evaluation entries', () => {
    const result = normalizeAiEvaluationListResponse({
      evaluations: [{ forecastId: 'f1', nmId: 123, predictedUnits: 10, actualUnits: 9 }],
    })
    expect(result.evaluations[0].mapeUnits).toBeNull()
    expect(result.evaluations[0].mapeRevenue).toBeNull()
  })

  it('preserves null nmId for cabinet-level evaluations', () => {
    const result = normalizeAiEvaluationListResponse({
      evaluations: [{ forecastId: 'f1', nmId: null, predictedUnits: 10, actualUnits: 9 }],
    })
    expect(result.evaluations[0].nmId).toBeNull()
  })

  it('passes through fully populated evaluation list', () => {
    const result = normalizeAiEvaluationListResponse({
      evaluations: [
        {
          forecastId: 'f1',
          nmId: 42,
          predictedUnits: 10,
          actualUnits: 9,
          mapeUnits: 11.1,
          mapeRevenue: 8.5,
        },
      ],
      cabinetMape: 9.8,
      evaluatedAt: '2026-05-01T00:00:00Z',
      skuCount: 35,
    })
    expect(result.cabinetMape).toBe(9.8)
    expect(result.evaluatedAt).toBe('2026-05-01T00:00:00Z')
    expect(result.skuCount).toBe(35)
    expect(result.evaluations[0].mapeUnits).toBe(11.1)
  })
})

describe('normalizeSkuAccuracyListResponse', () => {
  it('defaults skuAccuracies to empty array when null', () => {
    expect(normalizeSkuAccuracyListResponse({ skuAccuracies: null }).skuAccuracies).toEqual([])
    expect(normalizeSkuAccuracyListResponse({}).skuAccuracies).toEqual([])
  })

  it('preserves null for avgAiMape, avgNaiveMape, aiAccuracyPercent (ratio fields)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [{ nmId: 1, vendorCode: 'SKU-A', history: [] }],
    })
    expect(result.skuAccuracies[0].avgAiMape).toBeNull()
    expect(result.skuAccuracies[0].avgNaiveMape).toBeNull()
    expect(result.skuAccuracies[0].aiAccuracyPercent).toBeNull()
  })

  it('preserves null mapeUnits and naiveMape in history entries', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [
        {
          nmId: 1,
          history: [{ evaluationDate: '2026-05-01', predictedUnits: 10, actualUnits: 9 }],
        },
      ],
    })
    expect(result.skuAccuracies[0].history[0].mapeUnits).toBeNull()
    expect(result.skuAccuracies[0].history[0].naiveMape).toBeNull()
  })

  // 3rd-pass F-1: naiveBaseline (units, distinct from naiveMape percentage) — AP#8 null preserved
  it('preserves null for naiveBaseline when missing (AP#8 units field)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [
        {
          nmId: 1,
          history: [{ evaluationDate: '2026-05-01', predictedUnits: 10, actualUnits: 9 }],
        },
      ],
    })
    expect(result.skuAccuracies[0].history[0].naiveBaseline).toBeNull()
  })

  it('passes through non-null naiveBaseline (round-trip)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [
        {
          nmId: 1,
          history: [
            {
              evaluationDate: '2026-05-01',
              predictedUnits: 50,
              actualUnits: 48,
              naiveBaseline: 38.2,
            },
          ],
        },
      ],
    })
    expect(result.skuAccuracies[0].history[0].naiveBaseline).toBe(38.2)
  })

  it('passes through positive aiAccuracyPercent (AI beats naive)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [
        { nmId: 1, history: [], avgAiMape: 8.5, avgNaiveMape: 15.2, aiAccuracyPercent: 44.1 },
      ],
    })
    expect(result.skuAccuracies[0].aiAccuracyPercent).toBe(44.1)
  })

  it('passes through negative aiAccuracyPercent (AI worse than naive)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [{ nmId: 1, history: [], aiAccuracyPercent: -12.3 }],
    })
    expect(result.skuAccuracies[0].aiAccuracyPercent).toBe(-12.3)
  })

  // F-1: null nmId rows must be filtered out of the list response (cache-poisoning guard)
  it('F-1: filters out entries with null nmId (malformed backend rows)', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [
        { nmId: null, history: [] },
        { nmId: 42, history: [] },
        { history: [] }, // nmId undefined → also null → also filtered
      ],
    })
    expect(result.skuAccuracies).toHaveLength(1)
    expect(result.skuAccuracies[0].nmId).toBe(42)
  })

  it('F-1: valid entry with positive nmId passes through filter', () => {
    const result = normalizeSkuAccuracyListResponse({
      skuAccuracies: [{ nmId: 12345678, history: [] }],
    })
    expect(result.skuAccuracies).toHaveLength(1)
    expect(result.skuAccuracies[0].nmId).toBe(12345678)
  })
})
