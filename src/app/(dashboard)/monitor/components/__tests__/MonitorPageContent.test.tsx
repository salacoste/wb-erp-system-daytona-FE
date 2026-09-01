/**
 * Tests for MonitorPageContent orchestrator
 * Epic 92-FE Story 92.2: KPI Cards + Route Registration
 * H-5 review fix: mocked usePipelineGrid + useDailyMetrics to prevent MSW warnings.
 *
 * Mocks useMonitorSummary directly — avoids auth store + TanStack Query setup.
 * Pattern mirrors Story 90.4's AcquiringPeriodDetailPage.test.tsx.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  createMockQueryResult,
  createSuccessQueryResult,
  createLoadingQueryResult,
  createErrorQueryResult,
} from '@/test/utils/query-mock'
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
  mockUseMonitorSummary.mockReturnValue(createSuccessQueryResult(data))
}

function mockLoading() {
  mockUseMonitorSummary.mockReturnValue(createLoadingQueryResult<MonitorSummaryResponse>())
}

function mockError() {
  mockUseMonitorSummary.mockReturnValue(createErrorQueryResult<MonitorSummaryResponse>())
}

// H-5: default idle state for parallel hooks (prevents MSW unhandled-request warnings)
function setupParallelHookDefaults() {
  mockUseDailyMetrics.mockReturnValue(
    createSuccessQueryResult<DailyMetrics[]>(undefined as unknown as DailyMetrics[])
  )

  mockUsePipelineGrid.mockReturnValue(
    createSuccessQueryResult<PipelineHealthGrid>(undefined as unknown as PipelineHealthGrid)
  )
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

  it('renders cached summary with a refetch-error notice and retries the summary request', async () => {
    const user = userEvent.setup()
    const summaryRefetch = vi.fn()
    mockUseMonitorSummary.mockReturnValue(
      createMockQueryResult(baseResponse, {
        isError: true,
        isSuccess: false,
        error: new Error('summary refetch failed'),
        status: 'error',
        refetch: summaryRefetch,
      })
    )
    mockUseDailyMetrics.mockReturnValue(createSuccessQueryResult(emptyDailyMetrics()))
    mockUsePipelineGrid.mockReturnValue(createSuccessQueryResult(emptyPipelineGrid()))

    renderWithProviders(<MonitorPageContent />)

    expect(screen.getByText('Всего артикулов')).toBeInTheDocument()
    const notice = screen.getByText('Не удалось обновить. Показаны кэшированные данные.')
    expect(notice).toBeVisible()
    await user.click(within(notice.parentElement!).getByRole('button', { name: 'Повторить' }))
    expect(summaryRefetch).toHaveBeenCalledTimes(1)
  })

  it('keeps summary content visible while the independent weekly chart is loading', () => {
    mockSuccess(baseResponse)
    mockUseDailyMetrics.mockReturnValue(createLoadingQueryResult<DailyMetrics[]>())
    mockUsePipelineGrid.mockReturnValue(createSuccessQueryResult(emptyPipelineGrid()))

    renderWithProviders(<MonitorPageContent />)

    expect(screen.getByText('Всего артикулов')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'График за 7 дней' })).not.toBeInTheDocument()
    expect(screen.getByTestId('monitor-page').querySelector('.h-72.animate-pulse')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Состояние пайплайнов' })).toBeInTheDocument()
  })

  it('keeps summary content visible when the independent weekly chart fails and retries it', async () => {
    const user = userEvent.setup()
    const weeklyRefetch = vi.fn()
    mockSuccess(baseResponse)
    mockUseDailyMetrics.mockReturnValue(
      createErrorQueryResult<DailyMetrics[]>(new Error('weekly chart failed'), {
        refetch: weeklyRefetch,
      })
    )
    mockUsePipelineGrid.mockReturnValue(createSuccessQueryResult(emptyPipelineGrid()))

    renderWithProviders(<MonitorPageContent />)

    expect(screen.getByText('Всего артикулов')).toBeInTheDocument()
    const errorMessage = screen.getByText('Не удалось загрузить график за 7 дней.')
    expect(errorMessage).toBeVisible()
    expect(screen.getByRole('region', { name: 'Состояние пайплайнов' })).toBeInTheDocument()
    await user.click(within(errorMessage.parentElement!).getByRole('button', { name: 'Повторить' }))
    expect(weeklyRefetch).toHaveBeenCalledTimes(1)
  })

  it('keeps summary content visible while independent pipeline health is loading', () => {
    mockSuccess(baseResponse)
    mockUseDailyMetrics.mockReturnValue(createSuccessQueryResult(emptyDailyMetrics()))
    mockUsePipelineGrid.mockReturnValue(createLoadingQueryResult<PipelineHealthGrid>())

    renderWithProviders(<MonitorPageContent />)

    expect(screen.getByText('Всего артикулов')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'График за 7 дней' })).toBeInTheDocument()
    expect(screen.getByTestId('monitor-pipeline-skeleton')).toBeVisible()
    expect(screen.queryByRole('region', { name: 'Состояние пайплайнов' })).not.toBeInTheDocument()
  })

  it('keeps summary content visible when independent pipeline health fails and retries it', async () => {
    const user = userEvent.setup()
    const pipelineRefetch = vi.fn()
    mockSuccess(baseResponse)
    mockUseDailyMetrics.mockReturnValue(createSuccessQueryResult(emptyDailyMetrics()))
    mockUsePipelineGrid.mockReturnValue(
      createErrorQueryResult<PipelineHealthGrid>(new Error('pipeline health failed'), {
        refetch: pipelineRefetch,
      })
    )

    renderWithProviders(<MonitorPageContent />)

    expect(screen.getByText('Всего артикулов')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'График за 7 дней' })).toBeInTheDocument()
    const errorMessage = screen.getByText('Не удалось загрузить состояние пайплайнов.')
    expect(errorMessage).toBeVisible()
    await user.click(within(errorMessage.parentElement!).getByRole('button', { name: 'Повторить' }))
    expect(pipelineRefetch).toHaveBeenCalledTimes(1)
  })

  // Story 92.6-FE AC-7: orchestrator empty-success path — all hooks return success+empty
  it('renders all 5 blocks gracefully when every hook returns empty success', () => {
    // M-8 fix: shared fixture factories replace ~40 lines of inline shape construction.
    // emptyMonitorSummary / emptyPipelineGrid / emptyDailyMetrics live in
    // src/test/fixtures/monitor-empty.ts — single source of truth for both unit + E2E tests.
    mockUseMonitorSummary.mockReturnValue(createSuccessQueryResult(emptyMonitorSummary()))

    // data=[] is truthy so the chart branch fires (not skeleton/error) → "Нет данных" state
    mockUseDailyMetrics.mockReturnValue(createSuccessQueryResult(emptyDailyMetrics()))

    // H-4 fix + M-8 fix: full PipelineHealthGrid shape from shared fixture
    mockUsePipelineGrid.mockReturnValue(createSuccessQueryResult(emptyPipelineGrid()))

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
    // H-4 fix: full PipelineHealthGrid shape from shared fixture
    mockUsePipelineGrid.mockReturnValue(createSuccessQueryResult(emptyPipelineGrid()))

    renderWithProviders(<MonitorPageContent />)

    // Gauge must render (data.kpi.buyoutRatePercent = 68.5)
    expect(screen.getByTestId('monitor-buyout-gauge')).toBeInTheDocument()

    // Pipeline health panel renders (empty pipelines → all-healthy state)
    expect(screen.getByTestId('monitor-pipeline-health')).toBeInTheDocument()
    expect(screen.getByText('Все пайплайны работают исправно')).toBeInTheDocument()
  })
})
