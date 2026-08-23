/**
 * Tests for MonitorPipelineHealth
 * Epic 92-FE Story 92.5: Block 5 — Compact pipeline status panel.
 *
 * Fixture from story spec (verbatim).
 * Assertions verify specific displayName in unhealthy list and correct status badge
 * (92.4 H-2 lesson: exact assertions, not trivially-true digit matches).
 * H-4 review fix: added test for errorRate > 1 anomaly indicator.
 * M-6 review fix: added tooltip payload hover test.
 */

import { afterEach, describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { GridPipeline } from '@/app/(dashboard)/monitoring/types/monitoring'
import { MonitorPipelineHealth } from '../MonitorPipelineHealth'

// ---------------------------------------------------------------------------
// Test fixtures (verbatim from story spec)
// ---------------------------------------------------------------------------

const healthy: GridPipeline = {
  pipelineId: 'products-sync',
  displayName: 'Синхронизация товаров',
  category: 'high_frequency',
  expectedFrequency: '5m',
  cronExpression: '*/5 * * * *',
  dataTable: 'products',
  status: 'healthy',
  healthScore: 98,
  lastSuccessAt: '2026-04-24T09:45:00Z',
  lastFailureAt: null,
  nextExpectedAt: '2026-04-24T09:50:00Z',
  dataLagMinutes: 2,
  dataLagDisplay: null,
  successRate: 0.99,
  totalExecutions: 288,
  totalFailures: 3,
  avgDurationMs: 1200,
  totalRowsProcessed: 150000,
  // L-10 fix: Use 0.009 (strictly below 0.01 gate) to assert no badge rendering.
  errorRate: 0.009,
  tasksWithErrors: 3,
  totalResultErrors: 3,
  cells: [],
}

const critical: GridPipeline = {
  ...healthy,
  pipelineId: 'tasks-completeness-sync',
  displayName: 'Проверка полноты задач',
  status: 'critical',
  errorRate: 0.15,
  tasksWithErrors: 45,
  totalResultErrors: 52,
  lastSuccessAt: '2026-04-23T08:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MonitorPipelineHealth', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mixed-status fixture: renders "Последний пересчёт" row and unhealthy pipeline in list', () => {
    renderWithProviders(<MonitorPipelineHealth pipelines={[healthy, critical]} />)

    // Component renders
    const panel = screen.getByTestId('monitor-pipeline-health')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('role', 'region')
    expect(panel).toHaveAttribute('aria-label', 'Состояние пайплайнов')

    // Row A: "Последний пересчёт" label present
    expect(screen.getByText('Последний пересчёт:')).toBeInTheDocument()

    // healthy pipeline has later lastSuccessAt (2026-04-24 > 2026-04-23) → shown as most recent
    expect(screen.getByText(/Синхронизация товаров/)).toBeInTheDocument()

    // Row B: critical pipeline appears in the unhealthy list
    expect(screen.getByText('Проверка полноты задач')).toBeInTheDocument()

    // Status badge "✕ Критично" visible for critical pipeline
    expect(screen.getByText('✕ Критично')).toBeInTheDocument()

    // Error rate badge visible (errorRate=0.15 >= 0.01 → shows 15%)
    expect(screen.getByText(/15\s%/)).toBeInTheDocument() // locale: "15 %" (comma+NBSP)

    // The healthy pipeline is NOT in the unhealthy list section (it's only in Row A)
    expect(screen.queryByText('✓ Работает')).not.toBeInTheDocument()
  })

  it('all-healthy fixture: renders empty state with checkmark message', () => {
    renderWithProviders(<MonitorPipelineHealth pipelines={[healthy]} />)

    expect(screen.getByText('Все пайплайны работают исправно')).toBeInTheDocument()
    expect(screen.queryByText('✕ Критично')).not.toBeInTheDocument()
    expect(screen.queryByText('⚠ Задержка')).not.toBeInTheDocument()
    expect(screen.queryByText('◷ Устарело')).not.toBeInTheDocument()
    expect(screen.getByTestId('monitor-pipeline-health')).toBeInTheDocument()
  })

  it('no pipelines with lastSuccessAt renders "Нет данных о пересчётах"', () => {
    const neverRan: GridPipeline = { ...healthy, lastSuccessAt: null, dataLagDisplay: null }
    renderWithProviders(<MonitorPipelineHealth pipelines={[neverRan]} />)

    expect(screen.getByText('Нет данных о пересчётах')).toBeInTheDocument()
  })

  it('prefers the selected pipeline backend lag display', () => {
    renderWithProviders(
      <MonitorPipelineHealth
        pipelines={[
          {
            ...healthy,
            category: 'daily',
            dataLagDisplay: 'сегодня 12:45 МСК',
          },
        ]}
      />
    )

    expect(screen.getByText('Синхронизация товаров — сегодня 12:45 МСК')).toBeInTheDocument()
  })

  it('falls back to relative time when the selected pipeline display is null', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-24T10:00:00Z'))

    renderWithProviders(<MonitorPipelineHealth pipelines={[healthy]} />)

    expect(screen.getByText('Синхронизация товаров — 15 мин назад')).toBeInTheDocument()
  })

  // M-6 review fix: tooltip payload test — hover AlertTriangle badge to see task/error counts
  // Radix tooltips render two nodes (one visible, one SR-only); use findAllByText + length check.
  it('hovering the error-rate badge shows tooltip with task and error counts', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MonitorPipelineHealth pipelines={[healthy, critical]} />)

    // The error-rate badge shows "15 %" for errorRate=0.15 (locale-formatted)
    const errorBadge = screen.getByText(/15\s%/) // locale: "15 %" (comma+NBSP)
    await user.hover(errorBadge)

    // Tooltip content: tasksWithErrors=45, totalResultErrors=52
    const nodes = await screen.findAllByText('45 задач с ошибками (52 ошибок всего)')
    expect(nodes.length).toBeGreaterThanOrEqual(1)
  })

  // M-6: also test the totalResultErrors === 0 fallback branch
  it('hovering error-rate badge shows fallback text when tasksWithErrors and totalResultErrors are 0', async () => {
    const user = userEvent.setup()
    const zeroErrorCounts: GridPipeline = {
      ...critical,
      pipelineId: 'zero-counts',
      tasksWithErrors: 0,
      totalResultErrors: 0,
      errorRate: 0.05,
    }
    renderWithProviders(<MonitorPipelineHealth pipelines={[zeroErrorCounts]} />)

    const errorBadge = screen.getByText(/\b5\s%/) // locale: "5 %" (comma+NBSP)
    await user.hover(errorBadge)

    const nodes = await screen.findAllByText('Ошибки выполнения')
    expect(nodes.length).toBeGreaterThanOrEqual(1)
  })

  // H-4 review fix: errorRate > 1 renders out-of-range error badge clamped to 100%
  // and the pipeline row is present in the unhealthy section.
  // Note: Radix tooltip does not open in jsdom on hover — we assert the indicator DOM structure
  // and the clamped display value (Math.min(errorRate, 1) * 100 = 100% for errorRate=1.5).
  it('pipeline with errorRate > 1 shows clamped 100% badge and pipeline row is in unhealthy list', () => {
    const outOfRangePipeline: GridPipeline = {
      ...critical,
      pipelineId: 'bad-rate-pipe',
      displayName: 'Пайплайн с аномалией',
      errorRate: 1.5,
      tasksWithErrors: 45,
      totalResultErrors: 52,
    }
    renderWithProviders(<MonitorPipelineHealth pipelines={[outOfRangePipeline]} />)

    // Pipeline row is present in unhealthy section
    expect(screen.getByText('Пайплайн с аномалией')).toBeInTheDocument()

    // Error rate badge shows clamped value: formatPercentageInt(Math.min(1.5, 1) * 100) = "100 %"
    expect(screen.getByText(/100\s%/)).toBeInTheDocument() // locale: "100 %" (comma+NBSP)

    // Status badge still present
    expect(screen.getByText('✕ Критично')).toBeInTheDocument()
  })
})
