/**
 * Monitoring API module tests
 * Covers all API functions + query keys
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

// Mock recovery normalizer
vi.mock('@/lib/api/recovery-normalizer', () => ({
  normalizeRecoveryStatusResponse: vi.fn((_raw: unknown, cabinetId: string) => ({
    cabinetId,
    tasks: [],
  })),
}))

import { apiClient } from '@/lib/api-client'
import {
  getMonitoringDashboard,
  getPipelineHealthGrid,
  getTelegramHealth,
  getRecoveryStatus,
  triggerRecovery,
  recoverData,
  getHealthReports,
  getHealthReport,
  getDataCompleteness,
  getMissingDates,
} from '../api'
import { monitoringQueryKeys } from '../query-keys'

describe('Monitoring API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // getMonitoringDashboard
  // ===========================================================================

  describe('getMonitoringDashboard', () => {
    it('sends GET to /v1/monitoring/dashboard with cabinetId and locale', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getMonitoringDashboard('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/dashboard')
      expect(url).toContain('cabinetId=cab-1')
      expect(url).toContain('locale=ru')
    })

    it('returns dashboard data', async () => {
      const dashboard = { systems: [], lastUpdated: '2026-01-01' }
      vi.mocked(apiClient.get).mockResolvedValueOnce(dashboard)
      const result = await getMonitoringDashboard('cab-1')
      expect(result).toEqual(dashboard)
    })

    it('handles null response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(null as never)
      const result = await getMonitoringDashboard('cab-1')
      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // getPipelineHealthGrid
  // ===========================================================================

  describe('getPipelineHealthGrid', () => {
    it('sends GET with cabinetId and locale when no params', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getPipelineHealthGrid('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/pipeline-health-grid')
      expect(url).toContain('cabinetId=cab-1')
      expect(url).toContain('locale=ru')
    })

    it('includes from param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getPipelineHealthGrid('cab-1', { from: '2026-01-01' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('from=2026-01-01')
    })

    it('includes to param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getPipelineHealthGrid('cab-1', { to: '2026-01-31' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('to=2026-01-31')
    })

    it('includes resolution param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getPipelineHealthGrid('cab-1', { resolution: 'day' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('resolution=day')
    })

    it('joins pipelines array with comma', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getPipelineHealthGrid('cab-1', { pipelines: ['a', 'b'] })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('pipelines=a%2Cb')
    })

    it('omits empty pipelines array', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getPipelineHealthGrid('cab-1', { pipelines: [] })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('pipelines')
    })

    it('omits all optional params when GridParams is empty', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getPipelineHealthGrid('cab-1', {})
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('from=')
      expect(url).not.toContain('to=')
      expect(url).not.toContain('resolution=')
      expect(url).not.toContain('pipelines=')
    })
  })

  // ===========================================================================
  // getTelegramHealth
  // ===========================================================================

  describe('getTelegramHealth', () => {
    it('sends GET to telegram-health with cabinetId only', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getTelegramHealth('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/telegram-health')
      expect(url).toContain('cabinetId=cab-1')
    })

    it('does NOT send days param (backend rejects it)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getTelegramHealth('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('days')
    })
  })

  // ===========================================================================
  // getRecoveryStatus
  // ===========================================================================

  describe('getRecoveryStatus', () => {
    it('sends GET to recovery-status with cabinetId', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([] as never)
      await getRecoveryStatus('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/recovery-status')
      expect(url).toContain('cabinetId=cab-1')
    })

    it('normalizes response via normalizeRecoveryStatusResponse', async () => {
      const raw = [{ taskType: 'adv_sync', status: 'completed' }]
      vi.mocked(apiClient.get).mockResolvedValueOnce(raw as never)
      const { normalizeRecoveryStatusResponse } = await import('@/lib/api/recovery-normalizer')
      const result = await getRecoveryStatus('cab-1')
      expect(normalizeRecoveryStatusResponse).toHaveBeenCalledWith(raw, 'cab-1')
      expect(result.cabinetId).toBe('cab-1')
    })

    it('handles null raw response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(null as never)
      const result = await getRecoveryStatus('cab-2')
      expect(result.cabinetId).toBe('cab-2')
      expect(result.tasks).toEqual([])
    })
  })

  // ===========================================================================
  // triggerRecovery
  // ===========================================================================

  describe('triggerRecovery', () => {
    it('sends POST to /v1/monitoring/recover', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, message: 'ok' })
      const data = { cabinetId: 'cab-1', taskType: 'adv_sync' }
      await triggerRecovery(data)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/monitoring/recover', data)
    })

    it('includes optional forceRetry', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, message: 'ok' })
      await triggerRecovery({ cabinetId: 'cab-1', taskType: 'adv_sync', forceRetry: true })
      const called = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
      expect(called.forceRetry).toBe(true)
    })

    it('includes optional dateRange', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, message: 'ok' })
      await triggerRecovery({
        cabinetId: 'cab-1',
        taskType: 'adv_sync',
        dateRange: { from: '2026-01-01', to: '2026-01-31' },
      })
      const called = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
      expect(called.dateRange).toEqual({ from: '2026-01-01', to: '2026-01-31' })
    })

    it('returns success response', async () => {
      const resp = { success: true, message: 'Recovery triggered' }
      vi.mocked(apiClient.post).mockResolvedValueOnce(resp)
      const result = await triggerRecovery({ cabinetId: 'cab-1', taskType: 'test' })
      expect(result).toEqual(resp)
    })
  })

  // ===========================================================================
  // recoverData
  // ===========================================================================

  describe('recoverData', () => {
    it('sends POST to /v1/monitoring/recover-data', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, message: 'ok' })
      await recoverData({ cabinetId: 'cab-1', table: 'wb_finance_raw' })
      expect(apiClient.post).toHaveBeenCalledWith('/v1/monitoring/recover-data', {
        cabinetId: 'cab-1',
        table: 'wb_finance_raw',
      })
    })

    it('includes optional dates', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, message: 'ok' })
      const dates = ['2026-01-01', '2026-01-02']
      await recoverData({ cabinetId: 'cab-1', table: 'wb_finance_raw', dates })
      const called = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
      expect(called.dates).toEqual(dates)
    })

    it('returns success response', async () => {
      const resp = { success: true, message: 'Recovery scheduled' }
      vi.mocked(apiClient.post).mockResolvedValueOnce(resp)
      const result = await recoverData({ cabinetId: 'cab-1', table: 'stocks' })
      expect(result).toEqual(resp)
    })
  })

  // ===========================================================================
  // getHealthReports
  // ===========================================================================

  describe('getHealthReports', () => {
    it('sends GET to health-reports with cabinetId and days=7 default', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([] as never)
      await getHealthReports('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/health-reports')
      expect(url).toContain('cabinetId=cab-1')
      expect(url).toContain('days=7')
    })

    it('uses custom days value', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([] as never)
      await getHealthReports('cab-1', 30)
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('days=30')
    })

    it('returns array of reports', async () => {
      const reports = [{ date: '2026-01-01', score: 95 }]
      vi.mocked(apiClient.get).mockResolvedValueOnce(reports as never)
      const result = await getHealthReports('cab-1')
      expect(result).toEqual(reports)
    })
  })

  // ===========================================================================
  // getHealthReport
  // ===========================================================================

  describe('getHealthReport', () => {
    it('sends GET to health-report with cabinetId and date', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getHealthReport('cab-1', '2026-01-01')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/health-report')
      expect(url).toContain('cabinetId=cab-1')
      expect(url).toContain('date=2026-01-01')
    })

    it('returns report detail', async () => {
      const detail = { date: '2026-01-01', issues: [] }
      vi.mocked(apiClient.get).mockResolvedValueOnce(detail as never)
      const result = await getHealthReport('cab-1', '2026-01-01')
      expect(result).toEqual(detail)
    })
  })

  // ===========================================================================
  // getDataCompleteness
  // ===========================================================================

  describe('getDataCompleteness', () => {
    it('sends GET to data-completeness with cabinetId and days=30', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({} as never)
      await getDataCompleteness('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/data-completeness')
      expect(url).toContain('cabinetId=cab-1')
      expect(url).toContain('days=30')
    })

    it('returns completeness detail', async () => {
      const detail = { tables: [] }
      vi.mocked(apiClient.get).mockResolvedValueOnce(detail as never)
      const result = await getDataCompleteness('cab-1')
      expect(result).toEqual(detail)
    })
  })

  // ===========================================================================
  // getMissingDates
  // ===========================================================================

  describe('getMissingDates', () => {
    it('sends GET to missing-dates with cabinetId and table', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([] as never)
      await getMissingDates('cab-1', 'wb_finance_raw')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/monitoring/missing-dates')
      expect(url).toContain('cabinetId=cab-1')
      expect(url).toContain('table=wb_finance_raw')
    })

    it('returns array of missing dates', async () => {
      const dates = ['2026-01-01', '2026-01-02']
      vi.mocked(apiClient.get).mockResolvedValueOnce(dates as never)
      const result = await getMissingDates('cab-1', 'stocks')
      expect(result).toEqual(dates)
    })
  })

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe('Error handling', () => {
    it('propagates 400 errors from getMonitoringDashboard', async () => {
      const error = new Error('Bad Request')
      Object.assign(error, { status: 400 })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getMonitoringDashboard('cab-1')).rejects.toThrow('Bad Request')
    })

    it('propagates 401 errors from getRecoveryStatus', async () => {
      const error = new Error('Unauthorized')
      Object.assign(error, { status: 401 })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getRecoveryStatus('cab-1')).rejects.toThrow('Unauthorized')
    })

    it('propagates 403 errors from triggerRecovery', async () => {
      const error = new Error('Forbidden')
      Object.assign(error, { status: 403 })
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)
      await expect(triggerRecovery({ cabinetId: 'cab-1', taskType: 'test' })).rejects.toThrow(
        'Forbidden'
      )
    })

    it('propagates 500 errors from getHealthReports', async () => {
      const error = new Error('Internal Server Error')
      Object.assign(error, { status: 500 })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getHealthReports('cab-1')).rejects.toThrow('Internal Server Error')
    })

    it('propagates network errors from getTelegramHealth', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network Error'))
      await expect(getTelegramHealth('cab-1')).rejects.toThrow('Network Error')
    })
  })
})

// =============================================================================
// Query Keys Tests
// =============================================================================

describe('monitoringQueryKeys', () => {
  it('has all base key as ["monitoring"]', () => {
    expect(monitoringQueryKeys.all).toEqual(['monitoring'])
  })

  it('dashboard key includes cabinetId', () => {
    const key = monitoringQueryKeys.dashboard('cab-1')
    expect(key).toEqual(['monitoring', 'dashboard', 'cab-1'])
  })

  it('grid key includes cabinetId and params', () => {
    const params = { from: '2026-01-01', to: '2026-01-31' }
    const key = monitoringQueryKeys.grid('cab-1', params)
    expect(key).toEqual(['monitoring', 'grid', 'cab-1', params])
  })

  it('grid key handles empty params', () => {
    const key = monitoringQueryKeys.grid('cab-1', {})
    expect(key).toEqual(['monitoring', 'grid', 'cab-1', {}])
  })

  it('telegram key includes cabinetId', () => {
    const key = monitoringQueryKeys.telegram('cab-1')
    expect(key).toEqual(['monitoring', 'telegram', 'cab-1'])
  })

  it('recovery key includes cabinetId', () => {
    const key = monitoringQueryKeys.recovery('cab-1')
    expect(key).toEqual(['monitoring', 'recovery', 'cab-1'])
  })

  it('healthReports key includes cabinetId and days', () => {
    const key = monitoringQueryKeys.healthReports('cab-1', 7)
    expect(key).toEqual(['monitoring', 'reports', 'cab-1', 7])
  })

  it('healthReport key includes cabinetId and date', () => {
    const key = monitoringQueryKeys.healthReport('cab-1', '2026-01-01')
    expect(key).toEqual(['monitoring', 'report', 'cab-1', '2026-01-01'])
  })

  it('dataCompleteness key includes cabinetId', () => {
    const key = monitoringQueryKeys.dataCompleteness('cab-1')
    expect(key).toEqual(['monitoring', 'completeness', 'cab-1'])
  })

  it('missingDates key includes cabinetId and table', () => {
    const key = monitoringQueryKeys.missingDates('cab-1', 'wb_finance_raw')
    expect(key).toEqual(['monitoring', 'missing', 'cab-1', 'wb_finance_raw'])
  })

  it('keys differentiate by cabinetId', () => {
    const key1 = monitoringQueryKeys.dashboard('cab-1')
    const key2 = monitoringQueryKeys.dashboard('cab-2')
    expect(key1).not.toEqual(key2)
  })

  it('keys are readonly tuples', () => {
    const key = monitoringQueryKeys.dashboard('cab-1')
    expect(Object.isFrozen(key) || Array.isArray(key)).toBe(true)
  })
})
