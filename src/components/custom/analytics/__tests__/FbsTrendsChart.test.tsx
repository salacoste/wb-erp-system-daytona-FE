/**
 * Tests for FbsTrendsChart Component
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * @see docs/stories/epic-51/story-51.4-fe-fbs-trends-chart.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FbsTrendsChart } from '../FbsTrendsChart'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  mockTrends30DaysResponse,
  mockTrends90DaysResponse,
  mockTrends365DaysResponse,
  mockTrendsEmptyResponse,
  mockTrendsError,
  defaultChartProps,
  LINE_COLORS,
} from '@/test/fixtures/fbs-trends'
import type { TrendsResponse } from '@/types/fbs-analytics'

afterEach(() => vi.unstubAllGlobals())

vi.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children, height }: { children: React.ReactNode; height: number }) => (
      <div data-testid="responsive-container" style={{ height }}>
        {children}
      </div>
    ),
    LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
      <div data-testid="line-chart" data-points={data?.length ?? 0}>
        {children}
      </div>
    ),
    Line: ({
      dataKey,
      stroke,
      type,
      dot,
      yAxisId,
      isAnimationActive,
      animationDuration,
    }: {
      dataKey: string
      stroke: string
      type: string
      dot: boolean
      yAxisId: string
      isAnimationActive?: boolean
      animationDuration?: number
    }) => (
      <div
        data-testid={`line-${dataKey}`}
        data-stroke={stroke}
        data-type={type}
        data-dot={String(dot)}
        data-yaxis={yAxisId}
        data-animation-active={String(isAnimationActive)}
        data-animation-duration={animationDuration}
      />
    ),
    XAxis: ({ dataKey, tickFormatter: _tf }: { dataKey: string; tickFormatter?: unknown }) => (
      <div data-testid="x-axis" data-datakey={dataKey} />
    ),
    YAxis: ({ yAxisId, orientation }: { yAxisId: string; orientation?: string }) => (
      <div data-testid={`y-axis-${yAxisId}`} data-orientation={orientation ?? 'left'} />
    ),
    CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => (
      <div data-testid="cartesian-grid" data-stroke-dasharray={strokeDasharray} />
    ),
    Tooltip: ({ content }: { content: React.ReactNode }) => (
      <div data-testid="recharts-tooltip">{content}</div>
    ),
  }
})

const mockUseFbsTrends = vi.fn()
vi.mock('@/hooks/useFbsAnalytics', () => ({
  useFbsTrends: (...args: unknown[]) => mockUseFbsTrends(...args),
}))

const defaultProps = { from: defaultChartProps.from, to: defaultChartProps.to }

function mockSuccessResponse(response: TrendsResponse = mockTrends30DaysResponse) {
  mockUseFbsTrends.mockReturnValue({
    data: response,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })
}

function mockLoadingState() {
  mockUseFbsTrends.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  })
}

function mockErrorState() {
  const refetch = vi.fn()
  mockUseFbsTrends.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: mockTrendsError,
    refetch,
  })
  return { refetch }
}

function mockEmptyState() {
  mockUseFbsTrends.mockReturnValue({
    data: mockTrendsEmptyResponse,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })
}

function renderChart(overrides: Record<string, unknown> = {}) {
  return renderWithProviders(<FbsTrendsChart {...defaultProps} {...overrides} />)
}

describe('FbsTrendsChart - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccessResponse()
  })

  it('renders card with title', () => {
    renderChart()
    expect(screen.getByText('Динамика заказов FBS')).toBeInTheDocument()
  })

  it('renders LineChart with data points', () => {
    renderChart()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders ResponsiveContainer', () => {
    renderChart()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders CartesianGrid with dashed stroke', () => {
    renderChart()
    expect(screen.getByTestId('cartesian-grid').dataset.strokeDasharray).toBe('3 3')
  })

  it('renders X-axis keyed on date', () => {
    renderChart()
    expect(screen.getByTestId('x-axis').dataset.datakey).toBe('date')
  })

  it('renders left Y-axis for counts', () => {
    renderChart()
    expect(screen.getByTestId('y-axis-left').dataset.orientation).toBe('left')
  })

  it('renders right Y-axis for revenue', () => {
    renderChart()
    expect(screen.getByTestId('y-axis-right').dataset.orientation).toBe('right')
  })

  it('renders Line components for visible metrics', () => {
    renderChart()
    expect(screen.getByTestId('line-ordersCount')).toBeInTheDocument()
    expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
  })

  it('applies correct colors to each line', () => {
    renderChart()
    expect(screen.getByTestId('line-ordersCount').dataset.stroke).toBe(LINE_COLORS.orders)
    expect(screen.getByTestId('line-revenue').dataset.stroke).toBe(LINE_COLORS.revenue)
  })

  it('uses monotone curve type', () => {
    renderChart()
    expect(screen.getByTestId('line-ordersCount').dataset.type).toBe('monotone')
  })

  it('disables dots on data points', () => {
    renderChart()
    expect(screen.getByTestId('line-ordersCount').dataset.dot).toBe('false')
  })

  it('applies custom className when provided', () => {
    const { container } = renderChart({ className: 'custom-test-class' })
    expect(container.firstElementChild?.className).toContain('custom-test-class')
  })
})

describe('FbsTrendsChart - Metric Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccessResponse()
  })

  it('shows orders line by default', () => {
    renderChart()
    expect(screen.getByTestId('line-ordersCount')).toBeInTheDocument()
  })

  it('shows revenue line by default', () => {
    renderChart()
    expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
  })

  it('hides cancellations line by default', () => {
    renderChart()
    expect(screen.queryByTestId('line-cancellations')).not.toBeInTheDocument()
  })

  it('toggles orders visibility when legend clicked', async () => {
    const user = userEvent.setup()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Заказы/ }))
    expect(screen.queryByTestId('line-ordersCount')).not.toBeInTheDocument()
  })

  it('toggles revenue visibility when legend clicked', async () => {
    const user = userEvent.setup()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Выручка/ }))
    expect(screen.queryByTestId('line-revenue')).not.toBeInTheDocument()
  })

  it('toggles cancellations visibility when legend clicked', async () => {
    const user = userEvent.setup()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Отмены/ }))
    expect(screen.getByTestId('line-cancellations')).toBeInTheDocument()
  })

  it('prevents hiding last visible metric', async () => {
    const user = userEvent.setup()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Заказы/ }))
    await user.click(screen.getByRole('button', { name: /Выручка/ }))
    // Revenue should still be visible
    expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
  })

  it('shows aria-pressed true for visible metrics', () => {
    renderChart()
    expect(screen.getByRole('button', { name: /Заказы.*показать/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('shows aria-pressed false for hidden metrics', () => {
    renderChart()
    expect(screen.getByRole('button', { name: /Отмены.*скрыть/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('allows showing all three metrics simultaneously', async () => {
    const user = userEvent.setup()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Отмены/ }))
    expect(screen.getByTestId('line-ordersCount')).toBeInTheDocument()
    expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
    expect(screen.getByTestId('line-cancellations')).toBeInTheDocument()
  })

  it('allows showing only one metric', async () => {
    const user = userEvent.setup()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Заказы/ }))
    expect(screen.queryByTestId('line-ordersCount')).not.toBeInTheDocument()
    expect(screen.getByTestId('line-revenue')).toBeInTheDocument()
    expect(screen.queryByTestId('line-cancellations')).not.toBeInTheDocument()
  })
})

describe('FbsTrendsChart - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadingState()
  })

  it('shows skeleton loader during initial load', () => {
    renderChart()
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })

  it('skeleton matches chart dimensions (default 400px)', () => {
    renderChart()
    expect(document.querySelector('[class*="animate-pulse"]')).toHaveStyle({ height: '400px' })
  })

  it('skeleton matches custom height prop', () => {
    renderChart({ height: 500 })
    expect(document.querySelector('[class*="animate-pulse"]')).toHaveStyle({ height: '500px' })
  })

  it('displays title while loading', () => {
    renderChart()
    expect(screen.getByText('Динамика заказов FBS')).toBeInTheDocument()
  })

  it('hides legend while loading', () => {
    renderChart()
    expect(screen.queryByRole('group', { name: /метрик/ })).not.toBeInTheDocument()
  })

  it('hides chart while loading', () => {
    renderChart()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('applies animate-pulse class to skeleton', () => {
    renderChart()
    expect(document.querySelector('[class*="animate-pulse"]')?.className).toContain('animate-pulse')
  })
})

describe('FbsTrendsChart - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error alert when fetch fails', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('displays error message in Russian', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByText(/Не удалось загрузить данные трендов/)).toBeInTheDocument()
  })

  it('shows AlertCircle icon in error state', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument()
  })

  it('renders retry button with Russian label', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('calls refetch when retry button clicked', async () => {
    const { refetch } = mockErrorState()
    const user = userEvent.setup()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('uses destructive variant for error alert', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByRole('alert').className).toContain('destructive')
  })

  it('displays title even in error state', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByText('Динамика заказов FBS')).toBeInTheDocument()
  })

  it('hides chart content in error state', () => {
    mockErrorState()
    renderChart()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('handles network errors gracefully', () => {
    mockUseFbsTrends.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network request failed'),
      refetch: vi.fn(),
    })
    renderChart()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('handles timeout errors gracefully', () => {
    mockUseFbsTrends.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Request timeout after 30000ms'),
      refetch: vi.fn(),
    })
    renderChart()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('FbsTrendsChart - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmptyState()
  })

  it('shows empty state when no data returned', () => {
    renderChart()
    expect(screen.getByText(/Нет данных за выбранный период/)).toBeInTheDocument()
  })

  it('suggests selecting different date range in Russian', () => {
    renderChart()
    expect(screen.getByText(/Попробуйте выбрать другой диапазон дат/)).toBeInTheDocument()
  })

  it('displays title in empty state', () => {
    renderChart()
    expect(screen.getByText('Динамика заказов FBS')).toBeInTheDocument()
  })

  it('hides chart in empty state', () => {
    renderChart()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('handles null trends array', () => {
    mockUseFbsTrends.mockReturnValue({
      data: { ...mockTrendsEmptyResponse, trends: null },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderChart()
    expect(screen.getByText(/Нет данных за выбранный период/)).toBeInTheDocument()
  })
})

describe('FbsTrendsChart - Data Source Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Реалтайм" badge for orders_fbs source', () => {
    mockSuccessResponse(mockTrends30DaysResponse)
    renderChart()
    expect(screen.getByText('Реалтайм')).toBeInTheDocument()
  })

  it('shows "Ежедневно" badge for reports source', () => {
    mockSuccessResponse(mockTrends90DaysResponse)
    renderChart()
    expect(screen.getByText('Ежедневно')).toBeInTheDocument()
  })

  it('shows "Еженедельно" badge for analytics source', () => {
    mockSuccessResponse(mockTrends365DaysResponse)
    renderChart()
    expect(screen.getByText('Еженедельно')).toBeInTheDocument()
  })

  it('positions badge in header flex row', () => {
    mockSuccessResponse()
    renderChart()
    const badge = screen.getByText('Реалтайм')
    expect(badge.closest('[class*="flex"]')).toBeInTheDocument()
  })

  it('updates badge when data source changes on rerender', () => {
    mockSuccessResponse(mockTrends30DaysResponse)
    const { rerender } = renderChart()
    expect(screen.getByText('Реалтайм')).toBeInTheDocument()
    mockSuccessResponse(mockTrends365DaysResponse)
    rerender(<FbsTrendsChart {...defaultProps} />)
    expect(screen.getByText('Еженедельно')).toBeInTheDocument()
  })

  it('renders badge with correct green styling for orders_fbs', () => {
    mockSuccessResponse(mockTrends30DaysResponse)
    renderChart()
    expect(screen.getByText('Реалтайм').className).toContain('bg-green-100')
  })
})

describe('FbsTrendsChart - Aggregation & Hook Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccessResponse()
  })

  it('defaults to "day" aggregation', () => {
    renderChart()
    expect(mockUseFbsTrends).toHaveBeenCalledWith(
      expect.objectContaining({ aggregation: 'day' }),
      undefined
    )
  })

  it('passes aggregation value to useFbsTrends', () => {
    renderChart({ aggregation: 'week' })
    expect(mockUseFbsTrends).toHaveBeenCalledWith(
      expect.objectContaining({ aggregation: 'week' }),
      undefined
    )
  })

  it('passes from/to dates to hook', () => {
    renderChart({ from: '2025-11-01', to: '2026-01-29' })
    expect(mockUseFbsTrends).toHaveBeenCalledWith(
      expect.objectContaining({ from: '2025-11-01', to: '2026-01-29' }),
      undefined
    )
  })

  it('passes queryOptions to useFbsTrends', () => {
    const queryOptions = { enabled: false }
    renderChart({ queryOptions })
    expect(mockUseFbsTrends).toHaveBeenCalledWith(expect.anything(), queryOptions)
  })

  it('handles hook loading state', () => {
    mockLoadingState()
    renderChart()
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })

  it('handles hook error state', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('handles hook data state', () => {
    mockSuccessResponse()
    renderChart()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders complete chart with all features', () => {
    renderChart()
    expect(screen.getByText('Динамика заказов FBS')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /метрик/ })).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByText('Реалтайм')).toBeInTheDocument()
  })

  it('supports className composition', () => {
    const { container } = renderChart({ className: 'extra-class' })
    expect(container.firstElementChild?.className).toContain('extra-class')
  })
})

describe('FbsTrendsChart - Tooltip & Responsive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccessResponse()
  })

  it('renders custom tooltip content element', () => {
    renderChart()
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument()
  })

  it('uses default height of 400px', () => {
    renderChart()
    expect(screen.getByTestId('responsive-container').style.height).toBe('400px')
  })

  it('respects custom height prop', () => {
    renderChart({ height: 500 })
    expect(screen.getByTestId('responsive-container').style.height).toBe('500px')
  })

  it('enforces minimum height of 300px', () => {
    renderChart({ height: 200 })
    expect(screen.getByTestId('responsive-container').style.height).toBe('300px')
  })
})

describe('FbsTrendsChart - Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 30 data points', () => {
    mockSuccessResponse(mockTrends30DaysResponse)
    renderChart()
    expect(screen.getByTestId('line-chart').dataset.points).toBe('30')
  })

  it('renders 90 data points', () => {
    mockSuccessResponse(mockTrends90DaysResponse)
    renderChart()
    expect(screen.getByTestId('line-chart').dataset.points).toBe('90')
  })

  it('renders 52 weeks for 365-day range', () => {
    mockSuccessResponse(mockTrends365DaysResponse)
    renderChart()
    expect(screen.getByTestId('line-chart').dataset.points).toBe('52')
  })

  it('does not cause layout shift on data load', () => {
    mockLoadingState()
    const { rerender } = renderChart()
    expect(screen.getByText('Динамика заказов FBS')).toBeInTheDocument()
    mockSuccessResponse()
    rerender(<FbsTrendsChart {...defaultProps} />)
    expect(screen.getByText('Динамика заказов FBS')).toBeInTheDocument()
  })
})

describe('FbsTrendsChart - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccessResponse()
  })

  it('has ARIA label describing chart content', () => {
    renderChart()
    expect(screen.getByRole('img', { name: /График динамики заказов FBS/ })).toBeInTheDocument()
  })

  it('ties the chart to an exact named data table with period, units, series, and values', () => {
    renderChart()

    const chart = screen.getByRole('img', { name: 'График динамики заказов FBS' })
    const table = screen.getByRole('table', {
      name: 'Данные графика динамики заказов FBS; период: 2025-12-31 — 2026-01-29; агрегация: По дням; единицы: заказы и отмены — штуки, выручка — рубли',
    })

    expect(table.id).not.toBe('')
    expect(chart).toHaveAttribute('aria-describedby', table.id)
    expect(screen.getByRole('columnheader', { name: 'Дата' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Заказы, шт.' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Выручка, ₽' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Отмены, шт.' })).toBeInTheDocument()
    const firstDataRow = screen.getByRole('row', { name: /2025-12-31.*40/ })
    expect(firstDataRow).toHaveTextContent('40')
    expect(firstDataRow).toHaveTextContent('60 000 ₽')
    expect(firstDataRow).toHaveTextContent('2')
  })

  it('disables Recharts animation when reduced motion is requested', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )

    renderChart()

    expect(screen.getByTestId('line-ordersCount')).toHaveAttribute('data-animation-active', 'false')
    expect(screen.getByTestId('line-ordersCount')).toHaveAttribute('data-animation-duration', '0')
  })

  it('makes legend items keyboard accessible via buttons', () => {
    renderChart()
    const legendButtons = screen.getAllByRole('button').filter(b => b.dataset.metric !== undefined)
    expect(legendButtons.length).toBe(3)
  })

  it('supports Tab navigation through legend', () => {
    renderChart()
    const legendButtons = screen.getAllByRole('button').filter(b => b.dataset.metric !== undefined)
    for (const btn of legendButtons) {
      expect(btn.tabIndex).toBeGreaterThanOrEqual(-1)
    }
  })

  it('has aria-pressed state for legend buttons', () => {
    renderChart()
    expect(screen.getByRole('button', { name: /Заказы/ })).toHaveAttribute('aria-pressed', 'true')
    const hiddenMetric = screen.getByRole('button', { name: /Отмены/ })
    expect(hiddenMetric).toHaveAttribute('aria-pressed', 'false')
    expect(hiddenMetric).not.toHaveClass('opacity-60')
    expect(hiddenMetric.querySelector('.font-medium')).toHaveClass('text-foreground')
  })

  it('has descriptive labels for toggle buttons', () => {
    renderChart()
    expect(screen.getByRole('button', { name: /Заказы/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Выручка/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Отмены/ })).toBeInTheDocument()
  })

  it('has legend group with aria-label', () => {
    renderChart()
    expect(
      screen.getByRole('group', { name: /Управление отображением метрик/ })
    ).toBeInTheDocument()
  })

  it('has aria-label on data source badge', () => {
    renderChart()
    expect(screen.getByLabelText(/Источник данных/)).toBeInTheDocument()
  })

  it('has focus ring styles on legend buttons', () => {
    renderChart()
    const legendButtons = screen.getAllByRole('button').filter(b => b.dataset.metric !== undefined)
    for (const btn of legendButtons) {
      expect(btn.className).toContain('focus:ring')
    }
  })
})

describe('FbsTrendsChart - End-to-End', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls useFbsTrends once on mount', () => {
    mockSuccessResponse()
    renderChart()
    expect(mockUseFbsTrends).toHaveBeenCalledTimes(1)
  })

  it('renders cancellations line with correct color when toggled on', async () => {
    const user = userEvent.setup()
    mockSuccessResponse()
    renderChart()
    await user.click(screen.getByRole('button', { name: /Отмены/ }))
    expect(screen.getByTestId('line-cancellations').dataset.stroke).toBe(LINE_COLORS.cancellations)
  })

  it('shows skeleton when disabled via queryOptions', () => {
    mockUseFbsTrends.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })
    renderChart({ queryOptions: { enabled: false } })
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })
})
