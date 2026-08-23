/**
 * Boundary Normalizer Tests — Monitoring domain (dashboard, grid, health-reports)
 *
 * Covers: dashboard, pipeline-health-grid, health-reports, health-report normalizers
 * for null input, missing fields, empty arrays.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeMonitoringDashboardResponse,
  normalizeHealthReportsResponse,
  normalizeHealthReportDetailResponse,
} from '../monitoring-normalizer'
import { normalizePipelineHealthGridResponse } from '../monitoring-grid-normalizer'

describe('normalizeMonitoringDashboardResponse', () => {
  it('maps a full dashboard response', () => {
    const raw = {
      cabinetId: 'cab-1',
      generatedAt: '2025-01-01T00:00:00Z',
      system: {
        overallStatus: 'healthy',
        healthScore: 95,
        lastReportDate: '2025-01-01',
        activeAlerts: 2,
      },
      pipelines: [
        {
          pipelineId: 'p1',
          displayName: 'Pipeline 1',
          category: 'daily',
          status: 'healthy',
          lastSuccessAt: '2025-01-01',
          dataLagMinutes: 5,
          dataLagDisplay: 'сегодня 06:00 МСК',
          successRate24h: 99.5,
        },
      ],
      telegram: { status: 'active', deliveryRate7d: 0.98, recentFailures: 1 },
      dataCompleteness: {
        overallHealth: 'healthy',
        tables: [
          {
            table: 'wb_finance_raw',
            displayName: 'Finance',
            completenessRatio: 0.95,
            status: 'complete',
          },
        ],
      },
    }
    const result = normalizeMonitoringDashboardResponse(raw)
    expect(result.cabinetId).toBe('cab-1')
    expect(result.system.healthScore).toBe(95)
    expect(result.pipelines).toHaveLength(1)
    expect(result.pipelines[0].dataLagDisplay).toBe('сегодня 06:00 МСК')
    expect(result.telegram.status).toBe('active')
    expect(result.dataCompleteness.tables).toHaveLength(1)
  })

  it('handles null input', () => {
    const result = normalizeMonitoringDashboardResponse(null)
    expect(result.cabinetId).toBe('')
    expect(result.system.healthScore).toBe(0)
    expect(result.pipelines).toHaveLength(0)
  })

  it('handles missing fields with safe defaults', () => {
    const result = normalizeMonitoringDashboardResponse({})
    expect(result.system.overallStatus).toBe('healthy')
    expect(result.telegram.status).toBe('not_configured')
  })

  it('normalizes missing, null, and non-string lag displays to null', () => {
    const result = normalizeMonitoringDashboardResponse({
      pipelines: [{}, { dataLagDisplay: null }, { dataLagDisplay: 15 }, { dataLagDisplay: '' }],
    })

    expect(result.pipelines[0].dataLagDisplay).toBeNull()
    expect(result.pipelines[1].dataLagDisplay).toBeNull()
    expect(result.pipelines[2].dataLagDisplay).toBeNull()
    expect(result.pipelines[3].dataLagDisplay).toBeNull()
  })
})

describe('normalizePipelineHealthGridResponse', () => {
  it('maps full grid response', () => {
    const raw = {
      cabinetId: 'cab-1',
      generatedAt: '2025-01-01T00:00:00Z',
      period: { from: '2025-01-01', to: '2025-01-07' },
      resolution: 'day',
      pipelines: [
        {
          pipelineId: 'p1',
          displayName: 'P1',
          category: 'daily',
          expectedFrequency: '1h',
          cronExpression: '0 * * * *',
          dataTable: 'orders',
          status: 'healthy',
          healthScore: 90,
          lastSuccessAt: '2025-01-01',
          lastFailureAt: null,
          nextExpectedAt: '2025-01-02',
          dataLagMinutes: 5,
          dataLagDisplay: 'вчера 06:00 МСК',
          successRate: 0.98,
          totalExecutions: 100,
          totalFailures: 2,
          avgDurationMs: 500,
          totalRowsProcessed: 10000,
          errorRate: 0.02,
          tasksWithErrors: 3,
          totalResultErrors: 5,
          cells: [
            {
              periodStart: '2025-01-01T00:00',
              periodEnd: '2025-01-01T01:00',
              status: 'success',
              executionsExpected: 1,
              executionsActual: 1,
              successCount: 1,
              failureCount: 0,
              cancelledCount: 0,
              avgDurationMs: 500,
              maxDurationMs: 600,
              totalRowsProcessed: 100,
              errors: [],
            },
          ],
        },
      ],
      summary: {
        overallStatus: 'healthy',
        healthScore: 95,
        totalPipelines: 1,
        healthyPipelines: 1,
        degradedPipelines: 0,
        criticalPipelines: 0,
        totalExecutions: 100,
        totalFailures: 2,
        successRate: 0.98,
      },
    }
    const result = normalizePipelineHealthGridResponse(raw)
    expect(result.cabinetId).toBe('cab-1')
    expect(result.pipelines).toHaveLength(1)
    expect(result.pipelines[0].dataLagDisplay).toBe('вчера 06:00 МСК')
    expect(result.pipelines[0].cells).toHaveLength(1)
    expect(result.summary.totalPipelines).toBe(1)
  })

  it('handles null input', () => {
    const result = normalizePipelineHealthGridResponse(null)
    expect(result.pipelines).toHaveLength(0)
    expect(result.summary.totalPipelines).toBe(0)
  })
})

describe('normalizeHealthReportsResponse', () => {
  it('maps full reports array', () => {
    const raw = [
      { date: '2025-01-01', status: 'healthy', issues: 0 },
      { date: '2025-01-02', status: 'degraded', issues: 3 },
    ]
    const result = normalizeHealthReportsResponse(raw)
    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2025-01-01')
    expect(result[1].issues).toBe(3)
  })

  it('returns empty array for null', () => {
    expect(normalizeHealthReportsResponse(null)).toHaveLength(0)
    expect(normalizeHealthReportsResponse(undefined)).toHaveLength(0)
  })

  it('coerces missing status to healthy', () => {
    const result = normalizeHealthReportsResponse([{ date: '2025-01-01' }])
    expect(result[0].status).toBe('healthy')
  })
})

describe('normalizeHealthReportDetailResponse', () => {
  it('maps full detail response', () => {
    const raw = {
      cabinetId: 'cab-1',
      reportDate: '2025-01-01',
      generatedAt: '2025-01-01T00:00:00Z',
      summary: {
        overallStatus: 'healthy',
        tasksExecuted: 10,
        tasksFailed: 1,
        tasksPending: 0,
        dataCompletenessAvg: 0.95,
      },
      taskExecution: { success: [{ id: 1 }], failed: [], notRun: [] },
      dataCompleteness: { finance: { ratio: 0.95, status: 'complete', missingCount: 0 } },
      issues: [{ severity: 'warning', category: 'storage', description: 'Slow sync' }],
      recommendations: ['Check storage pipeline'],
    }
    const result = normalizeHealthReportDetailResponse(raw)
    expect(result.cabinetId).toBe('cab-1')
    expect(result.summary.tasksExecuted).toBe(10)
    expect(result.taskExecution.success).toHaveLength(1)
    expect(result.issues).toHaveLength(1)
    expect(result.recommendations).toEqual(['Check storage pipeline'])
    expect(result.dataCompleteness.finance.ratio).toBe(0.95)
  })

  it('handles null input', () => {
    const result = normalizeHealthReportDetailResponse(null)
    expect(result.cabinetId).toBe('')
    expect(result.issues).toHaveLength(0)
    expect(result.taskExecution.success).toHaveLength(0)
  })
})
