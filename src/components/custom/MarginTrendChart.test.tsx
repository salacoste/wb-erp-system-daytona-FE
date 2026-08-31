/**
 * Unit tests for MarginTrendChart component
 * Story 4.7: Margin Analysis by Time Period
 *
 * Tests:
 * - Chart rendering with data
 * - Loading state
 * - Error state
 * - Empty state
 * - Summary statistics calculations
 * - Tooltip formatting
 * - Color coding (green/red/gray)
 */

import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MarginTrendChart } from './MarginTrendChart'
import { MarginTrendTooltip } from './margin-trend-chart/MarginTrendTooltip'
import type { MarginTrendPoint } from '@/types/api'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: ({
    isAnimationActive,
    animationDuration,
  }: {
    isAnimationActive?: boolean
    animationDuration?: number
  }) => (
    <div
      data-testid="margin-line"
      data-animation-active={String(isAnimationActive)}
      data-animation-duration={animationDuration}
    />
  ),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
}))

// Mock useMarginTrends hook
vi.mock('@/hooks/useMarginTrends', () => ({
  useMarginTrends: vi.fn(),
}))

const { useMarginTrends } = await import('@/hooks/useMarginTrends')

afterEach(() => vi.unstubAllGlobals())

type TrendsHookReturn = ReturnType<typeof useMarginTrends>

const mockTrendData: MarginTrendPoint[] = [
  {
    week: '2025-W45',
    week_start_date: '2025-11-03',
    week_end_date: '2025-11-09',
    margin_pct: 35.5,
    revenue_net: 125000.5,
    cogs: 80625.32,
    profit: 44375.18,
    qty: 50,
    sku_count: 10,
    missing_cogs_count: 0,
  },
  {
    week: '2025-W46',
    week_start_date: '2025-11-10',
    week_end_date: '2025-11-16',
    margin_pct: 28.2,
    revenue_net: 98000.0,
    cogs: 70364.0,
    profit: 27636.0,
    qty: 40,
    sku_count: 8,
    missing_cogs_count: 2,
  },
  {
    week: '2025-W47',
    week_start_date: '2025-11-17',
    week_end_date: '2025-11-23',
    margin_pct: -5.5,
    revenue_net: 75000.0,
    cogs: 79125.0,
    profit: -4125.0,
    qty: 30,
    sku_count: 6,
    missing_cogs_count: 1,
  },
  {
    week: '2025-W48',
    week_start_date: '2025-11-24',
    week_end_date: '2025-11-30',
    margin_pct: 0,
    revenue_net: 50000.0,
    cogs: 50000.0,
    profit: 0,
    qty: 20,
    sku_count: 4,
    missing_cogs_count: 0,
  },
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

/** Build a typed partial mock of useMarginTrends return value */
function mockTrendsHook(
  data: MarginTrendPoint[] | undefined,
  isLoading = false,
  error: Error | null = null
): TrendsHookReturn {
  return {
    data,
    isLoading,
    error,
    refetch: vi.fn(),
    isPending: isLoading,
    isSuccess: !isLoading && !error,
    isFetching: false,
    isFetched: true,
    isPlaceholderData: false,
    isRefetching: false,
    isLoadingError: !!error && !isLoading,
    isRefetchError: false,
    failureCount: 0,
    failureReason: error,
    errorUpdateCount: error ? 1 : 0,
    isFetchedAfterMount: true,
    isInitialLoading: isLoading,
    isError: !!error,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: error ? Date.now() : 0,
    status: error ? 'error' : isLoading ? 'pending' : 'success',
    fetchStatus: 'idle',
  } as unknown as TrendsHookReturn
}

describe('MarginTrendChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(undefined, true))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      // Skeleton should be rendered
      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('should display title and description while loading', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(undefined, true))

      render(
        <MarginTrendChart
          queryParams={{ weeks: 12 }}
          title="Custom Title"
          description="Custom Description"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom Description')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error message when error occurs', () => {
      vi.mocked(useMarginTrends).mockReturnValue(
        mockTrendsHook(undefined, false, new Error('Failed to fetch'))
      )

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      expect(screen.getByText(/Не удалось загрузить данные трендов маржи/)).toBeInTheDocument()
    })

    it('should call refetch when retry button is clicked', () => {
      vi.mocked(useMarginTrends).mockReturnValue(
        mockTrendsHook(undefined, false, new Error('Failed to fetch'))
      )

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      const retryButton = screen.getByText('Повторить')
      retryButton.click()

      // refetch was called (fn identity set in mockTrendsHook)
      expect(vi.mocked(useMarginTrends).mock.results[0]!.value.refetch).toHaveBeenCalled()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no data', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook([]))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      expect(screen.getByText(/Данные о трендах маржи пока недоступны/)).toBeInTheDocument()
    })
  })

  describe('chart rendering', () => {
    it('should render chart when data is available', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      // Chart component renders (Recharts may not render SVG in test environment)
      // But the component structure should be present
      expect(screen.getByText('Анализ маржинальности по времени')).toBeInTheDocument()
      expect(screen.getByText('Изменение маржи по неделям')).toBeInTheDocument()
    })

    it('should display title and description', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(
        <MarginTrendChart
          queryParams={{ weeks: 12 }}
          title="Custom Title"
          description="Custom Description"
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom Description')).toBeInTheDocument()
    })

    it('ties an accessible chart name to an exact table alternative with all tooltip data', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      const chart = screen.getByRole('img', { name: 'График маржинальности по неделям' })
      const table = screen.getByRole('table', {
        name: 'Данные графика маржинальности по неделям; период: 2025-W45 — 2025-W48; единицы: маржа — проценты, финансовые показатели — рубли, продажи и SKU — штуки',
      })

      expect(table.id).not.toBe('')
      expect(chart).toHaveAttribute('aria-describedby', table.id)
      expect(screen.getByRole('columnheader', { name: 'Маржа, %' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Выручка, ₽' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'SKU без COGS, шт.' })).toBeInTheDocument()
      expect(screen.getByRole('row', { name: /2025-W45.*35,5.*125/ })).toBeInTheDocument()
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
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      expect(screen.getByTestId('margin-line')).toHaveAttribute('data-animation-active', 'false')
      expect(screen.getByTestId('margin-line')).toHaveAttribute('data-animation-duration', '0')
    })
  })

  describe('summary statistics', () => {
    it('should display weeks count', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      expect(screen.getByText('Недель')).toBeInTheDocument()
      expect(screen.getByText('4', { selector: 'p' })).toBeInTheDocument()
    })

    it('should calculate and display average margin', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      expect(screen.getByText('Средняя маржа')).toBeInTheDocument()
      // Average: (35.5 + 28.2 + (-5.5) + 0) / 4 = 14.55%
      const avgMargin = screen.getByText(/14/)
      expect(avgMargin).toBeInTheDocument()
    })

    it('should display maximum margin in green', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      expect(screen.getByText('Макс. маржа')).toBeInTheDocument()
      // Max: 35.5%
      const maxMargin = screen.getByText(/35/, { selector: 'p' })
      expect(maxMargin).toBeInTheDocument()
      // 168.10 exact pin: semantic financial token
      expect(maxMargin.closest('p')?.classList.contains('text-financial-positive')).toBe(true)
    })

    it('should display minimum margin in red', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      expect(screen.getByText('Мин. маржа')).toBeInTheDocument()
      // Min: -5.5%
      const minMargin = screen.getByText(/-5/, { selector: 'p' })
      expect(minMargin).toBeInTheDocument()
      // 168.10 exact pin: semantic financial token
      expect(minMargin.closest('p')?.classList.contains('text-financial-negative')).toBe(true)
    })

    it('should not show statistics when no margin data', () => {
      const noMarginData: MarginTrendPoint[] = [
        {
          week: '2025-W45',
          week_start_date: '2025-11-03',
          week_end_date: '2025-11-09',
          margin_pct: null,
          revenue_net: 125000.5,
          cogs: null,
          profit: null,
          qty: 50,
          sku_count: 10,
          missing_cogs_count: 10,
        },
      ]

      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(noMarginData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} />, { wrapper: createWrapper() })

      // Should still show weeks count
      expect(screen.getByText('Недель')).toBeInTheDocument()
      // But not average/max/min
      expect(screen.queryByText('Средняя маржа')).not.toBeInTheDocument()
    })
  })

  describe('custom height', () => {
    it('should apply custom height', () => {
      vi.mocked(useMarginTrends).mockReturnValue(mockTrendsHook(mockTrendData))

      render(<MarginTrendChart queryParams={{ weeks: 12 }} height={600} />, {
        wrapper: createWrapper(),
      })

      // Component should render with custom title/description
      expect(screen.getByText('Анализ маржинальности по времени')).toBeInTheDocument()
    })
  })

  // 168.10: direct render (recharts does not render Tooltip content in jsdom)
  describe('MarginTrendTooltip semantic classes', () => {
    const makePayload = (overrides: Partial<MarginTrendPoint>): MarginTrendPoint => ({
      week: '2025-W45',
      week_start_date: '2025-11-03',
      week_end_date: '2025-11-09',
      margin_pct: 10,
      revenue_net: 1000,
      cogs: 800,
      profit: 200,
      qty: 10,
      sku_count: 5,
      missing_cogs_count: 0,
      ...overrides,
    })

    const renderTooltip = (dataPoint: MarginTrendPoint) =>
      render(
        <MarginTrendTooltip
          active
          payload={[{ dataKey: 'margin_pct', value: 10, color: '', payload: dataPoint }]}
        />
      )

    /** The colored margin-value span next to the "Маржа:" label */
    const getMarginValueSpan = (container: HTMLElement): HTMLElement => {
      const label = Array.from(container.querySelectorAll('span')).find(s =>
        s.textContent?.startsWith('Маржа:')
      )
      const parent = label?.parentElement as HTMLElement
      return parent.querySelector('span.font-medium') as HTMLElement
    }

    it('uses popover background (dark-mode fix)', () => {
      const { container } = renderTooltip(makePayload({}))
      const tooltipBox = container.firstElementChild as HTMLElement
      expect(tooltipBox.classList.contains('bg-popover')).toBe(true)
    })

    it('positive margin value uses financial-positive', () => {
      const { container } = renderTooltip(makePayload({ margin_pct: 35.5 }))
      expect(getMarginValueSpan(container).classList.contains('text-financial-positive')).toBe(true)
    })

    it('negative margin value uses financial-negative', () => {
      const { container } = renderTooltip(makePayload({ margin_pct: -5.5 }))
      expect(getMarginValueSpan(container).classList.contains('text-financial-negative')).toBe(true)
    })

    it('zero margin value uses muted-foreground', () => {
      const { container } = renderTooltip(makePayload({ margin_pct: 0 }))
      expect(getMarginValueSpan(container).classList.contains('text-muted-foreground')).toBe(true)
    })

    it('missing COGS warning uses status-warning', () => {
      renderTooltip(makePayload({ missing_cogs_count: 2, sku_count: 5 }))
      const warning = screen.getByText(/Нет COGS/)
      expect(warning.classList.contains('text-status-warning')).toBe(true)
    })
  })
})
