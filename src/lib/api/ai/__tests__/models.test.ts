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
    expect(normalizeAiModelListResponse(null).models).toEqual([])
  })

  // F-39: the REAL backend returns a BARE array (apiClient passes it through). The old
  // `raw.models` read undefined on an array → empty pages. This pins the prod shape.
  it('normalizes a bare array of models (real /v1/ai/models prod shape)', () => {
    const result = normalizeAiModelListResponse([
      {
        id: 'm1',
        modelType: 'sales_forecast',
        engine: 'prophet',
        version: 1,
        status: 'active',
        metrics: { mape: 12.5, dataPointsCount: 500 },
      },
    ])
    expect(result.models).toHaveLength(1)
    expect(result.models[0].id).toBe('m1')
  })

  // F-39: status is validated at the boundary — 'deprecated' (live) passes through,
  // an unknown status falls back to 'retired' so STATUS_BADGE_CONFIG[status] never crashes.
  it('keeps a known status (deprecated) and coerces an unknown status to retired', () => {
    const base = {
      id: 'm',
      modelType: 'sales_forecast',
      engine: 'prophet',
      version: 1,
      metrics: {},
    }
    expect(normalizeAiModelListResponse([{ ...base, status: 'deprecated' }]).models[0].status).toBe(
      'deprecated'
    )
    expect(
      normalizeAiModelListResponse([
        { ...base, status: 'some_future_status' },
      ] as unknown as Parameters<typeof normalizeAiModelListResponse>[0]).models[0].status
    ).toBe('retired')
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
