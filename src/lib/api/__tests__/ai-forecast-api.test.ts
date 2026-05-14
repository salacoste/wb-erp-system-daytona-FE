/**
 * AI Forecast normalizer — Boundary Normalizer Pattern coverage (Story 103.4-FE polish).
 * Covers field rename (forecastDate→date, predictedUnits→predictedSales), null/missing
 * predictions array (defensive for ML model not-trained / rollback / cache-miss states),
 * and nullability collapse for explanation/rollbackNotice.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiForecastResponse } from '../ai-forecast-api'

describe('normalizeAiForecastResponse', () => {
  it('renames forecastDate → date and predictedUnits → predictedSales', () => {
    const raw = {
      predictions: [
        { forecastDate: '2026-05-15', predictedUnits: 2.5, confidence: 0.42 },
        { forecastDate: '2026-05-16', predictedUnits: 3.0, confidence: 0.85 },
      ],
      modelVersion: 7,
      engine: 'mindsdb',
      cached: false,
      generatedAt: '2026-05-15T00:00:00Z',
    }

    const normalized = normalizeAiForecastResponse(raw)

    expect(normalized.predictions).toEqual([
      { date: '2026-05-15', predictedSales: 2.5, confidence: 0.42 },
      { date: '2026-05-16', predictedSales: 3.0, confidence: 0.85 },
    ])
  })

  it('passes through scalar fields (modelVersion, engine, cached, generatedAt)', () => {
    const raw = {
      predictions: [],
      modelVersion: 12,
      engine: 'mindsdb',
      cached: true,
      generatedAt: '2026-05-15T00:00:00Z',
    }

    const normalized = normalizeAiForecastResponse(raw)

    expect(normalized.modelVersion).toBe(12)
    expect(normalized.engine).toBe('mindsdb')
    expect(normalized.cached).toBe(true)
    expect(normalized.generatedAt).toBe('2026-05-15T00:00:00Z')
  })

  it('collapses undefined explanation/rollbackNotice to null', () => {
    const raw = {
      predictions: [],
      modelVersion: 1,
      engine: 'mindsdb',
      cached: false,
      generatedAt: '2026-05-15T00:00:00Z',
    }

    const normalized = normalizeAiForecastResponse(raw)

    expect(normalized.explanation).toBeNull()
    expect(normalized.rollbackNotice).toBeNull()
  })

  it('preserves provided explanation/rollbackNotice strings', () => {
    const raw = {
      predictions: [],
      modelVersion: 1,
      engine: 'mindsdb',
      cached: false,
      generatedAt: '2026-05-15T00:00:00Z',
      explanation: 'Confidence intervals trained on 90 days of history',
      rollbackNotice: 'Model rolled back from v8 to v7 due to drift',
    }

    const normalized = normalizeAiForecastResponse(raw)

    expect(normalized.explanation).toBe('Confidence intervals trained on 90 days of history')
    expect(normalized.rollbackNotice).toBe('Model rolled back from v8 to v7 due to drift')
  })

  // Defensive Frontend Principle: backend may return null/undefined predictions
  // when model not trained, cache miss, or rollback path. Normalizer must not throw.
  it('handles null predictions array (model not trained / rollback) without throwing', () => {
    const raw = {
      predictions: null,
      modelVersion: 0,
      engine: 'mindsdb',
      cached: false,
      generatedAt: '2026-05-15T00:00:00Z',
    }

    const normalized = normalizeAiForecastResponse(raw)

    expect(normalized.predictions).toEqual([])
  })

  it('handles missing predictions field (model not trained) without throwing', () => {
    const raw = {
      modelVersion: 0,
      engine: 'mindsdb',
      cached: false,
      generatedAt: '2026-05-15T00:00:00Z',
    }

    const normalized = normalizeAiForecastResponse(raw)

    expect(normalized.predictions).toEqual([])
  })
})
