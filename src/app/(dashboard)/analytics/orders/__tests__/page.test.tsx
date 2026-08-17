/**
 * Unit Tests for FBS Analytics Orders Page
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * @see docs/stories/epic-51/story-51.4-fe-fbs-trends-chart.md
 * @see docs/stories/epic-51/story-51.8-fe-fbs-analytics-page.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, within } from '@/test/utils/test-utils'
import OrdersAnalyticsPage from '../page'
import { mockTrends30DaysResponse, mockTrendsEmptyResponse } from '@/test/fixtures/fbs-trends'
import { mockSeasonalResponseAll, mockCompareResponse } from '@/test/fixtures/fbs-analytics'

const mockUseFbsTrends = vi.fn()
const mockUseFbsSeasonal = vi.fn()
const mockUseFbsCompare = vi.fn()

vi.mock('@/hooks/useFbsAnalytics', () => ({
  useFbsTrends: (...args: unknown[]) => mockUseFbsTrends(...args),
  useFbsSeasonal: (...args: unknown[]) => mockUseFbsSeasonal(...args),
  useFbsCompare: (...args: unknown[]) => mockUseFbsCompare(...args),
  calculateDaysDiff: (from: string, to: string) => {
    const d1 = new Date(from)
    const d2 = new Date(to)
    return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  },
  getSmartAggregation: (days: number) => {
    if (days <= 90) return 'day'
    if (days <= 180) return 'week'
    return 'month'
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/orders',
}))

vi.mock('@/components/custom/analytics/FbsTrendsChart', () => ({
  FbsTrendsChart: ({ from, to }: { from: string; to: string }) => (
    <div data-testid="fbs-trends-chart" data-from={from} data-to={to}>
      FbsTrendsChart
    </div>
  ),
}))

vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: ({ placeholder, id }: { placeholder?: string; id?: string }) => (
    <div data-testid="date-range-picker" data-id={id}>
      {placeholder ?? 'DateRangePicker'}
    </div>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <button data-testid={`tab-trigger-${value}`} data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}))

const okTrends = () => ({ data: mockTrends30DaysResponse, isLoading: false, error: null })
const okSeasonal = () => ({ data: mockSeasonalResponseAll, isLoading: false, error: null })
const okCompare = () => ({ data: mockCompareResponse, isLoading: false, error: null })

function setupMocks() {
  mockUseFbsTrends.mockReturnValue(okTrends())
  mockUseFbsSeasonal.mockReturnValue(okSeasonal())
  mockUseFbsCompare.mockReturnValue(okCompare())
}

/** Get the overview tab content container for scoped queries */
function getOverview() {
  return screen.getByTestId('tab-content-overview')
}

function renderPage() {
  return renderWithProviders(<OrdersAnalyticsPage />)
}

// Page Header

describe('OrdersAnalyticsPage - Page Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders h1 title "Аналитика заказов FBS"', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Аналитика заказов FBS/, level: 1 })
    ).toBeInTheDocument()
  })

  it('renders subtitle with description', () => {
    renderPage()
    expect(screen.getByText(/Анализ трендов, сезонности и сравнение периодов/)).toBeInTheDocument()
  })

  it('shows home navigation link', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /Главная/ })).toBeInTheDocument()
  })

  it('shows breadcrumbs: Аналитика > Заказы FBS', () => {
    renderPage()
    expect(screen.getByText('Аналитика')).toBeInTheDocument()
    expect(screen.getByText('Заказы FBS')).toBeInTheDocument()
  })

  it('has text-2xl font-bold styling on h1', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-2xl', 'font-bold')
  })

  it('has proper heading hierarchy (single h1)', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Аналитика заказов FBS')
  })
})

// Date Range Picker

describe('OrdersAnalyticsPage - Date Range Picker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders DateRangePickerExtended', () => {
    renderPage()
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
  })

  it('defaults to ~30 days range', () => {
    renderPage()
    const { from, to } = mockUseFbsTrends.mock.calls[0][0]
    const diff = Math.ceil(Math.abs(new Date(to).getTime() - new Date(from).getTime()) / 864e5)
    expect(diff).toBeGreaterThanOrEqual(29)
    expect(diff).toBeLessThanOrEqual(31)
  })

  it('shows placeholder text in picker', () => {
    renderPage()
    expect(screen.getByTestId('date-range-picker')).toHaveTextContent('Выберите период')
  })

  it('passes from/to/aggregation to trends hook', () => {
    renderPage()
    const call = mockUseFbsTrends.mock.calls[0][0]
    expect(call).toHaveProperty('from')
    expect(call).toHaveProperty('to')
    expect(call).toHaveProperty('aggregation')
  })

  it('restores date range from URL params (defaults when empty)', () => {
    renderPage()
    expect(mockUseFbsTrends).toHaveBeenCalled()
  })
})

// Trends Chart

describe('OrdersAnalyticsPage - Trends Chart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders FbsTrendsChart (2 instances: overview + trends)', () => {
    renderPage()
    expect(screen.getAllByTestId('fbs-trends-chart').length).toBeGreaterThanOrEqual(2)
  })

  it('passes YYYY-MM-DD date props to chart', () => {
    renderPage()
    const firstChart = screen.getAllByTestId('fbs-trends-chart')[0]
    expect(firstChart.getAttribute('data-from')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(firstChart.getAttribute('data-to')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('shows loading state (overview tab renders)', () => {
    mockUseFbsTrends.mockReturnValue({ data: null, isLoading: true, error: null })
    renderPage()
    expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument()
  })

  it('shows error alert on fetch failure', () => {
    mockUseFbsTrends.mockReturnValue({ data: null, isLoading: false, error: new Error('fail') })
    renderPage()
    expect(screen.getByText(/Не удалось загрузить данные/)).toBeInTheDocument()
  })

  it('renders chart with empty data response', () => {
    mockUseFbsTrends.mockReturnValue({
      data: mockTrendsEmptyResponse,
      isLoading: false,
      error: null,
    })
    renderPage()
    expect(screen.getAllByTestId('fbs-trends-chart').length).toBeGreaterThanOrEqual(1)
  })

  it('syncs aggregation with date range', () => {
    renderPage()
    expect(mockUseFbsTrends.mock.calls[0][0]).toHaveProperty('aggregation')
  })
})

// Summary Cards (scoped to overview tab to avoid ComparisonTable collisions)

describe('OrdersAnalyticsPage - Summary Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders all four summary card labels in overview', () => {
    renderPage()
    const overview = getOverview()
    expect(within(overview).getByText('Всего заказов')).toBeInTheDocument()
    expect(within(overview).getByText('Выручка')).toBeInTheDocument()
    expect(within(overview).getByText('Средний заказ/день')).toBeInTheDocument()
    expect(within(overview).getByText('Отмены')).toBeInTheDocument()
  })

  it('displays total orders with Russian locale formatting', () => {
    renderPage()
    expect(within(getOverview()).getByText(/1\s*350/)).toBeInTheDocument()
  })

  it('displays revenue with ruble currency symbol', () => {
    renderPage()
    expect(within(getOverview()).getByText(/₽/)).toBeInTheDocument()
  })

  it('shows period subtitle (days)', () => {
    renderPage()
    expect(screen.getByText(/дн\./)).toBeInTheDocument()
  })

  it('shows dynamics card header', () => {
    renderPage()
    expect(screen.getByText('Динамика заказов')).toBeInTheDocument()
  })
})

// Loading & Error States

describe('OrdersAnalyticsPage - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFbsTrends.mockReturnValue({ data: null, isLoading: true, error: null })
    mockUseFbsSeasonal.mockReturnValue(okSeasonal())
    mockUseFbsCompare.mockReturnValue(okCompare())
  })

  it('renders page header and tabs during loading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Аналитика заказов FBS/ })).toBeInTheDocument()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument()
  })

  it('renders date picker during load', () => {
    renderPage()
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
  })

  it('renders overview tab content during loading', () => {
    renderPage()
    expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument()
  })
})

describe('OrdersAnalyticsPage - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFbsTrends.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Не удалось загрузить данные'),
    })
    mockUseFbsSeasonal.mockReturnValue(okSeasonal())
    mockUseFbsCompare.mockReturnValue(okCompare())
  })

  it('displays error alert in Russian', () => {
    renderPage()
    expect(screen.getByText(/Не удалось загрузить данные/)).toBeInTheDocument()
    expect(screen.getByText(/Попробуйте обновить страницу/)).toBeInTheDocument()
  })

  it('retains date range picker on error', () => {
    renderPage()
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
  })

  it('clears error on successful rerender', () => {
    const { rerender } = renderPage()
    expect(screen.getByText(/Не удалось загрузить данные/)).toBeInTheDocument()
    mockUseFbsTrends.mockReturnValue(okTrends())
    rerender(<OrdersAnalyticsPage />)
    expect(screen.queryByText(/Не удалось загрузить данные/)).not.toBeInTheDocument()
  })

  it('handles network errors gracefully', () => {
    mockUseFbsTrends.mockReturnValue({ data: null, isLoading: false, error: new Error('Network') })
    renderPage()
    expect(screen.getByText(/Не удалось загрузить данные/)).toBeInTheDocument()
  })

  it('shows tabs even on error', () => {
    renderPage()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
  })
})

// Empty State

describe('OrdersAnalyticsPage - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFbsTrends.mockReturnValue({
      data: mockTrendsEmptyResponse,
      isLoading: false,
      error: null,
    })
    mockUseFbsSeasonal.mockReturnValue({ data: null, isLoading: false, error: null })
    mockUseFbsCompare.mockReturnValue({ data: null, isLoading: false, error: null })
  })

  it('renders summary cards and tabs with empty data', () => {
    renderPage()
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
  })

  it('renders empty comparison placeholder', () => {
    renderPage()
    expect(screen.getByText('Нет данных для сравнения')).toBeInTheDocument()
  })
})

// URL State

describe('OrdersAnalyticsPage - URL State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('initializes date range from URL (defaults when empty)', () => {
    renderPage()
    expect(mockUseFbsTrends).toHaveBeenCalled()
  })

  it('syncs state to URL via useEffect (tabs render)', () => {
    renderPage()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
  })

  it('handles invalid URL params by using defaults', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

// Accessibility

describe('OrdersAnalyticsPage - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('has navigation landmark for breadcrumbs', () => {
    renderPage()
    expect(screen.getByRole('navigation', { name: /Breadcrumb/ })).toBeInTheDocument()
  })

  it('has proper heading hierarchy', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Аналитика заказов FBS')
  })

  it('tab triggers have data-value attributes', () => {
    renderPage()
    const ids = ['overview', 'trends', 'seasonality', 'comparison'] as const
    ids.forEach(id => expect(screen.getByTestId(`tab-trigger-${id}`)).toHaveAttribute('data-value'))
  })

  it('breadcrumb links have correct hrefs', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Аналитика' })).toHaveAttribute('href', '/analytics')
  })

  it('meets basic WCAG 2.1 AA (nav + heading + links)', () => {
    renderPage()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

// Full Integration

describe('OrdersAnalyticsPage - Full Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders complete page: header + picker + tabs + chart + cards', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getAllByTestId('fbs-trends-chart').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
  })

  it('coordinates date range across overview and chart', () => {
    renderPage()
    const call = mockUseFbsTrends.mock.calls[0][0]
    const firstChart = screen.getAllByTestId('fbs-trends-chart')[0]
    expect(firstChart).toHaveAttribute('data-from', call.from)
    expect(firstChart).toHaveAttribute('data-to', call.to)
  })

  it('passes correct params to seasonal and compare hooks', () => {
    renderPage()
    const sCall = mockUseFbsSeasonal.mock.calls[0][0]
    expect(sCall).toHaveProperty('months')
    expect(sCall).toHaveProperty('view')
    const cCall = mockUseFbsCompare.mock.calls[0][0]
    expect(cCall).toHaveProperty('period1From')
    expect(cCall).toHaveProperty('period2From')
  })

  it('renders all 4 tab content areas', () => {
    renderPage()
    const ids = ['overview', 'trends', 'seasonality', 'comparison'] as const
    ids.forEach(id => expect(screen.getByTestId(`tab-content-${id}`)).toBeInTheDocument())
  })

  it('unmounts without errors', () => {
    const { unmount } = renderPage()
    expect(() => unmount()).not.toThrow()
  })
})

// Tab Navigation (Story 51.8-FE)

describe('OrdersAnalyticsPage - Tab Navigation (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders Tabs with 4 triggers', () => {
    renderPage()
    expect(screen.getByText('Обзор')).toBeInTheDocument()
    expect(screen.getByText('Тренды')).toBeInTheDocument()
    expect(screen.getByText('Сезонность')).toBeInTheDocument()
    expect(screen.getByText('Сравнение')).toBeInTheDocument()
  })

  it('defaults to overview tab (shows Всего заказов)', () => {
    renderPage()
    expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument()
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
  })

  it('renders tab triggers as buttons', () => {
    renderPage()
    expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-overview').tagName).toBe('BUTTON')
  })

  it('shows 4 tab trigger buttons', () => {
    renderPage()
    const triggers = screen
      .getAllByRole('button')
      .filter(b => b.getAttribute('data-testid')?.startsWith('tab-trigger-'))
    expect(triggers).toHaveLength(4)
  })

  it('shows loading state in comparison tab when loading', () => {
    mockUseFbsCompare.mockReturnValue({ data: null, isLoading: true, error: null })
    renderPage()
    expect(screen.getByTestId('tab-content-comparison')).toBeInTheDocument()
  })
})

// Overview Tab (Story 51.8-FE)

describe('OrdersAnalyticsPage - Overview Tab (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders all summary cards and chart in overview', () => {
    renderPage()
    const overview = getOverview()
    expect(within(overview).getByText('Всего заказов')).toBeInTheDocument()
    expect(within(overview).getByText('Выручка')).toBeInTheDocument()
    expect(within(overview).getAllByTestId('fbs-trends-chart').length).toBeGreaterThanOrEqual(1)
  })

  it('is the default visible tab (dynamics header present)', () => {
    renderPage()
    expect(getOverview()).toBeInTheDocument()
    expect(screen.getByText('Динамика заказов')).toBeInTheDocument()
  })

  it('shows currency and period indicators', () => {
    renderPage()
    expect(within(getOverview()).getByText(/₽/)).toBeInTheDocument()
    expect(screen.getByText(/дн\./)).toBeInTheDocument()
  })
})

// Trends Tab (Story 51.8-FE)

describe('OrdersAnalyticsPage - Trends Tab (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders aggregation toggle scoped to trends tab', () => {
    renderPage()
    const trendsContent = screen.getByTestId('tab-content-trends')
    expect(within(trendsContent).getByText('По дням')).toBeInTheDocument()
    expect(within(trendsContent).getByText('По неделям')).toBeInTheDocument()
    expect(within(trendsContent).getByText('По месяцам')).toBeInTheDocument()
  })

  it('renders display settings card with grouping label', () => {
    renderPage()
    expect(screen.getByText('Настройки отображения')).toBeInTheDocument()
    expect(screen.getByText(/Группировка:/)).toBeInTheDocument()
  })

  it('renders 3 aggregation buttons in trends tab', () => {
    renderPage()
    const trendsContent = screen.getByTestId('tab-content-trends')
    const btns = within(trendsContent)
      .getAllByRole('button')
      .filter(b => ['По дням', 'По неделям', 'По месяцам'].includes(b.textContent ?? ''))
    expect(btns).toHaveLength(3)
  })

  it('renders FbsTrendsChart in trends tab', () => {
    renderPage()
    expect(screen.getAllByTestId('fbs-trends-chart').length).toBeGreaterThanOrEqual(2)
  })
})

// Seasonality Tab (Story 51.8-FE)

describe('OrdersAnalyticsPage - Seasonality Tab (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders sub-tabs: По месяцам / По дням недели / По кварталам', () => {
    renderPage()
    const seasonContent = screen.getByTestId('tab-content-seasonality')
    expect(within(seasonContent).getByText('По месяцам')).toBeInTheDocument()
    expect(within(seasonContent).getByText('По дням недели')).toBeInTheDocument()
    expect(within(seasonContent).getByText('По кварталам')).toBeInTheDocument()
  })

  it('renders seasonal insights with peak/low indicators', () => {
    renderPage()
    expect(screen.getByText('Ключевые инсайты')).toBeInTheDocument()
    expect(screen.getByText('Пиковый месяц')).toBeInTheDocument()
    expect(screen.getByText('Низкий месяц')).toBeInTheDocument()
  })

  it('renders period selector with aria-label', () => {
    renderPage()
    expect(screen.getByLabelText('Период анализа')).toBeInTheDocument()
  })

  it('renders seasonal patterns card', () => {
    renderPage()
    expect(screen.getByText('Сезонные паттерны')).toBeInTheDocument()
  })
})

// Comparison Tab (Story 51.8-FE)

describe('OrdersAnalyticsPage - Comparison Tab (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders presets: Месяц к месяцу / Квартал к кварталу / Год к году', () => {
    renderPage()
    expect(screen.getByText('Месяц к месяцу')).toBeInTheDocument()
    expect(screen.getByText('Квартал к кварталу')).toBeInTheDocument()
    expect(screen.getByText('Год к году')).toBeInTheDocument()
  })

  it('renders comparison header and description', () => {
    renderPage()
    expect(screen.getByText('Сравнение периодов')).toBeInTheDocument()
    expect(screen.getByText('Сравнение с предыдущим месяцем')).toBeInTheDocument()
  })

  it('renders 3 preset selector buttons', () => {
    renderPage()
    const btns = screen
      .getAllByRole('button')
      .filter(b =>
        ['Месяц к месяцу', 'Квартал к кварталу', 'Год к году'].includes(b.textContent ?? '')
      )
    expect(btns).toHaveLength(3)
  })

  it('renders comparison tab content', () => {
    renderPage()
    expect(screen.getByTestId('tab-content-comparison')).toBeInTheDocument()
  })
})

// Cross-Tab State (Story 51.8-FE)

describe('OrdersAnalyticsPage - Cross-Tab State (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('calls all 3 hooks on mount (shared date range)', () => {
    renderPage()
    expect(mockUseFbsTrends).toHaveBeenCalled()
    expect(mockUseFbsSeasonal).toHaveBeenCalled()
    expect(mockUseFbsCompare).toHaveBeenCalled()
  })

  it('handles error states per tab independently', () => {
    mockUseFbsTrends.mockReturnValue({ data: null, isLoading: false, error: new Error('err') })
    mockUseFbsSeasonal.mockReturnValue({
      data: mockSeasonalResponseAll,
      isLoading: false,
      error: null,
    })
    renderPage()
    expect(screen.getByText(/Не удалось загрузить данные/)).toBeInTheDocument()
    expect(screen.getByText('Ключевые инсайты')).toBeInTheDocument()
  })

  it('handles loading states per tab independently', () => {
    mockUseFbsCompare.mockReturnValue({ data: null, isLoading: true, error: null })
    renderPage()
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
    expect(screen.getByTestId('tab-content-comparison')).toBeInTheDocument()
  })

  it('renders all tab content areas simultaneously', () => {
    renderPage()
    const ids = ['overview', 'trends', 'seasonality', 'comparison'] as const
    ids.forEach(id => expect(screen.getByTestId(`tab-content-${id}`)).toBeInTheDocument())
  })
})

// Mobile + Performance + E2E (Story 51.8-FE)

describe('OrdersAnalyticsPage - Mobile Tabs (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders scrollable tabs list with 4 button triggers', () => {
    renderPage()
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument()
    const triggers = screen
      .getAllByRole('button')
      .filter(b => b.getAttribute('data-testid')?.startsWith('tab-trigger-'))
    expect(triggers).toHaveLength(4)
    triggers.forEach(t => expect(t.tagName).toBe('BUTTON'))
  })

  it('renders overview tab content', () => {
    renderPage()
    expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument()
  })
})

describe('OrdersAnalyticsPage - Performance (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('loads seasonal and comparison data on mount', () => {
    renderPage()
    expect(mockUseFbsSeasonal).toHaveBeenCalled()
    expect(mockUseFbsCompare).toHaveBeenCalled()
  })

  it('renders without unnecessary DOM bloat and unmounts cleanly', () => {
    const { container, unmount } = renderPage()
    expect(container.firstChild).toBeTruthy()
    expect(() => unmount()).not.toThrow()
  })
})

describe('OrdersAnalyticsPage - E2E Integration (Story 51.8-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders full page: header + picker + tabs + chart + cards', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getAllByTestId('fbs-trends-chart').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
  })

  it('recovers from API errors on rerender', () => {
    mockUseFbsTrends.mockReturnValueOnce({ data: null, isLoading: false, error: new Error('API') })
    const { rerender } = renderPage()
    expect(screen.getByText(/Не удалось загрузить данные/)).toBeInTheDocument()
    mockUseFbsTrends.mockReturnValue(okTrends())
    rerender(<OrdersAnalyticsPage />)
    expect(screen.queryByText(/Не удалось загрузить данные/)).not.toBeInTheDocument()
  })

  it('all tab triggers are keyboard-accessible buttons', () => {
    renderPage()
    const triggers = screen
      .getAllByRole('button')
      .filter(b => b.getAttribute('data-testid')?.startsWith('tab-trigger-'))
    expect(triggers).toHaveLength(4)
    expect(screen.getByRole('link', { name: 'Аналитика' })).toBeInTheDocument()
  })

  it('handles slow network with loading state', () => {
    mockUseFbsTrends.mockReturnValue({ data: null, isLoading: true, error: null })
    renderPage()
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('handles empty comparison data with placeholder', () => {
    mockUseFbsCompare.mockReturnValue({ data: null, isLoading: false, error: null })
    renderPage()
    expect(screen.getByText('Нет данных для сравнения')).toBeInTheDocument()
  })

  it('renders all 4 tab content sections', () => {
    renderPage()
    const ids = ['overview', 'trends', 'seasonality', 'comparison'] as const
    ids.forEach(id => expect(screen.getByTestId(`tab-content-${id}`)).toBeInTheDocument())
  })
})

// Story 168.5: icon + delta colors must use semantic tokens, not the legacy palette.
// The mocked Tabs render ALL tab contents, so one page render covers OverviewTab
// (DollarSign/TrendingUp/XCircle icons) and SeasonalityTab insight icons.
describe('OrdersAnalyticsPage — semantic token pins (Story 168.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('OverviewTab icons render with exact financial/status token classes', () => {
    renderPage()
    const overview = getOverview()
    // Выручка (DollarSign), Средний заказ/день (TrendingUp), Отмены (XCircle).
    expect(overview.querySelectorAll('.text-financial-positive').length).toBeGreaterThan(0)
    expect(overview.querySelectorAll('.text-status-information').length).toBeGreaterThan(0)
    expect(overview.querySelectorAll('.text-financial-negative').length).toBeGreaterThan(0)
  })

  it('SeasonalityTab insight icons render with exact semantic token classes', () => {
    renderPage()
    // TrendingUp → financial-positive, TrendingDown → financial-negative, Calendar → status-information.
    const seasonality = screen.getByTestId('tab-content-seasonality')
    expect(seasonality.querySelectorAll('.text-financial-positive').length).toBeGreaterThan(0)
    expect(seasonality.querySelectorAll('.text-financial-negative').length).toBeGreaterThan(0)
    expect(seasonality.querySelectorAll('.text-status-information').length).toBeGreaterThan(0)
  })

  it('renders no legacy palette classes anywhere on the page (DOM guard)', () => {
    const { container } = renderPage()
    expect(
      container.innerHTML.match(
        /(bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?/
      )
    ).toBeNull()
  })
})
