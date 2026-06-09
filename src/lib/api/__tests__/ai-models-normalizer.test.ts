/**
 * Tests for ai/ai-models-normalizer.ts
 * Covers: normalizeAiModelListResponse, normalizeModelPerformanceResponse.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeAiModelListResponse,
  normalizeModelPerformanceResponse,
} from '../ai/ai-models-normalizer'

// ---------------------------------------------------------------------------
// normalizeAiModelListResponse
// ---------------------------------------------------------------------------

describe('normalizeAiModelListResponse', () => {
  it('happy path: normalizes wrapped { models: [...] } response', () => {
    const raw = {
      models: [
        {
          id: 'model-001',
          modelType: 'sales_forecast',
          engine: 'prophet',
          version: 3,
          status: 'active',
          metrics: { mape: 4.2, dataPointsCount: 1200 },
          trainingDataRange: { from: '2026-01-01', to: '2026-05-31' },
          trainedAt: '2026-06-01T12:00:00Z',
        },
      ],
    }
    const result = normalizeAiModelListResponse(raw)
    expect(result.models).toHaveLength(1)
    const m = result.models[0]
    expect(m.id).toBe('model-001')
    expect(m.modelType).toBe('sales_forecast')
    expect(m.engine).toBe('prophet')
    expect(m.version).toBe(3)
    expect(m.status).toBe('active')
    expect(m.metrics.mape).toBe(4.2)
    expect(m.metrics.dataPointsCount).toBe(1200)
    expect(m.trainingDataRange).toEqual({ from: '2026-01-01', to: '2026-05-31' })
    expect(m.trainedAt).toBe('2026-06-01T12:00:00Z')
  })

  it('handles bare array response (prod sends array, not wrapper)', () => {
    const raw = [
      {
        id: 'model-002',
        modelType: 'daily_revenue_forecast',
        engine: 'mindsdb',
        version: 1,
        status: 'training',
        metrics: { mape: null, dataPointsCount: 0 },
      },
    ]
    const result = normalizeAiModelListResponse(raw)
    expect(result.models).toHaveLength(1)
    expect(result.models[0].id).toBe('model-002')
    expect(result.models[0].status).toBe('training')
  })

  it('preserves null mape (anti-pattern #8 — ratio field)', () => {
    const raw = {
      models: [{ id: 'model-003', metrics: { mape: null, dataPointsCount: 500 } }],
    }
    const result = normalizeAiModelListResponse(raw)
    expect(result.models[0].metrics.mape).toBeNull()
    expect(result.models[0].metrics.dataPointsCount).toBe(500)
  })

  it('defaults missing fields to safe values', () => {
    const raw = {
      models: [{}],
    }
    const result = normalizeAiModelListResponse(raw)
    const m = result.models[0]
    expect(m.id).toBe('')
    expect(m.modelType).toBe('sales_forecast')
    expect(m.engine).toBe('prophet')
    expect(m.version).toBe(0)
    expect(m.status).toBe('retired') // unknown status → retired fallback
    expect(m.metrics.mape).toBeNull()
    expect(m.metrics.dataPointsCount).toBe(0)
    expect(m.trainingDataRange).toBeUndefined()
    expect(m.trainedAt).toBeUndefined()
  })

  it('maps unknown status to retired (F-39 boundary validation)', () => {
    const raw = {
      models: [{ id: 'x', status: 'unknown_new_status' }],
    }
    const result = normalizeAiModelListResponse(raw)
    expect(result.models[0].status).toBe('retired')
  })

  it('maps all valid statuses correctly', () => {
    const statuses = [
      'active',
      'training',
      'degraded',
      'retired',
      'rolled_back',
      'failed',
      'deprecated',
    ]
    const raw = {
      models: statuses.map((s, i) => ({ id: `m-${i}`, status: s })),
    }
    const result = normalizeAiModelListResponse(raw)
    result.models.forEach((m, i) => {
      expect(m.status).toBe(statuses[i])
    })
  })

  it('handles null/undefined input', () => {
    const result = normalizeAiModelListResponse(null)
    expect(result.models).toEqual([])
  })

  it('handles null models array', () => {
    const result = normalizeAiModelListResponse({ models: null })
    expect(result.models).toEqual([])
  })

  it('handles non-finite dataPointsCount as 0', () => {
    const raw = {
      models: [{ id: 'm1', metrics: { dataPointsCount: NaN } }],
    }
    const result = normalizeAiModelListResponse(raw)
    expect(result.models[0].metrics.dataPointsCount).toBe(0)
  })

  it('handles null metrics object', () => {
    const raw = {
      models: [{ id: 'm1', metrics: null }],
    }
    const result = normalizeAiModelListResponse(raw)
    expect(result.models[0].metrics.mape).toBeNull()
    expect(result.models[0].metrics.dataPointsCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// normalizeModelPerformanceResponse
// ---------------------------------------------------------------------------

describe('normalizeModelPerformanceResponse', () => {
  it('happy path: normalizes full performance response', () => {
    const raw = {
      driftStatus: 'improving',
      previousVersionMetrics: { mape: 6.5, dataPointsCount: 800 },
      mapeTrend: [
        { evaluationDate: '2026-06-01', cabinetMape: 5.0, skuCount: 100 },
        { evaluationDate: '2026-06-08', cabinetMape: 4.2, skuCount: 120 },
      ],
    }
    const result = normalizeModelPerformanceResponse(raw)
    expect(result.driftStatus).toBe('improving')
    expect(result.previousVersionMetrics?.mape).toBe(6.5)
    expect(result.previousVersionMetrics?.dataPointsCount).toBe(800)
    expect(result.mapeTrend).toHaveLength(2)
    expect(result.mapeTrend[0].evaluationDate).toBe('2026-06-01')
    expect(result.mapeTrend[0].cabinetMape).toBe(5.0)
    expect(result.mapeTrend[0].skuCount).toBe(100)
  })

  it('returns null driftStatus for unknown value', () => {
    const raw = { driftStatus: 'unknown_direction' }
    const result = normalizeModelPerformanceResponse(raw)
    expect(result.driftStatus).toBeNull()
  })

  it('returns null driftStatus for missing value', () => {
    const result = normalizeModelPerformanceResponse({})
    expect(result.driftStatus).toBeNull()
  })

  it('validates all three valid drift statuses', () => {
    for (const status of ['improving', 'stable', 'degrading'] as const) {
      const result = normalizeModelPerformanceResponse({ driftStatus: status })
      expect(result.driftStatus).toBe(status)
    }
  })

  it('handles missing previousVersionMetrics', () => {
    const result = normalizeModelPerformanceResponse({})
    expect(result.previousVersionMetrics).toBeUndefined()
  })

  it('handles missing mapeTrend array', () => {
    const result = normalizeModelPerformanceResponse({})
    expect(result.mapeTrend).toEqual([])
  })

  it('handles null mapeTrend array', () => {
    const result = normalizeModelPerformanceResponse({ mapeTrend: null })
    expect(result.mapeTrend).toEqual([])
  })

  it('preserves null cabinetMape in trend entries (anti-pattern #8)', () => {
    const raw = {
      mapeTrend: [{ evaluationDate: '2026-06-01', cabinetMape: null, skuCount: null }],
    }
    const result = normalizeModelPerformanceResponse(raw)
    expect(result.mapeTrend[0].cabinetMape).toBeNull()
    expect(result.mapeTrend[0].skuCount).toBe(0)
  })

  it('defaults missing evaluationDate to empty string', () => {
    const raw = {
      mapeTrend: [{}],
    }
    const result = normalizeModelPerformanceResponse(raw)
    expect(result.mapeTrend[0].evaluationDate).toBe('')
  })

  it('handles non-finite mape in previousVersionMetrics as null', () => {
    const raw = {
      previousVersionMetrics: { mape: Infinity, dataPointsCount: NaN },
    }
    const result = normalizeModelPerformanceResponse(raw)
    expect(result.previousVersionMetrics?.mape).toBeNull()
    expect(result.previousVersionMetrics?.dataPointsCount).toBe(0)
  })
})
