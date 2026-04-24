/**
 * Shared empty-fixture factories for Monitor Dashboard tests.
 * Used by both unit tests (src/app/.../monitor/) and E2E helpers (e2e/fixtures/).
 *
 * Convention: money/ratio fields use null per CLAUDE.md anti-pattern #8
 * (null = unknown, 0 = known zero — never collapse them).
 * Count fields use 0 (legitimate zero).
 */

import type { MonitorSummaryResponse } from '@/app/(dashboard)/monitor/types/monitor-summary'
import type { PipelineHealthGrid } from '@/app/(dashboard)/monitoring/types/monitoring-grid'
import type { DailyMetrics } from '@/types/daily-metrics'

/** Empty monitor summary: counts=0, money/ratios=null. */
export function emptyMonitorSummary(): MonitorSummaryResponse {
  const emptyPeriod = {
    salesCount: 0,
    returnsCount: 0,
    revenue: null,
    cogs: null,
    expenses: null,
    advertisingSpend: null,
    margin: null,
  }
  return {
    periods: {
      today: emptyPeriod,
      yesterday: emptyPeriod,
      last30Days: emptyPeriod,
      prev30Days: emptyPeriod,
    },
    kpi: {
      totalProducts: 0,
      productsWithCogs: 0,
      cogsCoveragePercent: null,
      buyoutRatePercent: null,
      lastSyncAt: null,
    },
    generatedAt: null,
  }
}

/**
 * Empty pipeline health grid — pipelines: [] — triggers the "all healthy" empty-state
 * (unhealthy.length === 0) in MonitorPipelineHealth.
 */
export function emptyPipelineGrid(): PipelineHealthGrid {
  return {
    cabinetId: 'test-cabinet',
    period: { from: '2026-04-23T00:00:00Z', to: '2026-04-24T00:00:00Z' },
    resolution: 'day',
    generatedAt: '2026-04-24T10:00:00Z',
    summary: {
      overallStatus: 'healthy',
      healthScore: 0,
      totalPipelines: 0,
      healthyPipelines: 0,
      degradedPipelines: 0,
      criticalPipelines: 0,
      totalExecutions: 0,
      totalFailures: 0,
      successRate: 0,
    },
    pipelines: [],
  }
}

/** Empty daily metrics array — triggers MonitorWeeklyChart "Нет данных" empty-state. */
export function emptyDailyMetrics(): DailyMetrics[] {
  return []
}
