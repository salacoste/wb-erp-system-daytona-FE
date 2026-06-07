/**
 * Tests for SeasonalPatternsChart Component
 * Story 51.6-FE: Seasonal Patterns
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Tests monthly/weekly/quarterly tabs with bar charts,
 * seasonal pattern visualization, and insights display.
 *
 * @see docs/stories/epic-51/story-51.6-fe-seasonal-patterns.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeasonalPatternsChart } from '../SeasonalPatternsChart'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  mockMonthlyPatterns,
  mockQuarterlyPatterns,
  mockSeasonalResponseMonthly,
  mockSeasonalResponseAll,
} from '@/test/fixtures/fbs-analytics'
import type { SeasonalResponse } from '@/types/fbs-analytics'

// ============================================================================
// Mock recharts (jsdom cannot render SVG dimensions)
// ============================================================================

vi.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
      <div data-testid="bar-chart" data-points={data?.length ?? 0}>
        {children}
      </div>
    ),
    Bar: ({
      dataKey,
      radius,
      children,
    }: {
      dataKey: string
      radius: number[]
      children: React.ReactNode
    }) => (
      <div data-testid="bar-element" data-datakey={dataKey} data-radius={String(radius)}>
        {children}
      </div>
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="x-axis" data-datakey={dataKey} />
    ),
    YAxis: ({ tickFormatter }: { tickFormatter?: unknown }) => (
      <div data-testid="y-axis" data-has-formatter={String(!!tickFormatter)} />
    ),
    CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => (
      <div data-testid="cartesian-grid" data-stroke-dasharray={strokeDasharray} />
    ),
    Tooltip: ({ content }: { content: React.ReactNode }) => (
      <div data-testid="recharts-tooltip">{content}</div>
    ),
    Cell: ({ fill }: { fill: string }) => <div data-testid="chart-cell" data-fill={fill} />,
  }
})

// ============================================================================
// Mock useFbsSeasonal hook
// ============================================================================

const mockUseFbsSeasonal = vi.fn()

vi.mock('@/hooks/useFbsAnalytics', () => ({
  useFbsSeasonal: (...args: unknown[]) => mockUseFbsSeasonal(...args),
}))

// ============================================================================
// Helpers
// ============================================================================

function mockSuccess(data: SeasonalResponse) {
  mockUseFbsSeasonal.mockReturnValue({ data, isLoading: false, error: null, refetch: vi.fn() })
}

function mockLoadingState() {
  mockUseFbsSeasonal.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  })
}

function mockErrorState() {
  const refetch = vi.fn()
  mockUseFbsSeasonal.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: new Error('fail'),
    refetch,
  })
  return { refetch }
}

function mockEmptyState() {
  mockUseFbsSeasonal.mockReturnValue({
    data: { patterns: {}, insights: {} },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })
}

function renderChart(overrides: Record<string, unknown> = {}) {
  return renderWithProviders(<SeasonalPatternsChart months={12} height={350} {...overrides} />)
}

/** Find the Card root (has rounded-xl class) for className assertions */
function getCardRoot() {
  return screen.getByText('Сезонность заказов').closest('.rounded-xl')
}

// ============================================================================
// Basic Rendering
// ============================================================================

describe('SeasonalPatternsChart - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockSeasonalResponseMonthly)
  })

  it('should render Card with title "Сезонность заказов"', () => {
    renderChart()
    expect(screen.getByText('Сезонность заказов')).toBeInTheDocument()
  })

  it('should render tablist for view switching', () => {
    renderChart()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('should render 3 tab triggers (Месяцы, Дни недели, Кварталы)', () => {
    renderChart()
    expect(screen.getByRole('tab', { name: 'Месяцы' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Дни недели' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Кварталы' })).toBeInTheDocument()
  })

  it('should render BarChart component', () => {
    renderChart()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('should render ResponsiveContainer', () => {
    renderChart()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('should render XAxis with "name" dataKey', () => {
    renderChart()
    expect(screen.getByTestId('x-axis').dataset.datakey).toBe('name')
  })

  it('should render YAxis with formatter', () => {
    renderChart()
    expect(screen.getByTestId('y-axis').dataset.hasFormatter).toBe('true')
  })

  it('should render Bar with "value" dataKey', () => {
    renderChart()
    expect(screen.getByTestId('bar-element').dataset.datakey).toBe('value')
  })

  it('should accept custom className prop', () => {
    renderChart({ className: 'my-class' })
    expect(getCardRoot()?.className).toContain('my-class')
  })
})

// ============================================================================
// Tab Navigation
// ============================================================================

describe('SeasonalPatternsChart - Tab Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockSeasonalResponseAll)
  })

  it('should default to "Месяцы" tab active', () => {
    renderChart()
    expect(screen.getByRole('tab', { name: 'Месяцы' })).toHaveAttribute('data-state', 'active')
  })

  it('should switch to "Дни недели" on click', async () => {
    renderChart()
    const weeklyTab = screen.getByRole('tab', { name: 'Дни недели' })
    await userEvent.setup().click(weeklyTab)
    expect(weeklyTab).toHaveAttribute('data-state', 'active')
  })

  it('should switch to "Кварталы" on click', async () => {
    renderChart()
    const quarterlyTab = screen.getByRole('tab', { name: 'Кварталы' })
    await userEvent.setup().click(quarterlyTab)
    expect(quarterlyTab).toHaveAttribute('data-state', 'active')
  })

  it('should pass view and months to useFbsSeasonal', () => {
    mockSuccess(mockSeasonalResponseMonthly)
    renderChart()
    expect(mockUseFbsSeasonal).toHaveBeenCalledWith(
      expect.objectContaining({ view: 'monthly', months: 12 })
    )
  })

  it('should call hook with updated view on tab change', async () => {
    mockSuccess(mockSeasonalResponseMonthly)
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    expect(mockUseFbsSeasonal).toHaveBeenCalledWith(expect.objectContaining({ view: 'weekly' }))
  })

  it('should update chart data points when switching to weekly', async () => {
    renderChart()
    // Default monthly: 12 points
    expect(screen.getByTestId('bar-chart').dataset.points).toBe('12')

    // After clicking weekly tab: 7 points
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart').dataset.points).toBe('7')
    })
  })

  it('should update chart data points when switching to quarterly', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart').dataset.points).toBe('4')
    })
  })

  it('should show loading state when tab changes to loading', async () => {
    mockSuccess(mockSeasonalResponseAll)
    renderChart()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    mockLoadingState()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('should support keyboard focus navigation between tabs', async () => {
    renderChart()
    const monthlyTab = screen.getByRole('tab', { name: 'Месяцы' })
    monthlyTab.focus()
    expect(document.activeElement).toBe(monthlyTab)
    await userEvent.setup().keyboard('{ArrowRight}')
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Дни недели' }))
    })
  })

  it('should render 3 tabs inside tablist', () => {
    renderChart()
    expect(screen.getByRole('tablist').querySelectorAll('[role="tab"]')).toHaveLength(3)
  })
})

// ============================================================================
// Monthly View
// ============================================================================

describe('SeasonalPatternsChart - Monthly View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockSeasonalResponseMonthly)
  })

  it('should display 12 bars for each month', () => {
    renderChart()
    expect(screen.getByTestId('bar-chart').dataset.points).toBe('12')
  })

  it('should map data count to fixture length', () => {
    renderChart()
    expect(screen.getByTestId('bar-chart').dataset.points).toBe(String(mockMonthlyPatterns.length))
  })

  it('should highlight peak month (December) with green', () => {
    renderChart()
    expect(screen.getAllByTestId('chart-cell').find(c => c.dataset.fill === '#22C55E')).toBeTruthy()
  })

  it('should highlight low month (July) with red', () => {
    renderChart()
    expect(screen.getAllByTestId('chart-cell').find(c => c.dataset.fill === '#EF4444')).toBeTruthy()
  })

  it('should render CartesianGrid with dashed stroke', () => {
    renderChart()
    expect(screen.getByTestId('cartesian-grid').dataset.strokeDasharray).toBe('3 3')
  })

  it('should render chart region with aria-label containing "Месяцы"', () => {
    renderChart()
    expect(screen.getByRole('img', { name: /График сезонности: Месяцы/ })).toBeInTheDocument()
  })

  it('should handle partial month data', () => {
    mockSuccess({
      patterns: {
        monthly: [
          { month: 'January', avgOrders: 100, avgRevenue: 150000 },
          { month: 'June', avgOrders: 80, avgRevenue: 120000 },
        ],
      },
      insights: {
        peakMonth: 'January',
        lowMonth: 'June',
        peakDayOfWeek: 'Monday',
        seasonalityIndex: 0.5,
      },
    })
    renderChart()
    expect(screen.getByTestId('bar-chart').dataset.points).toBe('2')
  })

  it('should use rounded top corners on bars', () => {
    renderChart()
    expect(screen.getByTestId('bar-element').dataset.radius).toBe('4,4,0,0')
  })

  it('should render custom tooltip', () => {
    renderChart()
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument()
  })

  it('should render 12 cells matching data points', () => {
    renderChart()
    expect(screen.getAllByTestId('chart-cell')).toHaveLength(12)
  })
})

// ============================================================================
// Weekly View (tested via tab switch with All data)
// ============================================================================

describe('SeasonalPatternsChart - Weekly View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockSeasonalResponseAll)
  })

  it('should display 7 bars after switching to weekly tab', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart').dataset.points).toBe('7')
    })
  })

  it('should highlight busiest day (Friday) with peak color', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(
        screen.getAllByTestId('chart-cell').find(c => c.dataset.fill === '#22C55E')
      ).toBeTruthy()
    })
  })

  it('should highlight slowest day (Sunday) with low color', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(
        screen.getAllByTestId('chart-cell').find(c => c.dataset.fill === '#EF4444')
      ).toBeTruthy()
    })
  })

  it('should use default blue for 5 non-peak/non-low days', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(
        screen.getAllByTestId('chart-cell').filter(c => c.dataset.fill === '#3B82F6')
      ).toHaveLength(5)
    })
  })

  it('should render aria-label with "Дни недели" after tab switch', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /График сезонности: Дни недели/ })).toBeInTheDocument()
    })
  })

  it('should render 7 cells after switching to weekly', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(screen.getAllByTestId('chart-cell')).toHaveLength(7)
    })
  })

  it('should render tooltip for weekly view', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument()
  })
})

// ============================================================================
// Quarterly View (tested via tab switch with All data)
// ============================================================================

describe('SeasonalPatternsChart - Quarterly View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockSeasonalResponseAll)
  })

  it('should display 4 bars after switching to quarterly tab', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart').dataset.points).toBe('4')
    })
  })

  it('should map data points to quarter fixture count', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart').dataset.points).toBe(
        String(mockQuarterlyPatterns.length)
      )
    })
  })

  it('should highlight best quarter (Q4) with peak color', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(
        screen.getAllByTestId('chart-cell').find(c => c.dataset.fill === '#22C55E')
      ).toBeTruthy()
    })
  })

  it('should highlight worst quarter (Q3) with low color', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(
        screen.getAllByTestId('chart-cell').find(c => c.dataset.fill === '#EF4444')
      ).toBeTruthy()
    })
  })

  it('should render 4 cells matching data points', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(screen.getAllByTestId('chart-cell')).toHaveLength(4)
    })
  })

  it('should render aria-label with "Кварталы" after tab switch', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /График сезонности: Кварталы/ })).toBeInTheDocument()
    })
  })

  it('should render tooltip for quarterly view', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument()
  })
})

// ============================================================================
// Loading State
// ============================================================================

describe('SeasonalPatternsChart - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadingState()
  })

  it('should show card title during loading', () => {
    renderChart()
    expect(screen.getByText('Сезонность заказов')).toBeInTheDocument()
  })

  it('should not show chart during loading', () => {
    renderChart()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('should not show tabs during loading', () => {
    renderChart()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('should not show error during loading', () => {
    renderChart()
    expect(screen.queryByText('Не удалось загрузить данные сезонности.')).not.toBeInTheDocument()
  })

  it('should accept custom className during loading', () => {
    renderChart({ className: 'loading-class' })
    expect(getCardRoot()?.className).toContain('loading-class')
  })
})

// ============================================================================
// Error State
// ============================================================================

describe('SeasonalPatternsChart - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show error alert on fetch failure', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByText('Не удалось загрузить данные сезонности.')).toBeInTheDocument()
  })

  it('should render "Повторить" retry button', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('should call refetch when retry clicked', async () => {
    const { refetch } = mockErrorState()
    renderChart()
    await userEvent.setup().click(screen.getByText('Повторить'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should hide chart on error', () => {
    mockErrorState()
    renderChart()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('should show destructive alert variant', () => {
    mockErrorState()
    renderChart()
    const alertEl = screen.getByRole('alert')
    expect(alertEl.className).toContain('destructive')
  })

  it('should render card title even on error', () => {
    mockErrorState()
    renderChart()
    expect(screen.getByText('Сезонность заказов')).toBeInTheDocument()
  })

  it('should accept custom className in error state', () => {
    mockErrorState()
    renderChart({ className: 'error-class' })
    expect(getCardRoot()?.className).toContain('error-class')
  })
})

// ============================================================================
// Empty State
// ============================================================================

describe('SeasonalPatternsChart - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmptyState()
  })

  it('should show "Нет данных за выбранный период"', () => {
    renderChart()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('should hide chart when empty', () => {
    renderChart()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('should maintain tab navigation in empty state', () => {
    renderChart()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Месяцы' })).toBeInTheDocument()
  })

  it('should render card title in empty state', () => {
    renderChart()
    expect(screen.getByText('Сезонность заказов')).toBeInTheDocument()
  })
})

// ============================================================================
// Accessibility
// ============================================================================

describe('SeasonalPatternsChart - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockSeasonalResponseAll)
  })

  it('should have role="img" on chart region', () => {
    renderChart()
    expect(screen.getByRole('img', { name: /График сезонности/ })).toBeInTheDocument()
  })

  it('should have data-state="active" on active tab', () => {
    renderChart()
    expect(screen.getByRole('tab', { name: 'Месяцы' })).toHaveAttribute('data-state', 'active')
  })

  it('should have 3 tabs with proper names', () => {
    renderChart()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    tabs.forEach(tab => expect(tab).toHaveAttribute('role', 'tab'))
  })

  it('should update aria-label when switching to weekly tab', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Дни недели' }))
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'График сезонности: Дни недели' })).toBeInTheDocument()
    })
  })

  it('should update aria-label when switching to quarterly tab', async () => {
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'График сезонности: Кварталы' })).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Integration
// ============================================================================

describe('SeasonalPatternsChart - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call useFbsSeasonal hook on mount', () => {
    mockSuccess(mockSeasonalResponseMonthly)
    renderChart()
    expect(mockUseFbsSeasonal).toHaveBeenCalledTimes(1)
  })

  it('should pass months prop to hook', () => {
    mockSuccess(mockSeasonalResponseMonthly)
    renderChart({ months: 6 })
    expect(mockUseFbsSeasonal).toHaveBeenCalledWith(expect.objectContaining({ months: 6 }))
  })

  it('should pass view type to hook on tab change', async () => {
    mockSuccess(mockSeasonalResponseAll)
    renderChart()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Кварталы' }))
    expect(mockUseFbsSeasonal).toHaveBeenCalledWith(expect.objectContaining({ view: 'quarterly' }))
  })

  it('should use default months=12 when not specified', () => {
    mockSuccess(mockSeasonalResponseMonthly)
    renderWithProviders(<SeasonalPatternsChart />)
    expect(mockUseFbsSeasonal).toHaveBeenCalledWith(expect.objectContaining({ months: 12 }))
  })

  it('should handle all states (loading -> error -> success)', () => {
    mockLoadingState()
    const { unmount: u1 } = renderChart()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
    u1()

    mockErrorState()
    const { unmount: u2 } = renderChart()
    expect(screen.getByText('Не удалось загрузить данные сезонности.')).toBeInTheDocument()
    u2()

    mockSuccess(mockSeasonalResponseMonthly)
    renderChart()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('should render all chart sub-components', () => {
    mockSuccess(mockSeasonalResponseMonthly)
    renderChart()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-element')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('should handle large dataset without errors', () => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    mockSuccess({
      patterns: {
        monthly: monthNames.map(m => ({
          month: m,
          avgOrders: 1000 + Math.floor(Math.random() * 2000),
          avgRevenue: 1500000,
        })),
      },
      insights: {
        peakMonth: 'December',
        lowMonth: 'July',
        peakDayOfWeek: 'Friday',
        seasonalityIndex: 0.72,
      },
    })
    expect(() => renderChart()).not.toThrow()
    expect(screen.getByTestId('bar-chart').dataset.points).toBe('12')
  })

  it('should use at most 3 distinct bar colors', () => {
    mockSuccess(mockSeasonalResponseMonthly)
    renderChart()
    const fills = new Set(screen.getAllByTestId('chart-cell').map(c => c.dataset.fill))
    expect(fills.size).toBeLessThanOrEqual(3)
  })
})
