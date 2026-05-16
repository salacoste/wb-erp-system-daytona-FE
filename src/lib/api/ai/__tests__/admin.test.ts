/**
 * AI Admin normalizer tests — Story 108.1-FE (Fix 3)
 * Covers null/empty models array defaults, pagination defaults,
 * and correct delegation to normalizeAiModelListResponse.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAdminModelListResponse } from '../admin'

describe('normalizeAdminModelListResponse', () => {
  it('defaults to empty models array when models field is null', () => {
    const result = normalizeAdminModelListResponse({ models: null })
    expect(result.models).toEqual([])
  })

  it('defaults to empty models array when models field is missing', () => {
    const result = normalizeAdminModelListResponse({})
    expect(result.models).toEqual([])
  })

  it('applies pagination defaults (page=1, limit=20) when fields are missing', () => {
    const result = normalizeAdminModelListResponse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.total).toBe(0)
  })

  it('passes through pagination values when provided', () => {
    const result = normalizeAdminModelListResponse({ total: 42, page: 3, limit: 10 })
    expect(result.total).toBe(42)
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
  })

  it('delegates model normalization — produces correctly-normalized AiModel sub-objects', () => {
    const result = normalizeAdminModelListResponse({
      models: [
        {
          id: 'model-1',
          modelType: 'sales_forecast',
          engine: 'prophet',
          version: 2,
          status: 'active',
          metrics: { mape: 12.5, dataPointsCount: 300 },
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    })
    expect(result.models).toHaveLength(1)
    const m = result.models[0]
    expect(m.id).toBe('model-1')
    expect(m.modelType).toBe('sales_forecast')
    expect(m.engine).toBe('prophet')
    expect(m.version).toBe(2)
    expect(m.status).toBe('active')
    expect(m.metrics.mape).toBe(12.5)
    expect(m.metrics.dataPointsCount).toBe(300)
  })

  it('normalizes missing model sub-fields to safe defaults via delegated normalizer', () => {
    const result = normalizeAdminModelListResponse({
      models: [{}],
    })
    expect(result.models).toHaveLength(1)
    const m = result.models[0]
    expect(m.id).toBe('')
    expect(m.version).toBe(0)
    expect(m.metrics.mape).toBeNull()
    expect(m.metrics.dataPointsCount).toBe(0)
  })
})
