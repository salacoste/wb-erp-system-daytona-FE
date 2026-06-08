/**
 * Search Position Trends Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  normalizePositionTrendsResponse,
  normalizePositionMoversResponse,
  normalizePageOneOpportunitiesResponse,
  normalizePositionHistoryResponse,
} from '../search-position-trends-normalizer'

// --- normalizePositionTrendsResponse ---

describe('normalizePositionTrendsResponse', () => {
  it('normalizes a fully-populated response', () => {
    const raw = {
      movers: [
        {
          nmId: 100,
          currentAvgPosition: 5.2,
          previousAvgPosition: 8.1,
          positionChange: -2.9,
          trend: 'improving',
          totalQueries: 50,
          totalImpressions: 200,
          topQuery: 'dress',
        },
      ],
      closeToPageOne: [
        {
          nmId: 200,
          currentAvgPosition: 11,
          positionsAway: 1,
          totalImpressions: 100,
          totalQueries: 30,
        },
      ],
      summary: {
        improvingCount: 5,
        decliningCount: 2,
        stableCount: 10,
        closeToPageOneCount: 3,
        totalSkusAnalyzed: 17,
        currentWeekStart: '2026-W01',
        previousWeekStart: '2026-W02',
      },
    }
    const result = normalizePositionTrendsResponse(raw)
    expect(result.movers).toHaveLength(1)
    expect(result.movers[0].nmId).toBe(100)
    expect(result.movers[0].trend).toBe('improving')
    expect(result.movers[0].topQuery).toBe('dress')
    expect(result.closeToPageOne).toHaveLength(1)
    expect(result.closeToPageOne[0].positionsAway).toBe(1)
    expect(result.summary.improvingCount).toBe(5)
    expect(result.summary.totalSkusAnalyzed).toBe(17)
    expect(result.summary.currentWeekStart).toBe('2026-W01')
  })

  it('defaults movers and closeToPageOne to empty arrays', () => {
    const result = normalizePositionTrendsResponse({})
    expect(result.movers).toEqual([])
    expect(result.closeToPageOne).toEqual([])
    expect(result.summary.improvingCount).toBe(0)
  })

  it('coerces invalid trend to stable', () => {
    const raw = {
      movers: [{ nmId: 1, trend: 'invalid_value' }],
      summary: {},
    }
    const result = normalizePositionTrendsResponse(raw)
    expect(result.movers[0].trend).toBe('stable')
  })

  it('defaults null position fields to 0', () => {
    const raw = {
      movers: [
        { nmId: 1, currentAvgPosition: null, previousAvgPosition: null, positionChange: null },
      ],
      closeToPageOne: [{ nmId: 2, currentAvgPosition: null }],
      summary: {},
    }
    const result = normalizePositionTrendsResponse(raw)
    expect(result.movers[0].currentAvgPosition).toBe(0)
    expect(result.movers[0].previousAvgPosition).toBe(0)
    expect(result.movers[0].positionChange).toBe(0)
    expect(result.closeToPageOne[0].currentAvgPosition).toBe(0)
  })

  it('returns undefined topQuery for non-string values', () => {
    const raw = { movers: [{ nmId: 1, topQuery: null }], summary: {} }
    const result = normalizePositionTrendsResponse(raw)
    expect(result.movers[0].topQuery).toBeUndefined()
  })
})

// --- normalizePositionMoversResponse ---

describe('normalizePositionMoversResponse', () => {
  it('normalizes a fully-populated response', () => {
    const raw = {
      movers: [
        {
          nmId: 100,
          vendorCode: 'VC-001',
          productName: 'Product A',
          currentPosition: 3,
          previousPosition: 7,
          positionDelta: -4,
          query: 'shoes',
        },
      ],
      period: 'weekly',
    }
    const result = normalizePositionMoversResponse(raw)
    expect(result.movers).toHaveLength(1)
    expect(result.movers[0].nmId).toBe(100)
    expect(result.movers[0].vendorCode).toBe('VC-001')
    expect(result.movers[0].positionDelta).toBe(-4)
    expect(result.period).toBe('weekly')
  })

  it('defaults to empty array for missing movers', () => {
    const result = normalizePositionMoversResponse({})
    expect(result.movers).toEqual([])
    expect(result.period).toBe('')
  })

  it('preserves null for nullable string fields', () => {
    const raw = { movers: [{ nmId: 1, vendorCode: null, productName: null, query: null }] }
    const result = normalizePositionMoversResponse(raw)
    expect(result.movers[0].vendorCode).toBeNull()
    expect(result.movers[0].productName).toBeNull()
    expect(result.movers[0].query).toBeNull()
  })
})

// --- normalizePageOneOpportunitiesResponse ---

describe('normalizePageOneOpportunitiesResponse', () => {
  it('normalizes a fully-populated response', () => {
    const raw = {
      opportunities: [
        {
          nmId: 300,
          vendorCode: 'VC-002',
          currentPosition: 12,
          query: 'hat',
          avgImpressions: 500,
          avgClicks: 50,
        },
      ],
    }
    const result = normalizePageOneOpportunitiesResponse(raw)
    expect(result.opportunities).toHaveLength(1)
    expect(result.opportunities[0].nmId).toBe(300)
    expect(result.opportunities[0].avgImpressions).toBe(500)
  })

  it('defaults to empty array for missing opportunities', () => {
    const result = normalizePageOneOpportunitiesResponse({})
    expect(result.opportunities).toEqual([])
  })
})

// --- normalizePositionHistoryResponse ---

describe('normalizePositionHistoryResponse', () => {
  it('normalizes a fully-populated response', () => {
    const raw = {
      nmId: 400,
      history: [{ date: '2026-01-15', avgPosition: 5.5, impressions: 100, clicks: 20, ctr: 0.2 }],
      days: 30,
    }
    const result = normalizePositionHistoryResponse(raw)
    expect(result.nmId).toBe(400)
    expect(result.days).toBe(30)
    expect(result.history).toHaveLength(1)
    expect(result.history[0].date).toBe('2026-01-15')
    expect(result.history[0].avgPosition).toBe(5.5)
    expect(result.history[0].ctr).toBe(0.2)
  })

  it('defaults to empty history array', () => {
    const result = normalizePositionHistoryResponse({})
    expect(result.history).toEqual([])
    expect(result.nmId).toBe(0)
    expect(result.days).toBe(0)
  })

  it('defaults null position and ctr to 0', () => {
    const raw = {
      history: [{ avgPosition: null, ctr: null }],
    }
    const result = normalizePositionHistoryResponse(raw)
    expect(result.history[0].avgPosition).toBe(0)
    expect(result.history[0].ctr).toBe(0)
  })
})
