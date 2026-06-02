/**
 * AI Forecast normalizer tests — Story 108.1-FE
 * Covers extended prediction fields (predictedRevenue, naiveBaseline, aiVsNaive,
 * forecastId, horizonDays), structured rollbackNotice shape, confidence
 * magnitude-detection normalization (F-17: backend scale is inconsistent —
 * percentage >1 vs probability ≤1 both map to 0-1), and legacy string rollbackNotice wrapping.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { normalizeAiForecastResponse } from '../forecast'
import { getConfidenceBand } from '@/types/ai-forecast'

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

  it('normalizes a percentage-scale (>1) confidence to 0-1 (e.g. 82 → 0.82)', () => {
    const result = normalizeAiForecastResponse({
      ...base,
      predictions: [{ forecastDate: '2026-05-17', predictedUnits: 42.5, confidence: 82 }],
    })
    expect(result.predictions[0].confidence).toBeCloseTo(0.82)
  })

  // Validation F-17: live backend emits 0-1 already (prophet ~0.80). The old
  // blanket /100 collapsed these to ~0.8% → all forecasts showed "low" band.
  it('preserves an already-0-1 confidence verbatim (live-reality regression guard)', () => {
    const result = normalizeAiForecastResponse({
      ...base,
      predictions: [{ forecastDate: '2026-05-17', predictedUnits: 42.5, confidence: 0.797 }],
    })
    expect(result.predictions[0].confidence).toBeCloseTo(0.797)
  })

  // Validation F-45: the engine returns predictedRevenue:0 as a placeholder for EVERY
  // prediction (units are real ~700 while revenue is 0). Map 0 → null so the table renders
  // '—' (unknown) instead of a misleading "0 ₽" (AP#8). A real non-zero revenue passes through.
  it('maps placeholder predictedRevenue:0 → null; keeps a real value', () => {
    const r = normalizeAiForecastResponse({
      ...base,
      predictions: [
        { forecastDate: '2026-05-17', predictedUnits: 739, predictedRevenue: 0, confidence: 0.79 },
        {
          forecastDate: '2026-05-18',
          predictedUnits: 700,
          predictedRevenue: 145811.61,
          confidence: 0.78,
        },
        { forecastDate: '2026-05-19', predictedUnits: 1, predictedRevenue: NaN, confidence: 0.7 },
        { forecastDate: '2026-05-20', predictedUnits: 1, predictedRevenue: null, confidence: 0.7 },
      ],
    })
    expect(r.predictions[0].predictedRevenue).toBeNull()
    expect(r.predictions[1].predictedRevenue).toBe(145811.61)
    // NaN/Infinity (parse failures) and explicit null → null, never garbage "NaN ₽".
    expect(r.predictions[2].predictedRevenue).toBeNull()
    expect(r.predictions[3].predictedRevenue).toBeNull()
  })

  it('clamps out-of-range confidence to [0,1]', () => {
    const r = normalizeAiForecastResponse({
      ...base,
      predictions: [
        { forecastDate: '2026-05-17', predictedUnits: 1, confidence: 150 },
        { forecastDate: '2026-05-18', predictedUnits: 1, confidence: -0.5 },
      ],
    })
    expect(r.predictions[0].confidence).toBe(1)
    expect(r.predictions[1].confidence).toBe(0)
  })

  it('keeps exactly 1.0 as 1.0 (0-1 upper bound — boundary is strict >1, not >=1)', () => {
    const r = normalizeAiForecastResponse({
      ...base,
      predictions: [{ forecastDate: '2026-05-17', predictedUnits: 1, confidence: 1 }],
    })
    expect(r.predictions[0].confidence).toBe(1)
  })

  it('treats just-above-1 as percentage scale (1.0001 → ~0.01)', () => {
    const r = normalizeAiForecastResponse({
      ...base,
      predictions: [{ forecastDate: '2026-05-17', predictedUnits: 1, confidence: 1.0001 }],
    })
    expect(r.predictions[0].confidence).toBeCloseTo(0.010001)
  })

  it('non-finite confidence (NaN/Infinity) → null', () => {
    const r = normalizeAiForecastResponse({
      ...base,
      predictions: [
        { forecastDate: '2026-05-17', predictedUnits: 1, confidence: NaN },
        { forecastDate: '2026-05-18', predictedUnits: 1, confidence: Infinity },
      ],
    })
    expect(r.predictions[0].confidence).toBeNull()
    expect(r.predictions[1].confidence).toBeNull()
  })

  // F-17 user-visible regression guard: the live 0.797 must land in 'high', not
  // 'low' (the old /100 made it 0.008 → always 'low'). This is the test that
  // would have caught the original bug end-to-end (normalizer → band).
  it('a live 0-1 confidence (0.797) normalizes to the "high" band, not "low"', () => {
    const r = normalizeAiForecastResponse({
      ...base,
      predictions: [{ forecastDate: '2026-05-17', predictedUnits: 42.5, confidence: 0.797 }],
    })
    const c = r.predictions[0].confidence
    expect(c).not.toBeNull()
    expect(getConfidenceBand(c as number)).toBe('high')
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

  it('passes through extended prediction fields when present (confidence normalized to 0-1)', () => {
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
    // Backend 78 → normalized 0.78
    expect(p.confidence).toBeCloseTo(0.78)
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

  describe('legacy string rollbackNotice — Fix 5 (Defensive Frontend Principle)', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('wraps legacy string rollbackNotice into structured object preserving raw string as reason', () => {
      const result = normalizeAiForecastResponse({
        ...base,
        predictions: [],
        rollbackNotice: 'rolled back due to MAPE spike',
      })
      expect(result.rollbackNotice).toEqual({
        previousVersion: 0,
        rollbackDate: '',
        reason: 'rolled back due to MAPE spike',
      })
    })

    it('emits console.warn when legacy string rollbackNotice is received', () => {
      normalizeAiForecastResponse({
        ...base,
        predictions: [],
        rollbackNotice: 'some string value',
      })
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Legacy string rollbackNotice received')
      )
    })
  })

  it('handles null/missing predictions defensively', () => {
    const result = normalizeAiForecastResponse({ ...base, predictions: null })
    expect(result.predictions).toEqual([])
  })
})
