/**
 * Unit Tests for Margin Analysis by Time Period Page
 * Story 4.7: Margin Analysis by Time Period
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import MarginAnalysisByTimePeriodPage from '../page'

const mockUseMarginTrends = vi.fn()

vi.mock('@/hooks/useMarginTrends', () => ({
  useMarginTrends: (...args: unknown[]) => mockUseMarginTrends(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/time-period',
}))

vi.mock('@/components/custom/MarginTrendChart', () => ({
  MarginTrendChart: ({ queryParams, title }: { queryParams: { weeks: number }; title: string }) => (
    <div data-testid="margin-trend-chart" data-weeks={queryParams.weeks} data-title={title}>
      MarginTrendChart
    </div>
  ),
}))

function okTrends() {
  return {
    data: [
      {
        week: '2025-W40',
        margin_pct: 15.2,
        revenue: 100000,
        cogs: 84800,
        profit: 15200,
        units_sold: 10,
      },
      {
        week: '2025-W41',
        margin_pct: 18.5,
        revenue: 120000,
        cogs: 97800,
        profit: 22200,
        units_sold: 12,
      },
    ],
    isLoading: false,
    error: null,
  }
}

function renderPage() {
  return renderWithProviders(<MarginAnalysisByTimePeriodPage />)
}

describe('MarginAnalysisByTimePeriodPage - Page Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue(okTrends())
  })

  it('renders h1 title', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Анализ маржинальности по времени/, level: 1 })
    ).toBeInTheDocument()
  })

  it('renders subtitle description', () => {
    renderPage()
    expect(
      screen.getByText(/Отслеживайте изменения маржинальности и прибыльности во времени/)
    ).toBeInTheDocument()
  })

  it('renders navigation links to SKU, brand, category analytics', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /По SKU/ })).toHaveAttribute('href', '/analytics/sku')
    expect(screen.getByRole('link', { name: /По брендам/ })).toHaveAttribute(
      'href',
      '/analytics/brand'
    )
    expect(screen.getByRole('link', { name: /По категориям/ })).toHaveAttribute(
      'href',
      '/analytics/category'
    )
  })
})

describe('MarginAnalysisByTimePeriodPage - Info Alert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue(okTrends())
  })

  it('renders info alert about chart data', () => {
    renderPage()
    expect(
      screen.getByText(/График показывает изменение маржинальности по неделям/)
    ).toBeInTheDocument()
  })

  it('renders alert with Info icon', () => {
    renderPage()
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
  })
})

describe('MarginAnalysisByTimePeriodPage - Time Period Selector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue(okTrends())
  })

  it('renders period selector card', () => {
    renderPage()
    expect(screen.getByText('Период анализа')).toBeInTheDocument()
  })

  it('renders period selector description', () => {
    renderPage()
    expect(
      screen.getByText('Выберите временной период для отображения трендов')
    ).toBeInTheDocument()
  })

  it('renders label for time period select', () => {
    renderPage()
    expect(screen.getByText('Показать данные за:')).toBeInTheDocument()
  })

  it('renders select trigger with placeholder', () => {
    renderPage()
    expect(screen.getByText('12 недель (3 месяца)')).toBeInTheDocument()
  })
})

describe('MarginAnalysisByTimePeriodPage - Margin Trend Chart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue(okTrends())
  })

  it('renders MarginTrendChart component', () => {
    renderPage()
    expect(screen.getByTestId('margin-trend-chart')).toBeInTheDocument()
  })

  it('passes default 12 weeks to chart', () => {
    renderPage()
    expect(screen.getByTestId('margin-trend-chart')).toHaveAttribute('data-weeks', '12')
  })

  it('passes title to chart', () => {
    renderPage()
    expect(screen.getByTestId('margin-trend-chart')).toHaveAttribute(
      'data-title',
      'Динамика маржинальности'
    )
  })
})

describe('MarginAnalysisByTimePeriodPage - Help Card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue(okTrends())
  })

  it('renders help card header', () => {
    renderPage()
    expect(screen.getByText('Как читать график')).toBeInTheDocument()
  })

  it('renders axis X description', () => {
    renderPage()
    expect(screen.getByText(/Ось X \(горизонтальная\)/)).toBeInTheDocument()
  })

  it('renders axis Y description', () => {
    renderPage()
    expect(screen.getByText(/Ось Y \(вертикальная\)/)).toBeInTheDocument()
  })

  it('renders color legend - green for profit', () => {
    renderPage()
    expect(screen.getByText(/Зелёные точки/)).toBeInTheDocument()
  })

  it('renders color legend - red for loss', () => {
    renderPage()
    expect(screen.getByText(/Красные точки/)).toBeInTheDocument()
  })

  it('renders color legend - gray for breakeven', () => {
    renderPage()
    expect(screen.getByText(/Серые точки/)).toBeInTheDocument()
  })

  it('renders interactivity description', () => {
    renderPage()
    expect(screen.getByText('Интерактивность:')).toBeInTheDocument()
  })

  it('renders statistics description', () => {
    renderPage()
    expect(screen.getByText('Статистика:')).toBeInTheDocument()
  })

  it('renders formula code block', () => {
    renderPage()
    expect(screen.getByText(/Выручка - COGS/)).toBeInTheDocument()
  })

  it('renders COGS note', () => {
    renderPage()
    expect(
      screen.getByText(/Для расчёта маржи необходимы данные о себестоимости/)
    ).toBeInTheDocument()
  })
})

describe('MarginAnalysisByTimePeriodPage - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue({ data: null, isLoading: true, error: null })
  })

  it('renders page header during loading', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Анализ маржинальности по времени/ })
    ).toBeInTheDocument()
  })

  it('renders chart component during loading (handles internally)', () => {
    renderPage()
    expect(screen.getByTestId('margin-trend-chart')).toBeInTheDocument()
  })

  it('renders help card during loading', () => {
    renderPage()
    expect(screen.getByText('Как читать график')).toBeInTheDocument()
  })
})

describe('MarginAnalysisByTimePeriodPage - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Не удалось загрузить данные'),
    })
  })

  it('renders page header on error', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Анализ маржинальности по времени/ })
    ).toBeInTheDocument()
  })

  it('renders chart component on error (handles error internally)', () => {
    renderPage()
    expect(screen.getByTestId('margin-trend-chart')).toBeInTheDocument()
  })

  it('retains info alert on error', () => {
    renderPage()
    expect(screen.getByText(/График показывает изменение маржинальности/)).toBeInTheDocument()
  })
})

describe('MarginAnalysisByTimePeriodPage - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue({ data: [], isLoading: false, error: null })
  })

  it('renders page with empty chart data', () => {
    renderPage()
    expect(screen.getByTestId('margin-trend-chart')).toBeInTheDocument()
  })

  it('retains help card with empty data', () => {
    renderPage()
    expect(screen.getByText('Как читать график')).toBeInTheDocument()
  })
})

describe('MarginAnalysisByTimePeriodPage - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue(okTrends())
  })

  it('has proper heading hierarchy (single h1)', () => {
    renderPage()
    const headings = screen.getAllByRole('heading')
    const h1s = headings.filter(h => h.tagName === 'H1')
    expect(h1s).toHaveLength(1)
  })

  it('has label associated with time period select', () => {
    renderPage()
    const label = screen.getByText('Показать данные за:')
    expect(label).toBeInTheDocument()
  })

  it('navigation links are accessible', () => {
    renderPage()
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(3)
  })
})

describe('MarginAnalysisByTimePeriodPage - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginTrends.mockReturnValue(okTrends())
  })

  it('renders complete page: header + alert + selector + chart + help', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByTestId('margin-trend-chart')).toBeInTheDocument()
    expect(screen.getByText('Как читать график')).toBeInTheDocument()
  })

  it('unmounts without errors', () => {
    const { unmount } = renderPage()
    expect(() => unmount()).not.toThrow()
  })

  it('recovers from error on rerender', () => {
    mockUseMarginTrends.mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: new Error('API Error'),
    })
    const { rerender } = renderPage()
    mockUseMarginTrends.mockReturnValue(okTrends())
    rerender(<MarginAnalysisByTimePeriodPage />)
    expect(screen.getByTestId('margin-trend-chart')).toBeInTheDocument()
  })
})
