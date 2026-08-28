/**
 * Tests for monitor-pipeline-utils
 * Epic 92-FE Story 92.5: AC-6 utility unit tests.
 *
 * Tests getBuyoutColor (4 sub-assertions) and getMostRecentRecalc (2 sub-assertions).
 * M-9 review fix: added formatRelativeTime unit tests with vi.setSystemTime.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GridPipeline } from '@/app/(dashboard)/monitoring/types/monitoring'
import {
  getBuyoutColor,
  getMostRecentRecalc,
  getUnhealthyPipelines,
  formatRelativeTime,
} from '../monitor-pipeline-utils'

// ---------------------------------------------------------------------------
// getBuyoutColor
// ---------------------------------------------------------------------------

describe('getBuyoutColor', () => {
  it('returns gray band for null (no data)', () => {
    const result = getBuyoutColor(null)
    expect(result.color).toBe('var(--color-muted-foreground)')
    expect(result.textClass).toBe('text-muted-foreground')
    expect(result.bandLabel).toBe('Нет данных')
  })

  it('returns green band for rate >= 90 (excellent)', () => {
    const result = getBuyoutColor(95)
    expect(result.color).toBe('var(--color-chart-positive)')
    expect(result.textClass).toBe('text-status-success')
    expect(result.bandLabel).toBe('Отличный')
  })

  it('returns amber band for rate in 70-89 range (warning)', () => {
    const result = getBuyoutColor(80)
    expect(result.color).toBe('var(--color-status-warning)')
    expect(result.textClass).toBe('text-status-warning')
    expect(result.bandLabel).toBe('Требует внимания')
  })

  it('returns red band for rate < 70 (poor)', () => {
    const result = getBuyoutColor(50)
    expect(result.color).toBe('var(--color-chart-negative)')
    expect(result.textClass).toBe('text-status-error')
    expect(result.bandLabel).toBe('Низкий')
  })

  it('boundary: exactly 90 returns green', () => {
    expect(getBuyoutColor(90).bandLabel).toBe('Отличный')
  })

  it('boundary: exactly 70 returns amber', () => {
    expect(getBuyoutColor(70).bandLabel).toBe('Требует внимания')
  })

  it('boundary: exactly 69 returns red', () => {
    expect(getBuyoutColor(69).bandLabel).toBe('Низкий')
  })
})

// ---------------------------------------------------------------------------
// getMostRecentRecalc
// ---------------------------------------------------------------------------

function makePipeline(overrides: Partial<GridPipeline>): GridPipeline {
  return {
    pipelineId: 'test-pipe',
    displayName: 'Test Pipeline',
    category: 'daily',
    expectedFrequency: '1d',
    cronExpression: '0 0 * * *',
    dataTable: 'test',
    status: 'healthy',
    healthScore: 90,
    lastSuccessAt: null,
    lastFailureAt: null,
    nextExpectedAt: null,
    dataLagMinutes: null,
    dataLagDisplay: null,
    successRate: 1,
    totalExecutions: 10,
    totalFailures: 0,
    avgDurationMs: null,
    totalRowsProcessed: null,
    errorRate: 0,
    tasksWithErrors: 0,
    totalResultErrors: 0,
    cells: [],
    ...overrides,
  }
}

describe('getMostRecentRecalc', () => {
  it('returns the pipeline with the maximum lastSuccessAt', () => {
    const older = makePipeline({
      pipelineId: 'old',
      displayName: 'Старый',
      lastSuccessAt: '2026-04-23T08:00:00Z',
    })
    const newer = makePipeline({
      pipelineId: 'new',
      displayName: 'Новый',
      lastSuccessAt: '2026-04-24T09:45:00Z',
      dataLagDisplay: 'сегодня 12:45 МСК',
    })

    const result = getMostRecentRecalc([older, newer])
    expect(result).not.toBeNull()
    expect(result!.displayName).toBe('Новый')
    expect(result!.lastSuccessAt).toBe('2026-04-24T09:45:00Z')
    expect(result!.dataLagDisplay).toBe('сегодня 12:45 МСК')
  })

  it('returns null when all pipelines have lastSuccessAt: null', () => {
    const p1 = makePipeline({ pipelineId: 'p1', lastSuccessAt: null })
    const p2 = makePipeline({ pipelineId: 'p2', lastSuccessAt: null })

    expect(getMostRecentRecalc([p1, p2])).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(getMostRecentRecalc([])).toBeNull()
  })

  it('ignores null entries and returns the non-null one', () => {
    const withNull = makePipeline({ pipelineId: 'null-one', lastSuccessAt: null })
    const withDate = makePipeline({
      pipelineId: 'dated',
      displayName: 'С датой',
      lastSuccessAt: '2026-04-22T12:00:00Z',
    })

    const result = getMostRecentRecalc([withNull, withDate])
    expect(result!.displayName).toBe('С датой')
  })
})

// ---------------------------------------------------------------------------
// getUnhealthyPipelines
// ---------------------------------------------------------------------------

describe('getUnhealthyPipelines', () => {
  it('filters out healthy pipelines and preserves order of unhealthy ones', () => {
    const h = makePipeline({ pipelineId: 'h', status: 'healthy' })
    const w = makePipeline({ pipelineId: 'w', status: 'warning' })
    const c = makePipeline({ pipelineId: 'c', status: 'critical' })

    const result = getUnhealthyPipelines([h, w, c])
    expect(result).toHaveLength(2)
    expect(result[0].pipelineId).toBe('w')
    expect(result[1].pipelineId).toBe('c')
  })

  it('returns empty array when all pipelines are healthy', () => {
    const all = [
      makePipeline({ pipelineId: 'a', status: 'healthy' }),
      makePipeline({ pipelineId: 'b', status: 'healthy' }),
    ]
    expect(getUnhealthyPipelines(all)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// formatRelativeTime — M-9 review fix: stable outputs with pinned system time
// ---------------------------------------------------------------------------

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-04-24T10:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "—" for null input', () => {
    expect(formatRelativeTime(null)).toBe('—')
  })

  it('returns "только что" for 30 seconds ago', () => {
    const thirtySecondsAgo = new Date(NOW.getTime() - 30_000).toISOString()
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('только что')
  })

  it('returns "5 мин назад" for 5 minutes ago', () => {
    const fiveMinAgo = new Date(NOW.getTime() - 5 * 60_000).toISOString()
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 мин назад')
  })

  it('returns "2 ч назад" for 2 hours ago', () => {
    const twoHoursAgo = new Date(NOW.getTime() - 2 * 60 * 60_000).toISOString()
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 ч назад')
  })

  it('returns "3 дн назад" for 3 days ago', () => {
    const threeDaysAgo = new Date(NOW.getTime() - 3 * 24 * 60 * 60_000).toISOString()
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 дн назад')
  })
})
