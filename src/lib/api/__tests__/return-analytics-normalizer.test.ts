/**
 * Boundary Normalizer Tests — Return Analytics
 *
 * Covers normalizeReturnReasonsResponse for null input, missing fields,
 * empty arrays, enum coercion, and full shapes.
 */

import { describe, it, expect } from 'vitest'
import { normalizeReturnReasonsResponse } from '../return-analytics-normalizer'

// ---------------------------------------------------------------------------
// normalizeReturnReasonsResponse
// ---------------------------------------------------------------------------

describe('normalizeReturnReasonsResponse', () => {
  const fullRaw = {
    summary: {
      totalReturns: 500,
      cancelBeforeShipment: 200,
      refusalAtPvz: 150,
      returnAfterReceipt: 150,
      overallReturnRate: 12.5,
      classificationCoverage: 98.3,
    },
    byCategory: [
      {
        category: 'cancel_before_shipment',
        displayName: 'Cancel Before Shipment',
        count: 200,
        percentage: 40.0,
        trend: 'up',
        trendDelta: 5.2,
      },
      {
        category: 'refusal_at_pvz',
        displayName: 'Refusal at PVZ',
        count: 150,
        percentage: 30.0,
        trend: 'down',
        trendDelta: -3.1,
      },
    ],
    period: { from: '2026-W01', to: '2026-W04' },
  }

  it('maps a full return reasons response to canonical shape', () => {
    const result = normalizeReturnReasonsResponse(fullRaw)
    expect(result.summary.totalReturns).toBe(500)
    expect(result.summary.cancelBeforeShipment).toBe(200)
    expect(result.summary.overallReturnRate).toBe(12.5)
    expect(result.byCategory).toHaveLength(2)
    expect(result.byCategory[0].category).toBe('cancel_before_shipment')
    expect(result.byCategory[0].displayName).toBe('Cancel Before Shipment')
    expect(result.byCategory[0].count).toBe(200)
    expect(result.byCategory[0].trend).toBe('up')
    expect(result.byCategory[1].trend).toBe('down')
    expect(result.period.from).toBe('2026-W01')
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeReturnReasonsResponse(null)
    expect(result.summary.totalReturns).toBe(0)
    expect(result.summary.cancelBeforeShipment).toBe(0)
    // AP#8: rate ratio preserves null (render '—'), not 0.
    expect(result.summary.overallReturnRate).toBeNull()
    expect(result.byCategory).toEqual([])
    expect(result.period).toEqual({ from: '', to: '' })
  })

  it('returns safe defaults for undefined input', () => {
    const result = normalizeReturnReasonsResponse(undefined)
    expect(result.summary.totalReturns).toBe(0)
    expect(result.byCategory).toEqual([])
  })

  it('handles missing summary fields', () => {
    const result = normalizeReturnReasonsResponse({ summary: {}, byCategory: [] })
    expect(result.summary.totalReturns).toBe(0)
    // AP#8: rate ratio preserves null (render '—'), not 0.
    expect(result.summary.overallReturnRate).toBeNull()
  })

  it('handles empty byCategory array', () => {
    const result = normalizeReturnReasonsResponse({ byCategory: [] })
    expect(result.byCategory).toEqual([])
  })

  it('handles non-array byCategory as empty', () => {
    const result = normalizeReturnReasonsResponse({ byCategory: 'bad' })
    expect(result.byCategory).toEqual([])
  })

  it('coerces unknown category to "return_after_receipt"', () => {
    const raw = { byCategory: [{ category: 'unknown_type' }] }
    const result = normalizeReturnReasonsResponse(raw)
    expect(result.byCategory[0].category).toBe('return_after_receipt')
  })

  it('coerces unknown trend to "stable"', () => {
    const raw = { byCategory: [{ trend: 'sideways' }] }
    const result = normalizeReturnReasonsResponse(raw)
    expect(result.byCategory[0].trend).toBe('stable')
  })

  it('handles null trend delta (AP#8 — ratio field)', () => {
    const raw = { byCategory: [{ trendDelta: null }] }
    const result = normalizeReturnReasonsResponse(raw)
    expect(result.byCategory[0].trendDelta).toBe(0)
  })

  it('accepts snake_case fields', () => {
    const raw = {
      summary: { total_returns: 50, cancel_before_shipment: 10 },
      by_category: [{ display_name: 'Test', trend_delta: 2.0 }],
      period: { from: '2026-W01', to: '2026-W02' },
    }
    const result = normalizeReturnReasonsResponse(raw)
    expect(result.summary.totalReturns).toBe(50)
    expect(result.summary.cancelBeforeShipment).toBe(10)
    expect(result.byCategory[0].displayName).toBe('Test')
    expect(result.byCategory[0].trendDelta).toBe(2.0)
  })
})
