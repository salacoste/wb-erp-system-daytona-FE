/**
 * AI Evaluations normalizer tests — Story 108.1-FE
 * Covers null preservation for mape/accuracy ratio fields,
 * count field semantic-zeros, and empty array defaults.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiEvaluationListResponse, normalizeSkuAccuracyListResponse } from '../evaluations'

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
})
