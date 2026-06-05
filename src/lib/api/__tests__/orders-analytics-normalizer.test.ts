/**
 * Boundary Normalizer Tests — Orders Analytics
 *
 * Covers normalizeVelocityMetricsResponse, normalizeSlaMetricsResponse,
 * and normalizeVolumeMetricsResponse for null input, missing fields,
 * empty arrays, and full shapes.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeVelocityMetricsResponse,
  normalizeSlaMetricsResponse,
  normalizeVolumeMetricsResponse,
} from '../orders-analytics-normalizer'

// ---------------------------------------------------------------------------
// normalizeVelocityMetricsResponse
// ---------------------------------------------------------------------------

describe('normalizeVelocityMetricsResponse', () => {
  const fullRaw = {
    avgConfirmationTimeMinutes: 15.5,
    avgCompletionTimeMinutes: 120.0,
    p50ConfirmationMinutes: 10,
    p95ConfirmationMinutes: 30,
    p99ConfirmationMinutes: 60,
    p50CompletionMinutes: 90,
    p95CompletionMinutes: 180,
    p99CompletionMinutes: 300,
    byWarehouse: { wh1: { avgConfirmation: 12, avgCompletion: 100 } },
    byDeliveryType: { fbs: { avgConfirmation: 20, avgCompletion: null } },
    totalOrders: 1500,
    period: { from: '2026-01-01', to: '2026-01-31' },
  }

  it('maps a full velocity response to canonical shape', () => {
    const result = normalizeVelocityMetricsResponse(fullRaw)
    expect(result.avgConfirmationTimeMinutes).toBe(15.5)
    expect(result.avgCompletionTimeMinutes).toBe(120.0)
    expect(result.p50ConfirmationMinutes).toBe(10)
    expect(result.totalOrders).toBe(1500)
    expect(result.period.from).toBe('2026-01-01')
    expect(result.byWarehouse.wh1.avgConfirmation).toBe(12)
    expect(result.byDeliveryType.fbs.avgCompletion).toBeNull()
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeVelocityMetricsResponse(null)
    expect(result.avgConfirmationTimeMinutes).toBeNull()
    expect(result.avgCompletionTimeMinutes).toBeNull()
    expect(result.totalOrders).toBe(0)
    expect(result.byWarehouse).toEqual({})
    expect(result.byDeliveryType).toEqual({})
    expect(result.period).toEqual({ from: '', to: '' })
  })

  it('handles null average times (AP#8)', () => {
    const raw = { avgConfirmationTimeMinutes: null, avgCompletionTimeMinutes: null }
    const result = normalizeVelocityMetricsResponse(raw)
    expect(result.avgConfirmationTimeMinutes).toBeNull()
    expect(result.avgCompletionTimeMinutes).toBeNull()
  })

  it('handles missing fields with safe defaults', () => {
    const result = normalizeVelocityMetricsResponse({})
    expect(result.p50ConfirmationMinutes).toBe(0)
    expect(result.totalOrders).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// normalizeSlaMetricsResponse
// ---------------------------------------------------------------------------

describe('normalizeSlaMetricsResponse', () => {
  const fullRaw = {
    confirmationSlaHours: 2,
    completionSlaHours: 24,
    confirmationCompliancePercent: 95.5,
    completionCompliancePercent: 88.0,
    pendingOrdersCount: 10,
    atRiskTotal: 3,
    atRiskOrders: [
      {
        orderId: 'ord-1',
        createdAt: '2026-01-15T10:00:00Z',
        currentStatus: 'confirmed',
        minutesRemaining: 45,
        riskType: 'confirmation',
        isBreached: false,
      },
    ],
    breachedCount: 1,
  }

  it('maps a full SLA response to canonical shape', () => {
    const result = normalizeSlaMetricsResponse(fullRaw)
    expect(result.confirmationSlaHours).toBe(2)
    expect(result.confirmationCompliancePercent).toBe(95.5)
    expect(result.pendingOrdersCount).toBe(10)
    expect(result.atRiskOrders).toHaveLength(1)
    expect(result.atRiskOrders[0].orderId).toBe('ord-1')
    expect(result.atRiskOrders[0].isBreached).toBe(false)
    expect(result.breachedCount).toBe(1)
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeSlaMetricsResponse(null)
    expect(result.confirmationSlaHours).toBe(0)
    expect(result.completionSlaHours).toBe(0)
    expect(result.atRiskOrders).toEqual([])
    expect(result.breachedCount).toBe(0)
  })

  it('handles empty atRiskOrders array', () => {
    const result = normalizeSlaMetricsResponse({ atRiskOrders: [] })
    expect(result.atRiskOrders).toEqual([])
  })

  it('handles non-array atRiskOrders as empty', () => {
    const result = normalizeSlaMetricsResponse({ atRiskOrders: 'bad' })
    expect(result.atRiskOrders).toEqual([])
  })

  it('defaults riskType to confirmation for unrecognized values', () => {
    const result = normalizeSlaMetricsResponse({ atRiskOrders: [{ riskType: 'invalid' }] })
    expect(result.atRiskOrders[0].riskType).toBe('confirmation')
  })
})

// ---------------------------------------------------------------------------
// normalizeVolumeMetricsResponse
// ---------------------------------------------------------------------------

describe('normalizeVolumeMetricsResponse', () => {
  const fullRaw = {
    hourlyTrend: [{ hour: 10, count: 50 }],
    dailyTrend: [{ date: '2026-01-15', count: 200 }],
    peakHours: [10, 14, 18],
    cancellationRate: 5.2,
    b2bPercentage: 12.0,
    totalOrders: 3000,
    statusBreakdown: [{ status: 'complete', count: 2400, percentage: 80.0 }],
    period: { from: '2026-01-01', to: '2026-01-31' },
  }

  it('maps a full volume response to canonical shape', () => {
    const result = normalizeVolumeMetricsResponse(fullRaw)
    expect(result.totalOrders).toBe(3000)
    expect(result.cancellationRate).toBe(5.2)
    expect(result.hourlyTrend).toHaveLength(1)
    expect(result.hourlyTrend[0].hour).toBe(10)
    expect(result.dailyTrend).toHaveLength(1)
    expect(result.peakHours).toEqual([10, 14, 18])
    expect(result.statusBreakdown).toHaveLength(1)
    expect(result.period.from).toBe('2026-01-01')
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeVolumeMetricsResponse(null)
    expect(result.hourlyTrend).toEqual([])
    expect(result.dailyTrend).toEqual([])
    expect(result.peakHours).toEqual([])
    expect(result.totalOrders).toBe(0)
    expect(result.cancellationRate).toBe(0)
    expect(result.statusBreakdown).toEqual([])
    expect(result.period).toEqual({ from: '', to: '' })
  })

  it('handles empty arrays', () => {
    const result = normalizeVolumeMetricsResponse({
      hourlyTrend: [],
      dailyTrend: [],
      peakHours: [],
      statusBreakdown: [],
    })
    expect(result.hourlyTrend).toEqual([])
    expect(result.dailyTrend).toEqual([])
    expect(result.peakHours).toEqual([])
    expect(result.statusBreakdown).toEqual([])
  })

  it('handles null cancellationRate (AP#8 — ratio field)', () => {
    const result = normalizeVolumeMetricsResponse({ cancellationRate: null })
    expect(result.cancellationRate).toBe(0)
  })
})
