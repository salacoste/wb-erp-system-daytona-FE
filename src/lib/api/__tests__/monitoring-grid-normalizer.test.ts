/**
 * Monitoring Pipeline Health Grid Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import { normalizePipelineHealthGridResponse } from '../monitoring-grid-normalizer'

describe('normalizePipelineHealthGridResponse', () => {
  it('normalizes a fully-populated response', () => {
    const raw = {
      cabinetId: 'cab-1',
      generatedAt: '2026-01-15T12:00:00Z',
      period: { from: '2026-01-01', to: '2026-01-15' },
      resolution: 'day',
      summary: {
        overallStatus: 'healthy',
        healthScore: 95,
        totalPipelines: 10,
        healthyPipelines: 9,
        degradedPipelines: 1,
        criticalPipelines: 0,
        totalExecutions: 200,
        totalFailures: 5,
        successRate: 97.5,
      },
      pipelines: [
        {
          pipelineId: 'pipe-1',
          displayName: 'Daily Import',
          category: 'daily',
          expectedFrequency: 'daily',
          cronExpression: '0 6 * * *',
          dataTable: 'wb_finance_raw',
          status: 'healthy',
          healthScore: 100,
          lastSuccessAt: '2026-01-15T06:00:00Z',
          lastFailureAt: null,
          nextExpectedAt: '2026-01-16T06:00:00Z',
          dataLagMinutes: 5,
          successRate: 100,
          totalExecutions: 15,
          totalFailures: 0,
          avgDurationMs: 30000,
          totalRowsProcessed: 5000,
          errorRate: 0,
          tasksWithErrors: 0,
          totalResultErrors: 0,
          cells: [
            {
              periodStart: '2026-01-15',
              periodEnd: '2026-01-15',
              status: 'success',
              executionsExpected: 1,
              executionsActual: 1,
              successCount: 1,
              failureCount: 0,
              cancelledCount: 0,
              avgDurationMs: 28000,
              maxDurationMs: 35000,
              totalRowsProcessed: 350,
              errors: [],
            },
          ],
        },
      ],
    }
    const result = normalizePipelineHealthGridResponse(raw)
    expect(result.cabinetId).toBe('cab-1')
    expect(result.generatedAt).toBe('2026-01-15T12:00:00Z')
    expect(result.period.from).toBe('2026-01-01')
    expect(result.period.to).toBe('2026-01-15')
    expect(result.resolution).toBe('day')
    expect(result.summary.overallStatus).toBe('healthy')
    expect(result.summary.healthScore).toBe(95)
    expect(result.summary.totalPipelines).toBe(10)
    expect(result.summary.successRate).toBe(97.5)
    expect(result.pipelines).toHaveLength(1)
    expect(result.pipelines[0].pipelineId).toBe('pipe-1')
    expect(result.pipelines[0].healthScore).toBe(100)
    expect(result.pipelines[0].cells).toHaveLength(1)
    expect(result.pipelines[0].cells[0].status).toBe('success')
    expect(result.pipelines[0].cells[0].avgDurationMs).toBe(28000)
  })

  it('defaults status fields when missing', () => {
    const raw = {
      period: {},
      summary: {},
      pipelines: [{ cells: [{ errors: [] }] }],
    }
    const result = normalizePipelineHealthGridResponse(raw)
    expect(result.resolution).toBe('day')
    expect(result.summary.overallStatus).toBe('healthy')
    expect(result.pipelines[0].status).toBe('no_data')
    expect(result.pipelines[0].category).toBe('daily')
    expect(result.pipelines[0].cells[0].status).toBe('no_data')
  })

  it('defaults pipelines to empty array when missing', () => {
    const result = normalizePipelineHealthGridResponse({ period: {} })
    expect(result.pipelines).toEqual([])
  })

  it('defaults cells to empty array when missing', () => {
    const raw = { period: {}, pipelines: [{}] }
    const result = normalizePipelineHealthGridResponse(raw)
    expect(result.pipelines[0].cells).toEqual([])
  })

  it('preserves null for nullable number fields', () => {
    const raw = {
      period: {},
      pipelines: [
        {
          dataLagMinutes: null,
          avgDurationMs: null,
          totalRowsProcessed: null,
          cells: [
            {
              avgDurationMs: null,
              maxDurationMs: null,
              totalRowsProcessed: null,
              errors: [],
            },
          ],
        },
      ],
    }
    const result = normalizePipelineHealthGridResponse(raw)
    expect(result.pipelines[0].dataLagMinutes).toBeNull()
    expect(result.pipelines[0].avgDurationMs).toBeNull()
    expect(result.pipelines[0].cells[0].avgDurationMs).toBeNull()
  })

  it('defaults successRate and errorRate to 0 when null', () => {
    const raw = {
      period: {},
      pipelines: [{ successRate: null, errorRate: null }],
    }
    const result = normalizePipelineHealthGridResponse(raw)
    expect(result.pipelines[0].successRate).toBe(0)
    expect(result.pipelines[0].errorRate).toBe(0)
  })

  it('normalizes heatmap cell errors', () => {
    const raw = {
      period: {},
      pipelines: [
        {
          cells: [
            {
              errors: [
                {
                  timestamp: '2026-01-15T06:00:00Z',
                  taskUuid: 'uuid-1',
                  errorMessage: 'Timeout',
                  retryAttempt: 1,
                  wasRecovered: true,
                },
              ],
            },
          ],
        },
      ],
    }
    const result = normalizePipelineHealthGridResponse(raw)
    const error = result.pipelines[0].cells[0].errors[0]
    expect(error.timestamp).toBe('2026-01-15T06:00:00Z')
    expect(error.taskUuid).toBe('uuid-1')
    expect(error.errorMessage).toBe('Timeout')
    expect(error.retryAttempt).toBe(1)
    expect(error.wasRecovered).toBe(true)
  })

  it('handles null input', () => {
    const result = normalizePipelineHealthGridResponse(null)
    expect(result.cabinetId).toBe('')
    expect(result.pipelines).toEqual([])
    expect(result.summary.overallStatus).toBe('healthy')
  })
})
