/**
 * AI Forecast boundary normalizer — Story 126.3-FE
 * Tests scaleConfidence edge cases via the exported normalizeAiForecastResponse.
 */

import { describe, it, expect } from 'vitest'
import { normalizeAiForecastResponse } from '../ai-forecast-normalizer'

/** Minimal valid raw response with one prediction. confidence overridden per test. */
function buildWithConfidence(confidence: unknown) {
  return {
    predictions: [
      {
        forecastDate: '2026-06-07',
        horizonDays: 7,
        predictedUnits: 100,
        confidence,
      },
    ],
    modelVersion: 1,
    engine: 'prophet',
    cached: false,
    generatedAt: '2026-06-07T00:00:00Z',
  }
}

function getConfidence(raw: unknown): number | null {
  return normalizeAiForecastResponse(raw).predictions[0].confidence
}

describe('scaleConfidence edge cases (via normalizer)', () => {
  it('NaN confidence → null', () => {
    expect(getConfidence(buildWithConfidence(NaN))).toBeNull()
  })

  it('Infinity confidence → null', () => {
    expect(getConfidence(buildWithConfidence(Infinity))).toBeNull()
  })

  it('-Infinity confidence → null', () => {
    expect(getConfidence(buildWithConfidence(-Infinity))).toBeNull()
  })

  it('negative confidence → 0', () => {
    expect(getConfidence(buildWithConfidence(-5))).toBe(0)
  })

  it('> 1 confidence → 1', () => {
    expect(getConfidence(buildWithConfidence(42))).toBe(1)
  })

  it('0 confidence → 0', () => {
    expect(getConfidence(buildWithConfidence(0))).toBe(0)
  })

  it('1 confidence → 1', () => {
    expect(getConfidence(buildWithConfidence(1))).toBe(1)
  })

  it('0.5 confidence → 0.5', () => {
    expect(getConfidence(buildWithConfidence(0.5))).toBe(0.5)
  })

  it('null confidence → null', () => {
    expect(getConfidence(buildWithConfidence(null))).toBeNull()
  })

  it('undefined confidence → null', () => {
    const raw = {
      predictions: [{ forecastDate: '2026-06-07', predictedUnits: 100 }],
      modelVersion: 1,
      engine: 'prophet',
      cached: false,
      generatedAt: '2026-06-07T00:00:00Z',
    }
    expect(getConfidence(raw)).toBeNull()
  })

  it('string confidence → null', () => {
    expect(getConfidence(buildWithConfidence('high'))).toBeNull()
  })
})
