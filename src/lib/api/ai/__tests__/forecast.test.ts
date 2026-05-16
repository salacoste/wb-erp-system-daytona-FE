/**
 * AI Forecast normalizer tests — Story 108.1-FE
 * Covers extended prediction fields (predictedRevenue, naiveBaseline, aiVsNaive,
 * forecastId, horizonDays) and structured rollbackNotice shape.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiForecastResponse } from '../forecast'

describe('normalizeAiForecastResponse — extended fields', () => {
  const base = {
    modelVersion: 3,
    engine: 'prophet' as const,
    cached: false,
    generatedAt: '2026-05-16T00:00:00Z',
  }

  it('maps forecastDate→date and predictedUnits→predictedSales', () => {
    const result = normalizeAiForecastResponse({
      ...base,
      predictions: [{ forecastDate: '2026-05-17', predictedUnits: 42.5, confidence: 82 }],
    })
    expect(result.predictions[0].date).toBe('2026-05-17')
    expect(result.predictions[0].predictedSales).toBe(42.5)
  })

  it('preserves nullable money fields as null when missing', () => {
    const result = normalizeAiForecastResponse({
      ...base,
      predictions: [{ forecastDate: '2026-05-17', predictedUnits: 5 }],
    })
    expect(result.predictions[0].predictedRevenue).toBeNull()
    expect(result.predictions[0].naiveBaseline).toBeNull()
    expect(result.predictions[0].confidence).toBeNull()
    expect(result.predictions[0].aiVsNaive).toBeNull()
  })

  it('passes through extended prediction fields when present', () => {
    const result = normalizeAiForecastResponse({
      ...base,
      predictions: [
        {
          forecastDate: '2026-05-17',
          predictedUnits: 10,
          predictedRevenue: 5000,
          naiveBaseline: 4500,
          aiVsNaive: '+11.1%',
          confidence: 78,
          nmId: 12345,
          vendorCode: 'SKU-001',
          forecastId: 'uuid-abc',
          horizonDays: 7,
        },
      ],
    })
    const p = result.predictions[0]
    expect(p.predictedRevenue).toBe(5000)
    expect(p.naiveBaseline).toBe(4500)
    expect(p.aiVsNaive).toBe('+11.1%')
    expect(p.confidence).toBe(78)
    expect(p.nmId).toBe(12345)
    expect(p.vendorCode).toBe('SKU-001')
    expect(p.forecastId).toBe('uuid-abc')
    expect(p.horizonDays).toBe(7)
  })

  it('normalizes structured rollbackNotice object', () => {
    const result = normalizeAiForecastResponse({
      ...base,
      predictions: [],
      rollbackNotice: {
        previousVersion: 5,
        rollbackDate: '2026-05-15',
        reason: 'MAPE degraded',
      },
    })
    expect(result.rollbackNotice).toEqual({
      previousVersion: 5,
      rollbackDate: '2026-05-15',
      reason: 'MAPE degraded',
    })
  })

  it('collapses legacy string rollbackNotice to null', () => {
    const result = normalizeAiForecastResponse({
      ...base,
      predictions: [],
      rollbackNotice: 'some string value',
    })
    expect(result.rollbackNotice).toBeNull()
  })

  it('handles null/missing predictions defensively', () => {
    const result = normalizeAiForecastResponse({ ...base, predictions: null })
    expect(result.predictions).toEqual([])
  })
})
