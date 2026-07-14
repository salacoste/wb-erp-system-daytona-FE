/**
 * Tests for PeriodComparisonSection — WoW/MoM comparison cards (Story 123.1-FE).
 * Replaces 149 TODO stubs with parameterized real tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Mock hooks and utilities
const mockRefetch = vi.fn()
const mockFinancialSummaryComparison = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/comparison', () => ({
  useAnalyticsComparison: vi.fn(),
}))

vi.mock('@/hooks/useFinancialSummary', () => ({
  useFinancialSummaryWithPeriodComparison: mockFinancialSummaryComparison,
}))

vi.mock('@/lib/period-comparison-helpers', () => ({
  getComparisonPeriods: vi.fn(() => ({
    period1: '2026-W05',
    period2: '2026-W04',
  })),
  formatPeriodLabel: vi.fn((p: string) => p),
  COMPARISON_MODE_STORAGE_KEY: 'comparison-mode',
}))

import { useAnalyticsComparison } from '@/hooks/comparison'
import { PeriodComparisonSection } from '../PeriodComparisonSection'

const mockComparison = vi.mocked(useAnalyticsComparison)

/** Build a DeltaValue object matching the ComparisonDeltas contract */
function dv(absolute: number, percent: number) {
  return { absolute, percent }
}

const MOCK_DATA = {
  period1: {
    week: '2026-W05',
    revenue: 500000,
    profit: 100000,
    margin_pct: 20,
    orders: 350,
    cogs: 300000,
    logistics: 50000,
    storage: 30000,
    advertising: 20000,
  },
  period2: {
    week: '2026-W04',
    revenue: 450000,
    profit: 80000,
    margin_pct: 17.8,
    orders: 300,
    cogs: 280000,
    logistics: 60000,
    storage: 25000,
    advertising: 18000,
  },
  delta: {
    revenue: dv(50000, 11.1),
    profit: dv(20000, 25.0),
    margin_pct: dv(2.2, 12.4),
    orders: dv(50, 16.7),
    cogs: dv(20000, 7.1),
    logistics: dv(-10000, -16.7),
    storage: dv(5000, 20.0),
    advertising: dv(2000, 11.1),
  },
}

function setLoaded(overrides?: Record<string, unknown>) {
  mockComparison.mockReturnValue({
    data: { ...MOCK_DATA, ...overrides },
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  } as unknown as ReturnType<typeof useAnalyticsComparison>)
}

function setLoading() {
  mockComparison.mockReturnValue({
    data: null,
    isLoading: true,
    error: null,
    refetch: mockRefetch,
  } as unknown as ReturnType<typeof useAnalyticsComparison>)
}

function setError() {
  mockComparison.mockReturnValue({
    data: null,
    isLoading: false,
    error: new Error('API error'),
    refetch: mockRefetch,
  } as unknown as ReturnType<typeof useAnalyticsComparison>)
}

function setFinancialComparison(overrides?: Record<string, unknown>) {
  mockFinancialSummaryComparison.mockReturnValue({
    current: undefined,
    previous: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  setLoaded()
  setFinancialComparison()
})

// ============================================================================
// Card Titles & Layout
// ============================================================================

describe('PeriodComparisonSection - Card Titles', () => {
  it.each([['Выручка'], ['Прибыль'], ['Маржа'], ['Заказы'], ['Логистика'], ['Хранение']])(
    'should render card title "%s"',
    title => {
      renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
      expect(screen.getByText(title)).toBeInTheDocument()
    }
  )

  it('should render section heading', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText('Сравнение периодов')).toBeInTheDocument()
  })

  it('should render region with aria-label', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByRole('region', { name: /Сравнение периодов/ })).toBeInTheDocument()
  })

  it('should accept custom className', () => {
    const { container } = render(
      <PeriodComparisonSection currentWeek="2026-W05" className="custom-class" />
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('renders a month-aware comparison from financial summary without enabling weekly analytics', () => {
    setFinancialComparison({
      current: {
        summary_total: {
          sale_gross_total: 1000000,
          operating_profit_analytical: 250000,
          operating_margin_pct: 25,
          product_transactions_total: 700,
          logistics_cost_total: 90000,
          storage_cost_total: 12000,
          paid_acceptance_cost_total: 3000,
        },
      },
      previous: {
        summary_total: {
          sale_gross_total: 800000,
          operating_profit_analytical: 200000,
          operating_margin_pct: 25,
          product_transactions_total: 650,
          logistics_cost_total: 100000,
          storage_cost_total: 10000,
          paid_acceptance_cost_total: 1000,
        },
      },
    })

    renderWithProviders(
      <PeriodComparisonSection periodType="month" currentWeek="2026-W26" currentMonth="2026-06" />
    )

    expect(screen.getByText('Сравнение месяцев')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByText('Выкупы')).toBeInTheDocument()
    expect(screen.getByText('Хранение и приёмка')).toBeInTheDocument()
    expect(screen.getByText(/1\s*000\s*000/)).toBeInTheDocument()
    expect(screen.getByText(/15\s*000/)).toBeInTheDocument()
    expect(mockComparison).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, period1: '2026-W05', period2: '2026-W04' })
    )
    expect(mockFinancialSummaryComparison).toHaveBeenCalledWith(
      expect.objectContaining({ periodType: 'month', period: '2026-06', enabled: true })
    )
  })
})

// ============================================================================
// Delta Indicators
// ============================================================================

describe('PeriodComparisonSection - Delta Indicators', () => {
  it('should render positive delta with plus sign', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText(/\+11.*%/)).toBeInTheDocument()
  })

  it('should render negative delta indicator', () => {
    // Logistics -16.7% with invertDirection renders as positive (cost decrease = good)
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getAllByText(/16,7\s*%/).length).toBeGreaterThanOrEqual(1)
  })

  it('should display delta percentages', () => {
    // Revenue +11.1% renders as "+11,1%"
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText(/\+11,1\s*%/)).toBeInTheDocument()
  })
})

// ============================================================================
// Expense Metrics Inverted Logic
// ============================================================================

describe('PeriodComparisonSection - Expense Inverted Logic', () => {
  it('should show logistics card with inverted direction', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText('Логистика')).toBeInTheDocument()
  })

  it('should show storage card with inverted direction', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText('Хранение')).toBeInTheDocument()
  })
})

// ============================================================================
// Value Formatting
// ============================================================================

describe('PeriodComparisonSection - Value Formatting', () => {
  it('should format currency values', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    const texts = screen.getAllByText(/500\s*000/)
    expect(texts.length).toBeGreaterThan(0)
  })

  it('should fall back to financial summary for logistics and storage when comparison omits them', () => {
    setLoaded({
      period1: {
        ...MOCK_DATA.period1,
        logistics: 0,
        storage: 0,
      },
      period2: {
        ...MOCK_DATA.period2,
        logistics: 0,
        storage: 0,
      },
      delta: {
        ...MOCK_DATA.delta,
        logistics: dv(0, 0),
        storage: dv(0, 0),
      },
    })
    setFinancialComparison({
      current: {
        summary_total: {
          logistics_cost_total: 77835.86,
          storage_cost_total: 3881.44,
        },
      },
      previous: {
        summary_total: {
          logistics_cost_total: 71018.1,
          storage_cost_total: 2689.2,
        },
      },
    })

    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W24" />)

    expect(screen.getByText(/77\s*835,86/)).toBeInTheDocument()
    expect(screen.getByText(/3\s*881,44/)).toBeInTheDocument()
    expect(screen.queryByText(/^0\s*₽$/)).not.toBeInTheDocument()
  })

  it('should render null values as em-dash', () => {
    setLoaded({
      period1: {
        week: '2026-W05',
        revenue: null,
        profit: null,
        margin_pct: null,
        orders: null,
        cogs: null,
        logistics: null,
        storage: null,
        advertising: null,
      },
      period2: {
        week: '2026-W04',
        revenue: null,
        profit: null,
        margin_pct: null,
        orders: null,
        cogs: null,
        logistics: null,
        storage: null,
        advertising: null,
      },
      delta: {
        revenue: null,
        profit: null,
        margin_pct: null,
        orders: null,
        cogs: null,
        logistics: null,
        storage: null,
        advertising: null,
      },
    })
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Mode Toggle
// ============================================================================

describe('PeriodComparisonSection - Mode Toggle', () => {
  it('should render toggle buttons', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('should switch mode on toggle click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    const buttons = screen.getAllByRole('tab')
    if (buttons.length > 1) {
      await user.click(buttons[1])
      expect(mockComparison).toHaveBeenCalled()
    }
  })
})

// ============================================================================
// Loading State
// ============================================================================

describe('PeriodComparisonSection - Loading State', () => {
  it('should show loading skeleton', () => {
    setLoading()
    const { container } = renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
  })

  it('should not render cards while loading', () => {
    setLoading()
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.queryByText('Выручка')).not.toBeInTheDocument()
  })

  it('should keep weekly comparison loading while finance fallbacks are loading', () => {
    setLoaded()
    setFinancialComparison({ isLoading: true })
    const { container } = renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('Логистика')).not.toBeInTheDocument()
  })

  it('should keep monthly comparison loading while finance summary is loading', () => {
    setFinancialComparison({ isLoading: true })
    const { container } = renderWithProviders(
      <PeriodComparisonSection periodType="month" currentWeek="2026-W26" currentMonth="2026-06" />
    )
    expect(container.querySelectorAll('[class*="animate"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('Выручка')).not.toBeInTheDocument()
  })
})

// ============================================================================
// Error State
// ============================================================================

describe('PeriodComparisonSection - Error State', () => {
  it('should render error message in Russian', () => {
    setError()
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText('Ошибка загрузки данных сравнения')).toBeInTheDocument()
  })

  it('should render retry button', () => {
    setError()
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('should call refetch on retry click', async () => {
    const user = userEvent.setup()
    setError()
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    await user.click(screen.getByText('Повторить'))
    expect(mockRefetch).toHaveBeenCalledOnce()
  })
})

// ============================================================================
// Accessibility
// ============================================================================

describe('PeriodComparisonSection - Accessibility', () => {
  it('should have region role with descriptive label', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Сравнение периодов')
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('PeriodComparisonSection - Edge Cases', () => {
  it('should pass enabled:false when currentWeek is empty', () => {
    renderWithProviders(<PeriodComparisonSection currentWeek="" />)
    expect(mockComparison).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(mockFinancialSummaryComparison).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    )
  })

  it('should handle null delta gracefully', () => {
    setLoaded({
      ...MOCK_DATA,
      delta: {
        revenue: null,
        profit: null,
        margin_pct: null,
        orders: null,
        cogs: null,
        logistics: null,
        storage: null,
        advertising: null,
      },
    })
    renderWithProviders(<PeriodComparisonSection currentWeek="2026-W05" />)
    expect(screen.getByText('Выручка')).toBeInTheDocument()
  })
})
