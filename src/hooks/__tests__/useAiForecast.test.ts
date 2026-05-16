/**
 * useAiForecast — cache key isolation tests.
 * Story 109.1-FE: asserts different modelType values produce different queryKeys
 * (prevents stale cross-model-type cache hit — cabinet-isolation discipline, Story 97.5-FE).
 */
import { describe, it, expect } from 'vitest'
import { aiForecastKeys } from '../useAiForecast'

describe('aiForecastKeys.forecast', () => {
  const cabinetId = 'cab-123'
  const baseParams = { level: 'sku' as const, nmId: 42, horizonDays: 7 }

  it('same params with different modelType produce DIFFERENT queryKeys', () => {
    const keyA = aiForecastKeys.forecast(cabinetId, {
      ...baseParams,
      modelType: 'sales_forecast',
    })
    const keyB = aiForecastKeys.forecast(cabinetId, {
      ...baseParams,
      modelType: 'demand_forecast',
    })
    expect(keyA).not.toEqual(keyB)
  })

  it('modelType=undefined falls back to "sales_forecast" sentinel in key', () => {
    const keyWithDefault = aiForecastKeys.forecast(cabinetId, {
      ...baseParams,
      modelType: undefined,
    })
    const keyExplicit = aiForecastKeys.forecast(cabinetId, {
      ...baseParams,
      modelType: 'sales_forecast',
    })
    // Both should resolve to the same cache slot (undefined treated as 'sales_forecast')
    expect(keyWithDefault).toEqual(keyExplicit)
  })

  it('key includes cabinetId (multi-tenant cabinet-isolation discipline)', () => {
    const key = aiForecastKeys.forecast(cabinetId, {
      ...baseParams,
      modelType: 'stockout_risk',
    })
    expect(key).toContain(cabinetId)
  })

  it('key includes modelType value', () => {
    const key = aiForecastKeys.forecast(cabinetId, {
      ...baseParams,
      modelType: 'weekly_margin_forecast',
    })
    expect(key).toContain('weekly_margin_forecast')
  })

  it('different cabinetIds produce different keys for same params', () => {
    const params = { ...baseParams, modelType: 'sales_forecast' as const }
    const keyA = aiForecastKeys.forecast('cab-111', params)
    const keyB = aiForecastKeys.forecast('cab-222', params)
    expect(keyA).not.toEqual(keyB)
  })
})
