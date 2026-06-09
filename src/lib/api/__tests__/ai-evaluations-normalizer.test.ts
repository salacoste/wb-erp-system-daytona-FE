/**
 * Tests for ai/ai-evaluations-normalizer.ts
 * Covers: normalizeAiEvaluationListResponse, normalizeSkuAccuracyListResponse.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeAiEvaluationListResponse,
  normalizeSkuAccuracyListResponse,
} from '../ai/ai-evaluations-normalizer'

// ---------------------------------------------------------------------------
// normalizeAiEvaluationListResponse
// ---------------------------------------------------------------------------

describe('normalizeAiEvaluationListResponse', () => {
  it('happy path: normalizes full evaluation list with all fields', () => {
    const raw = {
      evaluations: [
        {
          forecastId: 'fc-001',
          modelId: 'model-abc',
          nmId: 12345,
          forecastDate: '2026-06-01',
          horizonDays: 14,
          predictedUnits: 100,
          actualUnits: 95,
          predictedRevenue: 50000.5,
          actualRevenue: 47500,
          mapeUnits: 5.2,
          mapeRevenue: 3.1,
          evaluationDate: '2026-06-15',
        },
      ],
      cabinetMape: 4.8,
      evaluatedAt: '2026-06-15T10:00:00Z',
      skuCount: 42,
    }
    const result = normalizeAiEvaluationListResponse(raw)
    expect(result.evaluations).toHaveLength(1)
    const e = result.evaluations[0]
    expect(e.forecastId).toBe('fc-001')
    expect(e.modelId).toBe('model-abc')
    expect(e.nmId).toBe(12345)
    expect(e.forecastDate).toBe('2026-06-01')
    expect(e.horizonDays).toBe(14)
    expect(e.predictedUnits).toBe(100)
    expect(e.actualUnits).toBe(95)
    expect(e.predictedRevenue).toBe(50000.5)
    expect(e.actualRevenue).toBe(47500)
    expect(e.mapeUnits).toBe(5.2)
    expect(e.mapeRevenue).toBe(3.1)
    expect(e.evaluationDate).toBe('2026-06-15')
    expect(result.cabinetMape).toBe(4.8)
    expect(result.evaluatedAt).toBe('2026-06-15T10:00:00Z')
    expect(result.skuCount).toBe(42)
  })

  it('preserves null on money/ratio fields (anti-pattern #8)', () => {
    const raw = {
      evaluations: [
        {
          predictedRevenue: null,
          mapeUnits: null,
          mapeRevenue: null,
        },
      ],
      cabinetMape: null,
      evaluatedAt: null,
    }
    const result = normalizeAiEvaluationListResponse(raw)
    const e = result.evaluations[0]
    expect(e.predictedRevenue).toBeNull()
    expect(e.mapeUnits).toBeNull()
    expect(e.mapeRevenue).toBeNull()
    expect(result.cabinetMape).toBeNull()
    expect(result.evaluatedAt).toBeNull()
  })

  it('handles missing/undefined evaluations array', () => {
    const result = normalizeAiEvaluationListResponse({})
    expect(result.evaluations).toEqual([])
    expect(result.cabinetMape).toBeNull()
    expect(result.evaluatedAt).toBeNull()
    expect(result.skuCount).toBe(0)
  })

  it('handles null evaluations array', () => {
    const result = normalizeAiEvaluationListResponse({ evaluations: null })
    expect(result.evaluations).toEqual([])
  })

  it('defaults string fields to empty string when null', () => {
    const raw = {
      evaluations: [
        {
          forecastId: null,
          modelId: null,
          nmId: null,
          forecastDate: null,
          evaluationDate: null,
        },
      ],
    }
    const result = normalizeAiEvaluationListResponse(raw)
    const e = result.evaluations[0]
    expect(e.forecastId).toBe('')
    expect(e.modelId).toBe('')
    expect(e.nmId).toBeNull()
    expect(e.forecastDate).toBe('')
    expect(e.evaluationDate).toBe('')
  })

  it('defaults count fields to 0 when null/missing', () => {
    const raw = {
      evaluations: [
        {
          horizonDays: null,
          predictedUnits: null,
          actualUnits: null,
          actualRevenue: null,
        },
      ],
      skuCount: null,
    }
    const result = normalizeAiEvaluationListResponse(raw)
    const e = result.evaluations[0]
    expect(e.horizonDays).toBe(0)
    expect(e.predictedUnits).toBe(0)
    expect(e.actualUnits).toBe(0)
    expect(e.actualRevenue).toBe(0)
    expect(result.skuCount).toBe(0)
  })

  it('handles non-finite mape values as null', () => {
    const raw = {
      evaluations: [{ mapeUnits: NaN, mapeRevenue: Infinity }],
    }
    const result = normalizeAiEvaluationListResponse(raw)
    expect(result.evaluations[0].mapeUnits).toBeNull()
    expect(result.evaluations[0].mapeRevenue).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// normalizeSkuAccuracyListResponse
// ---------------------------------------------------------------------------

describe('normalizeSkuAccuracyListResponse', () => {
  it('happy path: normalizes SKU accuracy entries with history', () => {
    const raw = {
      skuAccuracies: [
        {
          nmId: 111,
          vendorCode: 'SKU-001',
          history: [
            {
              evaluationDate: '2026-06-01',
              predictedUnits: 50,
              actualUnits: 45,
              naiveBaseline: 40,
              mapeUnits: 11.1,
              naiveMape: 20.0,
            },
          ],
          avgAiMape: 11.1,
          avgNaiveMape: 20.0,
          aiAccuracyPercent: 44.5,
          naiveAccuracyPercent: 30.0,
          evaluationCount: 5,
        },
      ],
    }
    const result = normalizeSkuAccuracyListResponse(raw)
    expect(result.skuAccuracies).toHaveLength(1)
    const s = result.skuAccuracies[0]
    expect(s.nmId).toBe(111)
    expect(s.vendorCode).toBe('SKU-001')
    expect(s.history).toHaveLength(1)
    expect(s.history[0].evaluationDate).toBe('2026-06-01')
    expect(s.history[0].predictedUnits).toBe(50)
    expect(s.history[0].actualUnits).toBe(45)
    expect(s.history[0].naiveBaseline).toBe(40)
    expect(s.history[0].mapeUnits).toBe(11.1)
    expect(s.history[0].naiveMape).toBe(20.0)
    expect(s.avgAiMape).toBe(11.1)
    expect(s.avgNaiveMape).toBe(20.0)
    expect(s.aiAccuracyPercent).toBe(44.5)
    expect(s.naiveAccuracyPercent).toBe(30.0)
    expect(s.evaluationCount).toBe(5)
  })

  it('filters out entries with null nmId (malformed backend rows)', () => {
    const raw = {
      skuAccuracies: [
        { nmId: 111, vendorCode: 'VALID' },
        { nmId: null, vendorCode: 'INVALID' },
        { vendorCode: 'ALSO_INVALID' },
      ],
    }
    const result = normalizeSkuAccuracyListResponse(raw)
    expect(result.skuAccuracies).toHaveLength(1)
    expect(result.skuAccuracies[0].nmId).toBe(111)
  })

  it('preserves null on ratio/money fields (anti-pattern #8)', () => {
    const raw = {
      skuAccuracies: [
        {
          nmId: 222,
          history: [
            {
              naiveBaseline: null,
              mapeUnits: null,
              naiveMape: null,
            },
          ],
          avgAiMape: null,
          avgNaiveMape: null,
          aiAccuracyPercent: null,
          naiveAccuracyPercent: null,
        },
      ],
    }
    const result = normalizeSkuAccuracyListResponse(raw)
    const s = result.skuAccuracies[0]
    expect(s.avgAiMape).toBeNull()
    expect(s.avgNaiveMape).toBeNull()
    expect(s.aiAccuracyPercent).toBeNull()
    expect(s.naiveAccuracyPercent).toBeNull()
    expect(s.history[0].naiveBaseline).toBeNull()
    expect(s.history[0].mapeUnits).toBeNull()
    expect(s.history[0].naiveMape).toBeNull()
  })

  it('defaults count fields to 0 when null', () => {
    const raw = {
      skuAccuracies: [
        {
          nmId: 333,
          evaluationCount: null,
          history: [{ predictedUnits: null, actualUnits: null }],
        },
      ],
    }
    const result = normalizeSkuAccuracyListResponse(raw)
    const s = result.skuAccuracies[0]
    expect(s.evaluationCount).toBe(0)
    expect(s.history[0].predictedUnits).toBe(0)
    expect(s.history[0].actualUnits).toBe(0)
  })

  it('handles missing/null skuAccuracies array', () => {
    const result1 = normalizeSkuAccuracyListResponse({})
    expect(result1.skuAccuracies).toEqual([])

    const result2 = normalizeSkuAccuracyListResponse({ skuAccuracies: null })
    expect(result2.skuAccuracies).toEqual([])
  })

  it('handles missing history array gracefully', () => {
    const raw = {
      skuAccuracies: [{ nmId: 444, vendorCode: 'NO-HISTORY' }],
    }
    const result = normalizeSkuAccuracyListResponse(raw)
    expect(result.skuAccuracies[0].history).toEqual([])
  })

  it('defaults vendorCode to null when missing', () => {
    const raw = {
      skuAccuracies: [{ nmId: 555 }],
    }
    const result = normalizeSkuAccuracyListResponse(raw)
    expect(result.skuAccuracies[0].vendorCode).toBeNull()
  })
})
