/**
 * TDD Tests for Orders Analytics API Client
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests: getVelocityMetrics, getSlaMetrics, getVolumeMetrics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '../../api-client'
import { getVelocityMetrics, getSlaMetrics, getVolumeMetrics } from '../orders-analytics'

vi.spyOn(console, 'info').mockImplementation(() => {})

// Velocity Metrics Fixture
const mockVelocity = {
  avgConfirmationTimeMinutes: 35.5,
  avgCompletionTimeMinutes: 240.0,
  p50ConfirmationMinutes: 28.0,
  p95ConfirmationMinutes: 90.0,
  p99ConfirmationMinutes: 120.0,
  p50CompletionMinutes: 200.0,
  p95CompletionMinutes: 480.0,
  p99CompletionMinutes: 720.0,
  byWarehouse: { '507': { avgConfirmation: 30, avgCompletion: 180 } },
  byDeliveryType: { fbs: { avgConfirmation: 35, avgCompletion: 200 } },
  totalOrders: 150,
  period: { from: '2026-01-01', to: '2026-01-31' },
}

// SLA Metrics Fixture
const mockSla = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 95.5,
  completionCompliancePercent: 92.3,
  pendingOrdersCount: 12,
  atRiskTotal: 45,
  atRiskOrders: [
    {
      orderId: '123',
      createdAt: '2026-01-04T10:00:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 25,
      riskType: 'confirmation' as const,
      isBreached: false,
    },
    {
      orderId: '456',
      createdAt: '2026-01-03T08:00:00.000Z',
      currentStatus: 'confirm',
      minutesRemaining: -30,
      riskType: 'completion' as const,
      isBreached: true,
    },
  ],
  breachedCount: 2,
}

// Volume Metrics Fixture
const mockVolume = {
  hourlyTrend: [
    { hour: 14, count: 35 },
    { hour: 15, count: 30 },
  ],
  dailyTrend: [{ date: '2026-01-01', count: 120 }],
  peakHours: [14, 15, 10],
  cancellationRate: 3.5,
  b2bPercentage: 12.0,
  totalOrders: 500,
  statusBreakdown: [{ status: 'complete', count: 400, percentage: 80.0 }],
  period: { from: '2026-01-01', to: '2026-01-31' },
}

describe('Orders Analytics API Client', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getVelocityMetrics', () => {
    it('calls API with date params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVelocity)
      await getVelocityMetrics({ from: '2026-01-01', to: '2026-01-31' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/orders/velocity')
      expect(url).toContain('from=2026-01-01')
      expect(url).toContain('to=2026-01-31')
    })

    it('uses skipDataUnwrap option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVelocity)
      await getVelocityMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), { skipDataUnwrap: true })
    })

    it('returns averages and percentiles', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVelocity)
      const result = await getVelocityMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(result.avgConfirmationTimeMinutes).toBe(35.5)
      expect(result.p95ConfirmationMinutes).toBe(90.0)
      expect(result.p99CompletionMinutes).toBe(720.0)
    })

    it('returns warehouse breakdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVelocity)
      const result = await getVelocityMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(result.byWarehouse['507'].avgConfirmation).toBe(30)
    })

    it('returns delivery type breakdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVelocity)
      const result = await getVelocityMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(result.byDeliveryType['fbs'].avgCompletion).toBe(200)
    })
  })

  describe('getSlaMetrics', () => {
    it('calls API with default params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSla)
      await getSlaMetrics({})
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toContain('/v1/analytics/orders/sla')
    })

    it('includes custom SLA thresholds', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSla)
      await getSlaMetrics({ confirmationSlaHours: 3, completionSlaHours: 48 })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('confirmationSlaHours=3')
      expect(url).toContain('completionSlaHours=48')
    })

    it('includes at-risk pagination params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSla)
      await getSlaMetrics({ atRiskLimit: 10, atRiskOffset: 20 })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('atRiskLimit=10')
      expect(url).toContain('atRiskOffset=20')
    })

    it('returns compliance percentages', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSla)
      const result = await getSlaMetrics({})
      expect(result.confirmationCompliancePercent).toBe(95.5)
      expect(result.completionCompliancePercent).toBe(92.3)
    })

    it('returns at-risk orders with riskType', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSla)
      const result = await getSlaMetrics({})
      expect(result.atRiskOrders[0].riskType).toBe('confirmation')
      expect(result.atRiskOrders[1].isBreached).toBe(true)
    })

    it('identifies breached orders (negative minutesRemaining)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSla)
      const result = await getSlaMetrics({})
      const breached = result.atRiskOrders.find(o => o.isBreached)
      expect(breached?.minutesRemaining).toBeLessThan(0)
    })
  })

  describe('getVolumeMetrics', () => {
    it('calls API with date params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVolume)
      await getVolumeMetrics({ from: '2026-01-01', to: '2026-01-31' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/orders/volume')
      expect(url).toContain('from=2026-01-01')
    })

    it('returns hourly and daily trends', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVolume)
      const result = await getVolumeMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(result.hourlyTrend[0].hour).toBe(14)
      expect(result.dailyTrend[0].date).toBe('2026-01-01')
    })

    it('returns peak hours array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVolume)
      const result = await getVolumeMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(result.peakHours).toContain(14)
    })

    it('returns cancellation and B2B percentages', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVolume)
      const result = await getVolumeMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(result.cancellationRate).toBe(3.5)
      expect(result.b2bPercentage).toBe(12.0)
    })

    it('returns status breakdown with percentages', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockVolume)
      const result = await getVolumeMetrics({ from: '2026-01-01', to: '2026-01-31' })
      expect(result.statusBreakdown[0].percentage).toBe(80.0)
    })
  })
})
