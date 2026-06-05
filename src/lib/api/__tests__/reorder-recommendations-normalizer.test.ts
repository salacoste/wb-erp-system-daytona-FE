import { describe, it, expect } from 'vitest'
import {
  normalizeReorderRecommendationsResponse,
  normalizeReorderMetricsResponse,
} from '../reorder-recommendations-normalizer'
import type {
  ReorderRecommendation,
  ReorderFulfillmentMetrics,
} from '@/types/reorder-recommendations'

// ---------------------------------------------------------------------------
// Shared raw shapes (backend-like)
// ---------------------------------------------------------------------------

function rawItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'rec-001',
    nmId: 55432100,
    recommendedQty: 50,
    currentStock: 10,
    inTransitQty: 5,
    avgDailyDemand: 3.2,
    demandSource: 'ml',
    leadTimeDays: 7,
    coverageDays: 3,
    orderByDate: '2026-06-10',
    stockoutDate: '2026-06-15',
    status: 'pending',
    unitCostRub: 250.5,
    totalReorderValue: 12525,
    computedAt: '2026-06-05T08:00:00Z',
    ...overrides,
  }
}

function rawMetrics(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    totalPending: 12,
    totalOrdered: 5,
    totalReceived: 30,
    totalExpired: 2,
    avgHoursToOrder: 4.5,
    avgHoursToReceive: 48.2,
    reorderCoveragePct: 78.5,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// normalizeReorderRecommendationsResponse
// ---------------------------------------------------------------------------

describe('normalizeReorderRecommendationsResponse', () => {
  it('maps a well-formed array of items', () => {
    const raw = [rawItem(), rawItem({ id: 'rec-002', nmId: 998877 })]

    const result = normalizeReorderRecommendationsResponse(raw)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('rec-001')
    expect(result[0].nmId).toBe(55432100)
    expect(result[1].id).toBe('rec-002')
    expect(result[1].nmId).toBe(998877)
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeReorderRecommendationsResponse({})).toEqual([])
    expect(normalizeReorderRecommendationsResponse(null)).toEqual([])
    expect(normalizeReorderRecommendationsResponse('bad')).toEqual([])
    expect(normalizeReorderRecommendationsResponse(42)).toEqual([])
  })

  it('returns empty array for undefined input', () => {
    expect(normalizeReorderRecommendationsResponse(undefined)).toEqual([])
  })

  it('returns empty array for empty array input', () => {
    expect(normalizeReorderRecommendationsResponse([])).toEqual([])
  })

  it('maps each item through toItem with full field check', () => {
    const raw = [rawItem()]
    const item: ReorderRecommendation = normalizeReorderRecommendationsResponse(raw)[0]

    expect(item.id).toBe('rec-001')
    expect(item.nmId).toBe(55432100)
    expect(item.recommendedQty).toBe(50)
    expect(item.currentStock).toBe(10)
    expect(item.inTransitQty).toBe(5)
    expect(item.avgDailyDemand).toBe(3.2)
    expect(item.demandSource).toBe('ml')
    expect(item.leadTimeDays).toBe(7)
    expect(item.coverageDays).toBe(3)
    expect(item.orderByDate).toBe('2026-06-10')
    expect(item.stockoutDate).toBe('2026-06-15')
    expect(item.status).toBe('pending')
    expect(item.unitCostRub).toBe(250.5)
    expect(item.totalReorderValue).toBe(12525)
    expect(item.computedAt).toBe('2026-06-05T08:00:00Z')
  })
})

// ---------------------------------------------------------------------------
// normalizeReorderMetricsResponse
// ---------------------------------------------------------------------------

describe('normalizeReorderMetricsResponse', () => {
  it('maps a well-formed metrics object', () => {
    const raw = rawMetrics()
    const result: ReorderFulfillmentMetrics = normalizeReorderMetricsResponse(raw)

    expect(result.totalPending).toBe(12)
    expect(result.totalOrdered).toBe(5)
    expect(result.totalReceived).toBe(30)
    expect(result.totalExpired).toBe(2)
    expect(result.avgHoursToOrder).toBe(4.5)
    expect(result.avgHoursToReceive).toBe(48.2)
    expect(result.reorderCoveragePct).toBe(78.5)
  })

  it('defaults all count fields to 0 when missing', () => {
    const result = normalizeReorderMetricsResponse({})

    expect(result.totalPending).toBe(0)
    expect(result.totalOrdered).toBe(0)
    expect(result.totalReceived).toBe(0)
    expect(result.totalExpired).toBe(0)
  })

  it('preserves null on avgHoursToOrder', () => {
    const result = normalizeReorderMetricsResponse(rawMetrics({ avgHoursToOrder: null }))

    expect(result.avgHoursToOrder).toBeNull()
  })

  it('preserves null on avgHoursToReceive', () => {
    const result = normalizeReorderMetricsResponse(rawMetrics({ avgHoursToReceive: null }))

    expect(result.avgHoursToReceive).toBeNull()
  })

  it('defaults reorderCoveragePct to 0 when null', () => {
    const result = normalizeReorderMetricsResponse(rawMetrics({ reorderCoveragePct: null }))

    expect(result.reorderCoveragePct).toBe(0)
  })

  it('handles null input', () => {
    const result = normalizeReorderMetricsResponse(null)

    expect(result.totalPending).toBe(0)
    expect(result.avgHoursToOrder).toBeNull()
    expect(result.reorderCoveragePct).toBe(0)
  })

  it('handles undefined input', () => {
    const result = normalizeReorderMetricsResponse(undefined)

    expect(result.totalPending).toBe(0)
  })

  it('handles non-object input (number)', () => {
    const result = normalizeReorderMetricsResponse(123)

    expect(result.totalOrdered).toBe(0)
  })

  it('coerces non-numeric count fields to 0', () => {
    const result = normalizeReorderMetricsResponse({ totalPending: 'many', totalOrdered: NaN })

    expect(result.totalPending).toBe(0)
    expect(result.totalOrdered).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Enum fallback: demandSource
// ---------------------------------------------------------------------------

describe('demandSource coercion', () => {
  it('passes through "ml"', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ demandSource: 'ml' })])[0]

    expect(item.demandSource).toBe('ml')
  })

  it('passes through "velocity"', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ demandSource: 'velocity' })])[0]

    expect(item.demandSource).toBe('velocity')
  })

  it('falls back to "velocity" for unknown value', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ demandSource: 'forecast' })])[0]

    expect(item.demandSource).toBe('velocity')
  })

  it('falls back to "velocity" for null', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ demandSource: null })])[0]

    expect(item.demandSource).toBe('velocity')
  })

  it('falls back to "velocity" for missing field', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ demandSource: undefined })])[0]

    expect(item.demandSource).toBe('velocity')
  })
})

// ---------------------------------------------------------------------------
// Enum fallback: status
// ---------------------------------------------------------------------------

describe('reorder status coercion', () => {
  const validStatuses = ['pending', 'ordered', 'received', 'expired'] as const

  it.each(validStatuses)('passes through known status "%s"', status => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ status })])[0]

    expect(item.status).toBe(status)
  })

  it('falls back to "pending" for unknown value', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ status: 'shipped' })])[0]

    expect(item.status).toBe('pending')
  })

  it('falls back to "pending" for null', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ status: null })])[0]

    expect(item.status).toBe('pending')
  })

  it('falls back to "pending" for number', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ status: 1 })])[0]

    expect(item.status).toBe('pending')
  })
})

// ---------------------------------------------------------------------------
// Nullable money fields
// ---------------------------------------------------------------------------

describe('nullable money/ratio fields on reorder items', () => {
  it('preserves null on unitCostRub', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ unitCostRub: null })])[0]

    expect(item.unitCostRub).toBeNull()
  })

  it('preserves null on totalReorderValue', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ totalReorderValue: null })])[0]

    expect(item.totalReorderValue).toBeNull()
  })

  it('coerces NaN on unitCostRub to null', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ unitCostRub: NaN })])[0]

    expect(item.unitCostRub).toBeNull()
  })

  it('coerces Infinity on totalReorderValue to null', () => {
    const item = normalizeReorderRecommendationsResponse([
      rawItem({ totalReorderValue: Infinity }),
    ])[0]

    expect(item.totalReorderValue).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Count field defaults
// ---------------------------------------------------------------------------

describe('count fields default to 0 on bad input', () => {
  it('defaults recommendedQty to 0 for null', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ recommendedQty: null })])[0]

    expect(item.recommendedQty).toBe(0)
  })

  it('defaults currentStock to 0 for undefined', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ currentStock: undefined })])[0]

    expect(item.currentStock).toBe(0)
  })

  it('defaults inTransitQty to 0 for non-numeric string', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ inTransitQty: 'abc' })])[0]

    expect(item.inTransitQty).toBe(0)
  })

  it('defaults leadTimeDays to 0 for NaN', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ leadTimeDays: NaN })])[0]

    expect(item.leadTimeDays).toBe(0)
  })

  it('defaults coverageDays to 0 for Infinity', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ coverageDays: Infinity })])[0]

    expect(item.coverageDays).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// avgDailyDemand: nullable → 0 fallback
// ---------------------------------------------------------------------------

describe('avgDailyDemand defaults to 0 when null', () => {
  it('converts null to 0 (normalizer uses ?? 0)', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ avgDailyDemand: null })])[0]

    expect(item.avgDailyDemand).toBe(0)
  })

  it('converts undefined to 0', () => {
    const item = normalizeReorderRecommendationsResponse([
      rawItem({ avgDailyDemand: undefined }),
    ])[0]

    expect(item.avgDailyDemand).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// String fields
// ---------------------------------------------------------------------------

describe('string field coercion on reorder items', () => {
  it('defaults id to empty string for missing', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ id: undefined })])[0]

    expect(item.id).toBe('')
  })

  it('defaults orderByDate to null for non-string', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ orderByDate: 99999 })])[0]

    expect(item.orderByDate).toBeNull()
  })

  it('preserves null stockoutDate', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ stockoutDate: null })])[0]

    expect(item.stockoutDate).toBeNull()
  })

  it('defaults computedAt to empty string for non-string', () => {
    const item = normalizeReorderRecommendationsResponse([rawItem({ computedAt: false })])[0]

    expect(item.computedAt).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Fully empty item
// ---------------------------------------------------------------------------

describe('fully empty reorder item', () => {
  it('handles an empty object', () => {
    const item = normalizeReorderRecommendationsResponse([{}])[0]

    expect(item.id).toBe('')
    expect(item.nmId).toBe(0)
    expect(item.recommendedQty).toBe(0)
    expect(item.currentStock).toBe(0)
    expect(item.inTransitQty).toBe(0)
    expect(item.avgDailyDemand).toBe(0)
    expect(item.demandSource).toBe('velocity')
    expect(item.leadTimeDays).toBe(0)
    expect(item.coverageDays).toBe(0)
    expect(item.orderByDate).toBeNull()
    expect(item.stockoutDate).toBeNull()
    expect(item.status).toBe('pending')
    expect(item.unitCostRub).toBeNull()
    expect(item.totalReorderValue).toBeNull()
    expect(item.computedAt).toBe('')
  })
})
