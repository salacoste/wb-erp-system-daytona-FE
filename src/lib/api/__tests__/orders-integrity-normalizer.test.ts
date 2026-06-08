/**
 * Orders Integrity Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeIntegrityResponse,
  normalizeReconciliationResponse,
} from '../orders-integrity-normalizer'

// --- normalizeIntegrityResponse ---

describe('normalizeIntegrityResponse', () => {
  it('normalizes a fully-populated integrity response', () => {
    const raw = {
      status: 'healthy',
      checks: {
        orders_count: { status: 'pass', count: 1500 },
        revenue_match: { status: 'warn', count: 3 },
      },
      lastCheck: '2026-01-15T12:00:00Z',
      durationMs: 250,
    }
    const result = normalizeIntegrityResponse(raw)
    expect(result.status).toBe('healthy')
    expect(result.lastCheck).toBe('2026-01-15T12:00:00Z')
    expect(result.durationMs).toBe(250)
    expect(result.checks['orders_count'].status).toBe('pass')
    expect(result.checks['orders_count'].count).toBe(1500)
    expect(result.checks['revenue_match'].status).toBe('warn')
    expect(result.checks['revenue_match'].count).toBe(3)
  })

  it('handles snake_case last_check and duration_ms', () => {
    const raw = {
      status: 'healthy',
      checks: {},
      last_check: '2026-02-01T00:00:00Z',
      duration_ms: 100,
    }
    const result = normalizeIntegrityResponse(raw)
    expect(result.lastCheck).toBe('2026-02-01T00:00:00Z')
    expect(result.durationMs).toBe(100)
  })

  it('defaults to unhealthy for invalid status', () => {
    const raw = { status: 'unknown_status', checks: {} }
    const result = normalizeIntegrityResponse(raw)
    expect(result.status).toBe('unhealthy')
  })

  it('defaults check status to fail for invalid value', () => {
    const raw = { checks: { test: { status: 'bogus', count: 0 } } }
    const result = normalizeIntegrityResponse(raw)
    expect(result.checks['test'].status).toBe('fail')
  })

  it('defaults missing fields on empty input', () => {
    const result = normalizeIntegrityResponse({})
    expect(result.status).toBe('unhealthy')
    expect(result.checks).toEqual({})
    expect(result.lastCheck).toBe('')
    expect(result.durationMs).toBe(0)
  })

  it('handles null input', () => {
    const result = normalizeIntegrityResponse(null)
    expect(result.status).toBe('unhealthy')
    expect(result.checks).toEqual({})
  })
})

// --- normalizeReconciliationResponse ---

describe('normalizeReconciliationResponse', () => {
  it('normalizes a fully-populated reconciliation response', () => {
    const raw = {
      totalCount: 1000,
      localCount: 990,
      expectedCount: 1000,
      variance: 10,
      variancePercent: 1.0,
      byStatus: [
        {
          status: 'confirmed',
          localCount: 500,
          expectedCount: 500,
          variance: 0,
          variancePercent: 0,
        },
      ],
      byDate: [
        {
          date: '2026-01-15',
          localCount: 50,
          expectedCount: 50,
          variance: 0,
          variancePercent: 0,
        },
      ],
    }
    const result = normalizeReconciliationResponse(raw)
    expect(result.totalCount).toBe(1000)
    expect(result.localCount).toBe(990)
    expect(result.variance).toBe(10)
    expect(result.variancePercent).toBe(1.0)
    expect(result.byStatus).toHaveLength(1)
    expect(result.byStatus[0].status).toBe('confirmed')
    expect(result.byDate).toHaveLength(1)
    expect(result.byDate[0].date).toBe('2026-01-15')
  })

  it('handles snake_case fields', () => {
    const raw = {
      total_count: 500,
      local_count: 480,
      expected_count: 500,
      variance: 20,
      variance_percent: 4.0,
      by_status: [{ status: 'new', local_count: 10, expected_count: 10, variance: 0 }],
      by_date: [{ date: '2026-01-01', local_count: 5, expected_count: 5, variance: 0 }],
    }
    const result = normalizeReconciliationResponse(raw)
    expect(result.totalCount).toBe(500)
    expect(result.localCount).toBe(480)
    expect(result.variancePercent).toBe(4.0)
    expect(result.byStatus).toHaveLength(1)
    expect(result.byStatus[0].localCount).toBe(10)
    expect(result.byDate).toHaveLength(1)
    expect(result.byDate[0].localCount).toBe(5)
  })

  it('preserves null for variancePercent (ratio field per AP#8)', () => {
    const raw = { variancePercent: null }
    const result = normalizeReconciliationResponse(raw)
    expect(result.variancePercent).toBeNull()
  })

  it('defaults to empty arrays for missing byStatus/byDate', () => {
    const result = normalizeReconciliationResponse({})
    expect(result.byStatus).toEqual([])
    expect(result.byDate).toEqual([])
    expect(result.totalCount).toBe(0)
    expect(result.variancePercent).toBeNull()
  })

  it('handles null input', () => {
    const result = normalizeReconciliationResponse(null)
    expect(result.totalCount).toBe(0)
    expect(result.byStatus).toEqual([])
    expect(result.byDate).toEqual([])
  })
})
