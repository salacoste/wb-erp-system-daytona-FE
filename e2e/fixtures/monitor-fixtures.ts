/**
 * E2E Fixtures: Monitor Dashboard
 * Epic 92-FE Story 92.6: Empty-state + error-state mock helpers.
 *
 * page.route mock body format depends on whether each endpoint uses skipDataUnwrap:
 *   - monitor-summary    → NO  skipDataUnwrap → mock body: { data: <shape> }
 *   - daily/finance      → NO  skipDataUnwrap → mock body: { data: <array> }
 *   - daily/advertising  → NO  skipDataUnwrap → mock body: { data: <array> }
 *   - orders/trends      → YES skipDataUnwrap → mock body: { trends: [] }       (raw shape)
 *   - orders/volume?...  → YES skipDataUnwrap → mock body: { by_day_with_cogs: [] } (raw shape)
 *   - pipeline-health-grid → NO skipDataUnwrap → mock body: { data: <shape> }
 *
 * Convention: E2E fixtures inline types to decouple from src/ refactors.
 * Production types remain the source of truth — keep in sync on contract changes.
 *
 * Shared empty-factory logic lives in src/test/fixtures/monitor-empty.ts.
 * This file wraps those factories with page.route intercept helpers.
 */

import type { Page } from '@playwright/test'
import type { PipelineHealthGrid } from '@/app/(dashboard)/monitoring/types/monitoring-grid'
import type { MonitorSummaryResponse } from '@/app/(dashboard)/monitor/types/monitor-summary'

// ---------------------------------------------------------------------------
// Factories (typed via production imports — @/ alias is available in e2e/ tsconfig)
// ---------------------------------------------------------------------------

/** Empty monitor summary: counts=0, money/ratios=null (CLAUDE.md anti-pattern #8). */
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
 * Empty pipeline health grid — pipelines: [] — triggers the "Все пайплайны работают
 * исправно" branch in MonitorPipelineHealth (unhealthy.length === 0).
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

// ---------------------------------------------------------------------------
// Helper: mock the 4 daily endpoints at once (H-1 fix — all 4 parallel requests)
// ---------------------------------------------------------------------------

/**
 * Mocks all 4 daily endpoints consumed by useDailyMetrics → getAllDailyData.
 * Correct body format per skipDataUnwrap (H-2 fix):
 *   - orders/trends      → raw { trends: [] }
 *   - daily/finance      → wrapped { data: [] }
 *   - daily/advertising  → wrapped { data: [] }
 *   - orders/volume      → raw { by_day_with_cogs: [] }
 * Result: empty DailyMetrics[] → chartData.length === 0 → "Нет данных за последние 7 дней".
 */
export async function mockEmptyDailyMetrics(page: Page): Promise<void> {
  // orders/trends — skipDataUnwrap: true → raw shape
  await page.route('**/v1/analytics/orders/trends**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ trends: [], summary: {}, dataSource: {}, period: {} }),
    })
  )
  // daily/finance — NO skipDataUnwrap → { data: [...] }
  await page.route('**/v1/analytics/daily/finance**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    })
  )
  // daily/advertising — NO skipDataUnwrap → { data: [...] }
  await page.route('**/v1/analytics/daily/advertising**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    })
  )
  // orders/volume?include_cogs=true — skipDataUnwrap: true → raw shape
  await page.route('**/v1/analytics/orders/volume**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ by_day_with_cogs: [] }),
    })
  )
}

// ---------------------------------------------------------------------------
// Helper: mock all 3 primary monitor endpoints at once (combined empty-state scenario)
// ---------------------------------------------------------------------------

/**
 * Registers page.route intercepts for the 3 primary monitor endpoints (summary,
 * pipeline-health-grid) AND all 4 daily endpoints, returning empty but
 * structurally-valid responses. Use per-test when you want the full all-empty
 * scenario; mock endpoints individually to isolate specific branches.
 */
export async function mockAllEmpty(page: Page): Promise<void> {
  await page.route('**/v1/analytics/monitor/summary**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: emptyMonitorSummary() }),
    })
  )
  await page.route('**/v1/monitoring/pipeline-health-grid**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: emptyPipelineGrid() }),
    })
  )
  await mockEmptyDailyMetrics(page)
}
