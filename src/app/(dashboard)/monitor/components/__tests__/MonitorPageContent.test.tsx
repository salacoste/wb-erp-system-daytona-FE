/**
 * Tests for MonitorPageContent orchestrator
 * Epic 92-FE Story 92.2: KPI Cards + Route Registration
 * H-5 review fix: mocked usePipelineGrid + useDailyMetrics to prevent MSW warnings.
 *
 * Mocks useMonitorSummary directly — avoids auth store + TanStack Query setup.
 * Pattern mirrors Story 90.4's AcquiringPeriodDetailPage.test.tsx.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { UseQueryResult } from '@tanstack/react-query'
import type { MonitorSummaryResponse, MonitorKpi } from '../../types/monitor-summary'
import type { PipelineHealthGrid } from '@/app/(dashboard)/monitoring/types/monitoring'
import type { DailyMetrics } from '@/types/daily-metrics'
import {
  emptyPipelineGrid,
  emptyMonitorSummary,
  emptyDailyMetrics,
} from '@/test/fixtures/monitor-empty'

// Mock hooks before component import (hoisting requirement)
const mockUseMonitorSummary = vi.fn()
vi.mock('../../hooks/use-monitor-summary', () => ({
  useMonitorSummary: (...args: unknown[]) => mockUseMonitorSummary(...args),
}))

// H-5 fix: mock usePipelineGrid to prevent unhandled MSW requests
const mockUsePipelineGrid = vi.fn()
vi.mock('@/app/(dashboard)/monitoring/hooks/use-pipeline-grid', () => ({
  usePipelineGrid: (...args: unknown[]) => mockUsePipelineGrid(...args),
}))

// H-5 fix: mock useDailyMetrics to prevent unhandled MSW requests
const mockUseDailyMetrics = vi.fn()
vi.mock('@/hooks/useDailyMetrics', () => ({
  useDailyMetrics: (...args: unknown[]) => mockUseDailyMetrics(...args),
}))

import { MonitorPageContent } from '../MonitorPageContent'

const baseKpi: MonitorKpi = {
  totalProducts: 150,
  productsWithCogs: 120,
  cogsCoveragePercent: 80.0,
  buyoutRatePercent: 68.5,
  lastSyncAt: '2026-04-24T10:00:00Z',
}

const basePeriodMetrics = {
  salesCount: 0,
  returnsCount: 0,
  revenue: null,
  cogs: null,
  expenses: null,
  advertisingSpend: null,
  margin: null,
}

const baseResponse: MonitorSummaryResponse = {
  kpi: baseKpi,
  periods: {
    today: basePeriodMetrics,
    yesterday: basePeriodMetrics,
    last30Days: basePeriodMetrics,
    prev30Days: basePeriodMetrics,
  },
  generatedAt: '2026-04-24T10:00:00Z',
}

function mockSuccess(data: MonitorSummaryResponse) {
  mockUseMonitorSummary.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as UseQueryResult<MonitorSummaryResponse>)
}

function mockLoading() {
  mockUseMonitorSummary.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as UseQueryResult<MonitorSummaryResponse>)
}

function mockError() {
  mockUseMonitorSummary.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: vi.fn(),
  } as unknown as UseQueryResult<MonitorSummaryResponse>)
}

// H-5: default idle state for parallel hooks (prevents MSW unhandled-request warnings)
function setupParallelHookDefaults() {
  mockUseDailyMetrics.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as UseQueryResult<DailyMetrics[]>)

  mockUsePipelineGrid.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as UseQueryResult<PipelineHealthGrid>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setupParallelHookDefaults()
})

describe('MonitorPageContent', () => {
  it('renders monitor-page landmark and "Монитор" heading when data resolves', () => {
    mockSuccess(baseResponse)

    renderWithProviders(<MonitorPageContent />)

    expect(screen.getByTestId('monitor-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Монитор' })).toBeInTheDocument()
    expect(
      screen.getByText('Обзор состояния кабинета и ключевые метрики за периоды')
    ).toBeInTheDocument()
    // KPI cards rendered
    expect(screen.getByText('Всего артикулов')).toBeInTheDocument()
  })

  it('renders skeleton with role="status" on first load (isLoading && !data)', () => {
    mockLoading()

    renderWithProviders(<MonitorPageContent />)

    // Semantic loading region per Story 90.5 AC-3 pattern — scoped by aria-label (review fix L-1)
    expect(screen.getByRole('status', { name: 'Загрузка метрик' })).toBeInTheDocument()

    // No KPI card titles yet
    expect(screen.queryByText('Всего артикулов')).not.toBeInTheDocument()
  })

  it('renders error alert with retry button when isError && !data', () => {
    mockError()

    renderWithProviders(<MonitorPageContent />)

    expect(screen.getByText(/Не удалось загрузить метрики монитора/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()

    // No KPI cards
    expect(screen.queryByText('Всего артикулов')).not.toBeInTheDocument()
  })

  // Story 92.6-FE AC-7: orchestrator empty-success path — all hooks return success+empty
  it('renders all 5 blocks gracefully when every hook returns empty success', () => {
    // M-8 fix: shared fixture factories replace ~40 lines of inline shape construction.
    // emptyMonitorSummary / emptyPipelineGrid / emptyDailyMetrics live in
    // src/test/fixtures/monitor-empty.ts — single source of truth for both unit + E2E tests.
    mockUseMonitorSummary.mockReturnValue({
      data: emptyMonitorSummary(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<MonitorSummaryResponse>)

    // data=[] is truthy so the chart branch fires (not skeleton/error) → "Нет данных" state
    mockUseDailyMetrics.mockReturnValue({
      data: emptyDailyMetrics(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<DailyMetrics[]>)

    // H-4 fix + M-8 fix: full PipelineHealthGrid shape from shared fixture (no `as unknown as`)
    mockUsePipelineGrid.mockReturnValue({
      data: emptyPipelineGrid(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<PipelineHealthGrid>)

    renderWithProviders(<MonitorPageContent />)

    // All 5 block testids must be in the document — no crash, no error alert
    expect(screen.getByTestId('monitor-page')).toBeInTheDocument()
    expect(screen.getByTestId('table-metrics-4-periods')).toBeInTheDocument()
    expect(screen.getByTestId('monitor-weekly-chart')).toBeInTheDocument()
    expect(screen.getByTestId('monitor-buyout-gauge')).toBeInTheDocument()
    expect(screen.getByTestId('monitor-pipeline-health')).toBeInTheDocument()

    // No error alerts — empty success is not an error state
    expect(screen.queryByText(/Не удалось загрузить/i)).not.toBeInTheDocument()

    // Chart shows empty-state message (data=[])
    expect(screen.getByText('Нет данных за последние 7 дней')).toBeInTheDocument()

    // Pipeline shows all-healthy message (pipelines=[])
    expect(screen.getByText('Все пайплайны работают исправно')).toBeInTheDocument()
  })

  // H-5 review fix: verify gauge + pipeline panel render when all hooks succeed
  it('renders gauge and pipeline panel when monitor-summary and pipeline hooks both succeed', () => {
    mockSuccess(baseResponse)

    // Pipeline hook returns success with empty pipelines array
    // H-4 fix: full PipelineHealthGrid shape from shared fixture (no `as unknown as` shortcut)
    mockUsePipelineGrid.mockReturnValue({
      data: emptyPipelineGrid(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<PipelineHealthGrid>)

    renderWithProviders(<MonitorPageContent />)

    // Gauge must render (data.kpi.buyoutRatePercent = 68.5)
    expect(screen.getByTestId('monitor-buyout-gauge')).toBeInTheDocument()

    // Pipeline health panel renders (empty pipelines → all-healthy state)
    expect(screen.getByTestId('monitor-pipeline-health')).toBeInTheDocument()
    expect(screen.getByText('Все пайплайны работают исправно')).toBeInTheDocument()
  })
})
