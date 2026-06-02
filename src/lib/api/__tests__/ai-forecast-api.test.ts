/**
 * AI Forecast normalizer — Boundary Normalizer Pattern coverage (Story 103.4-FE polish).
 * Covers field rename (forecastDate→date, predictedUnits→predictedSales), null/missing
 * predictions array (defensive for ML model not-trained / rollback / cache-miss states),
 * and nullability collapse for explanation/rollbackNotice.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiForecastResponse } from '../ai-forecast-api'

describe('normalizeAiForecastResponse', () => {
  it('renames forecastDate → date and predictedUnits → predictedSales, scales percentage-form confidence to 0-1', () => {
    // F-17: confidence uses magnitude detection (>1 → /100). 42/85 are >1 so they
    // map to 0.42/0.85; live 0-1 values pass through. See scaleConfidence + Request #180.
    const raw = {
      predictions: [
        { forecastDate: '2026-05-15', predictedUnits: 2.5, confidence: 42 },
        { forecastDate: '2026-05-16', predictedUnits: 3.0, confidence: 85 },
      ],
      modelVersion: 7,
      engine: 'mindsdb',
      cached: false,
      generatedAt: '2026-05-15T00:00:00Z',
    }

    const normalized = normalizeAiForecastResponse(raw)

    // Story 108.1-FE: use objectContaining — prediction shape now has additional optional fields
    expect(normalized.predictions[0]).toMatchObject({
      date: '2026-05-15',
      predictedSales: 2.5,
      confidence: 0.42,
    })
    expect(normalized.predictions[1]).toMatchObject({
      date: '2026-05-16',
      predictedSales: 3.0,
      confidence: 0.85,
    })
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

  it('preserves explanation string and structured rollbackNotice object (Story 108.1-FE)', () => {
    // Story 108.1-FE: rollbackNotice is now a structured object, not a plain string.
    // Legacy string rollbackNotice values are wrapped into { previousVersion:0, rollbackDate:'', reason: <string> }
    // (Defensive Frontend Principle — Fix 5: data is preserved, not silently dropped).
    const raw = {
      predictions: [],
      modelVersion: 1,
      engine: 'mindsdb',
      cached: false,
      generatedAt: '2026-05-15T00:00:00Z',
      explanation: 'Confidence intervals trained on 90 days of history',
      rollbackNotice: {
        previousVersion: 8,
        rollbackDate: '2026-05-15',
        reason: 'Model rolled back from v8 to v7 due to drift',
      },
    }

    const normalized = normalizeAiForecastResponse(raw)

    expect(normalized.explanation).toBe('Confidence intervals trained on 90 days of history')
    expect(normalized.rollbackNotice).toEqual({
      previousVersion: 8,
      rollbackDate: '2026-05-15',
      reason: 'Model rolled back from v8 to v7 due to drift',
    })
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
