/**
 * AI Models normalizer tests — Story 108.1-FE
 * Covers model list normalization, mape null preservation,
 * driftStatus guard, and mapeTrend array handling.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiModelListResponse, normalizeModelPerformanceResponse } from '../models'

describe('normalizeAiModelListResponse', () => {
  it('defaults models to empty array when null', () => {
    expect(normalizeAiModelListResponse({ models: null }).models).toEqual([])
    expect(normalizeAiModelListResponse({}).models).toEqual([])
  })

  it('preserves null for mape (ratio field — not yet evaluated)', () => {
    const result = normalizeAiModelListResponse({
      models: [
        {
          id: 'm1',
          modelType: 'sales_forecast',
          engine: 'prophet',
          version: 1,
          status: 'active',
          metrics: { mape: null, dataPointsCount: 500 },
        },
      ],
    })
    expect(result.models[0].metrics.mape).toBeNull()
  })

  it('uses semantic-zero for dataPointsCount when missing', () => {
    const result = normalizeAiModelListResponse({
      models: [
        {
          id: 'm1',
          modelType: 'sales_forecast',
          engine: 'prophet',
          version: 1,
          status: 'active',
          metrics: {},
        },
      ],
    })
    expect(result.models[0].metrics.dataPointsCount).toBe(0)
  })

  it('passes through fully populated model', () => {
    const result = normalizeAiModelListResponse({
      models: [
        {
          id: 'model-1',
          modelType: 'daily_revenue_forecast',
          engine: 'mindsdb',
          version: 3,
          status: 'active',
          metrics: { mape: 12.5, dataPointsCount: 2000 },
          trainingDataRange: { from: '2025-01-01', to: '2026-01-01' },
          trainedAt: '2026-01-15T00:00:00Z',
        },
      ],
    })
    const m = result.models[0]
    expect(m.id).toBe('model-1')
    expect(m.modelType).toBe('daily_revenue_forecast')
    expect(m.engine).toBe('mindsdb')
    expect(m.version).toBe(3)
    expect(m.status).toBe('active')
    expect(m.metrics.mape).toBe(12.5)
    expect(m.trainingDataRange).toEqual({ from: '2025-01-01', to: '2026-01-01' })
  })
})

describe('normalizeModelPerformanceResponse', () => {
  it('returns null driftStatus for unknown values', () => {
    expect(normalizeModelPerformanceResponse({ driftStatus: 'unknown' }).driftStatus).toBeNull()
    expect(normalizeModelPerformanceResponse({ driftStatus: null }).driftStatus).toBeNull()
    expect(normalizeModelPerformanceResponse({}).driftStatus).toBeNull()
  })

  it('passes through valid driftStatus values', () => {
    expect(normalizeModelPerformanceResponse({ driftStatus: 'improving' }).driftStatus).toBe(
      'improving'
    )
    expect(normalizeModelPerformanceResponse({ driftStatus: 'stable' }).driftStatus).toBe('stable')
    expect(normalizeModelPerformanceResponse({ driftStatus: 'degrading' }).driftStatus).toBe(
      'degrading'
    )
  })

  it('defaults mapeTrend to empty array when null', () => {
    expect(normalizeModelPerformanceResponse({ mapeTrend: null }).mapeTrend).toEqual([])
    expect(normalizeModelPerformanceResponse({}).mapeTrend).toEqual([])
  })

  it('preserves null cabinetMape in mapeTrend entries (ratio field)', () => {
    const result = normalizeModelPerformanceResponse({
      mapeTrend: [{ evaluationDate: '2026-05-01', cabinetMape: null, skuCount: 10 }],
    })
    expect(result.mapeTrend[0].cabinetMape).toBeNull()
  })

  it('uses semantic-zero for skuCount in mapeTrend when missing', () => {
    const result = normalizeModelPerformanceResponse({
      mapeTrend: [{ evaluationDate: '2026-05-01' }],
    })
    expect(result.mapeTrend[0].skuCount).toBe(0)
  })

  it('normalizes previousVersionMetrics with null mape', () => {
    const result = normalizeModelPerformanceResponse({
      previousVersionMetrics: { mape: null, dataPointsCount: 100 },
    })
    expect(result.previousVersionMetrics?.mape).toBeNull()
    expect(result.previousVersionMetrics?.dataPointsCount).toBe(100)
  })
})
