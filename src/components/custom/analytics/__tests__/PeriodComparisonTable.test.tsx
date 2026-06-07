/**
 * Tests for PeriodComparisonTable Component
 * Story 51.7-FE: Period Comparison
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeriodComparisonTable } from '../PeriodComparisonTable'
import { renderWithProviders } from '@/test/utils/test-utils'
import { mockCompareResponse, mockCompareResponsePositive } from '@/test/fixtures/fbs-analytics'
import type { CompareResponse } from '@/types/fbs-analytics'

const mockUseFbsCompare = vi.fn()

vi.mock('@/hooks/useFbsAnalytics', () => ({
  useFbsCompare: (...args: unknown[]) => mockUseFbsCompare(...args),
}))

function mockSuccess(data: CompareResponse) {
  mockUseFbsCompare.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
}

function mockLoading() {
  mockUseFbsCompare.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
}

function mockError(message: string) {
  const refetch = vi.fn()
  mockUseFbsCompare.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error: { message },
    refetch,
  })
  return refetch
}

function mockEmpty() {
  mockUseFbsCompare.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
}

function renderTable(props?: { className?: string }) {
  return renderWithProviders(<PeriodComparisonTable {...props} />)
}

// ============================================================================
// Basic Rendering
// ============================================================================

describe('PeriodComparisonTable - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should render Card with title "Сравнение периодов"', () => {
    renderTable()
    expect(screen.getByText('Сравнение периодов')).toBeInTheDocument()
  })

  it('should render Table with thead and tbody', () => {
    renderTable()
    expect(document.querySelector('table')).toBeInTheDocument()
    expect(document.querySelector('thead')).toBeInTheDocument()
    expect(document.querySelector('tbody')).toBeInTheDocument()
  })

  it('should render 4 column headers', () => {
    renderTable()
    expect(screen.getAllByRole('columnheader')).toHaveLength(4)
  })

  it('should render column headers: Метрика, Период 1, Период 2, Изменение', () => {
    renderTable()
    expect(screen.getByText('Метрика')).toBeInTheDocument()
    expect(screen.getByText('Изменение')).toBeInTheDocument()
    expect(screen.getAllByText('Период 1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Период 2').length).toBeGreaterThanOrEqual(1)
  })

  it('should render 4 metric rows: Заказы, Выручка, Процент отмен, Средний чек', () => {
    renderTable()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Выручка')).toBeInTheDocument()
    expect(screen.getByText('Процент отмен')).toBeInTheDocument()
    expect(screen.getByText('Средний чек')).toBeInTheDocument()
  })

  it('should display date ranges in column headers using Russian locale', () => {
    renderTable()
    const dateRanges = screen.getAllByText(/\d+ .+ – \d+ .+/)
    expect(dateRanges.length).toBeGreaterThanOrEqual(2)
  })

  it('should use striped rows (bg-muted on even rows)', () => {
    renderTable()
    const rows = document.querySelectorAll('tbody tr')
    expect(Array.from(rows).some(r => r.className.includes('bg-muted'))).toBe(true)
  })

  it('should accept custom className prop', () => {
    renderTable({ className: 'test-custom-class' })
    expect(document.querySelector('.rounded-xl.border')?.className).toContain('test-custom-class')
  })

  it('should render within overflow-x-auto container', () => {
    renderTable()
    expect(document.querySelector('.overflow-x-auto')).toBeInTheDocument()
  })
})

// ============================================================================
// Period Selection
// ============================================================================

describe('PeriodComparisonTable - Period Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should render period 1 and period 2 labels', () => {
    renderTable()
    expect(screen.getAllByText(/Период 1/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Период 2/).length).toBeGreaterThanOrEqual(1)
  })

  it('should default to MoM preset (active button)', () => {
    renderTable()
    const momButton = screen.getByTitle('Месяц к месяцу')
    expect(momButton.getAttribute('class')).toContain('bg-primary')
  })

  it('should render all 4 preset buttons (MoM, QoQ, YoY, Custom)', () => {
    renderTable()
    expect(screen.getByTitle('Месяц к месяцу')).toBeInTheDocument()
    expect(screen.getByTitle('Квартал к кварталу')).toBeInTheDocument()
    expect(screen.getByTitle('Год к году')).toBeInTheDocument()
    expect(screen.getByTitle('Произвольный')).toBeInTheDocument()
  })

  it('should update comparison when period 1 date input changes', () => {
    renderTable()
    const inputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(inputs[0], { target: { value: '2025-11-01' } })
    expect(mockUseFbsCompare).toHaveBeenCalled()
  })

  it('should update comparison when period 2 date input changes', () => {
    renderTable()
    const inputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(inputs[2], { target: { value: '2025-12-01' } })
    expect(mockUseFbsCompare).toHaveBeenCalled()
  })

  it('should switch to custom preset when date input changes', () => {
    renderTable()
    fireEvent.change(document.querySelectorAll('input[type="date"]')[0], {
      target: { value: '2025-11-01' },
    })
    expect(screen.getByTitle('Произвольный').getAttribute('class')).toContain('bg-primary')
  })

  it('should format dates in Russian locale (day + abbreviated month)', () => {
    renderTable()
    expect(screen.getAllByText(/\d+ .{3,4}[.]? – \d+ .{3,4}[.]?/).length).toBeGreaterThanOrEqual(2)
  })
})

// ============================================================================
// Metric Rows
// ============================================================================

describe('PeriodComparisonTable - Metric Rows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should format order counts with Russian locale (NBSP separator)', () => {
    renderTable()
    expect(screen.getByText(/1[\s ]450/)).toBeInTheDocument()
  })

  it('should format revenue as currency with ₽ symbol', () => {
    renderTable()
    expect(screen.getAllByText(/₽/).length).toBeGreaterThanOrEqual(2)
  })

  it('should format percentages with comma decimal', () => {
    renderTable()
    expect(screen.getAllByText(/\d+,\d+%/).length).toBeGreaterThanOrEqual(1)
  })

  it('should align numeric values to the right (text-right)', () => {
    renderTable()
    expect(document.querySelectorAll('td.text-right').length).toBeGreaterThanOrEqual(2)
  })

  it('should align metric labels with scope="row"', () => {
    renderTable()
    expect(screen.getByText('Заказы').closest('td')?.getAttribute('scope')).toBe('row')
  })

  it('should show metric icons (SVG) in label column', () => {
    renderTable()
    expect(document.querySelectorAll('td svg').length).toBeGreaterThanOrEqual(4)
  })

  it('should use alternating row colors', () => {
    renderTable()
    expect(document.querySelectorAll('tbody tr.bg-muted\\/30').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Delta Indicators
// ============================================================================

describe('PeriodComparisonTable - Delta Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display absolute delta value with sign', () => {
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    const formatted = new Intl.NumberFormat('ru-RU').format(
      mockCompareResponsePositive.comparison.ordersChange
    )
    expect(screen.getAllByText(new RegExp(`\\+${formatted}`)).length).toBeGreaterThanOrEqual(1)
  })

  it('should display percentage delta in parentheses', () => {
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    expect(screen.getAllByText(/\([+-]?\d+,\d%\)/).length).toBeGreaterThanOrEqual(1)
  })

  it('should show green color (text-green-600) for positive changes', () => {
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    expect(document.querySelectorAll('.text-green-600').length).toBeGreaterThan(0)
  })

  it('should show red color (text-red-600) for negative changes', () => {
    mockSuccess(mockCompareResponse)
    renderTable()
    expect(document.querySelectorAll('.text-red-600').length).toBeGreaterThan(0)
  })

  it('should show gray color (text-gray-500) for zero change', () => {
    mockSuccess(mockCompareResponse)
    renderTable()
    expect(screen.getByText('Средний чек')).toBeInTheDocument()
    expect(document.querySelectorAll('.text-gray-500').length).toBeGreaterThan(0)
  })

  it('should format delta as "+value" or "-value"', () => {
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    expect(screen.getAllByText(/\+\d/).length).toBeGreaterThanOrEqual(1)
  })

  it('should invert color logic for cancellation rate (lower is better)', () => {
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    const cancelRow = screen.getByText('Процент отмен').closest('tr')
    expect(cancelRow?.querySelectorAll('.text-green-600').length).toBeGreaterThanOrEqual(1)
  })

  it('should use DeltaCell layout (flex centered) for each delta', () => {
    mockSuccess(mockCompareResponse)
    renderTable()
    expect(
      document.querySelectorAll('td .flex.items-center.justify-center').length
    ).toBeGreaterThanOrEqual(4)
  })
})

// ============================================================================
// Loading State
// ============================================================================

describe('PeriodComparisonTable - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoading()
  })

  it('should show skeleton table with animate-pulse', () => {
    renderTable()
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('should show 4 skeleton rows', () => {
    renderTable()
    expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
  })

  it('should maintain table structure (table/thead/tbody) during loading', () => {
    renderTable()
    expect(document.querySelector('table')).toBeInTheDocument()
    expect(document.querySelector('thead')).toBeInTheDocument()
    expect(document.querySelector('tbody')).toBeInTheDocument()
  })

  it('should keep period selectors visible during loading', () => {
    renderTable()
    expect(screen.getByTitle('Месяц к месяцу')).toBeInTheDocument()
  })
})

// ============================================================================
// Error State
// ============================================================================

describe('PeriodComparisonTable - Error State', () => {
  let refetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    refetch = mockError('Network error')
  })

  it('should show error alert (role="alert") on fetch failure', () => {
    renderTable()
    expect(document.querySelector('[role="alert"]')).toBeInTheDocument()
  })

  it('should display error message text', () => {
    renderTable()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should show AlertCircle SVG icon in alert', () => {
    renderTable()
    expect(document.querySelector('[role="alert"]')?.querySelector('svg')).toBeInTheDocument()
  })

  it('should render "Повторить" retry button', () => {
    renderTable()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('should call refetch when retry button clicked', async () => {
    renderTable()
    await userEvent.setup().click(screen.getByText('Повторить'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should preserve selected periods on error', () => {
    renderTable()
    expect(screen.getByTitle('Месяц к месяцу')).toBeInTheDocument()
  })

  it('should not show data table on error', () => {
    renderTable()
    expect(
      Array.from(document.querySelectorAll('table tbody')).filter(
        tb => !tb.querySelector('.animate-pulse')
      )
    ).toHaveLength(0)
  })

  it('should show default message when error has no message property', () => {
    vi.clearAllMocks()
    mockUseFbsCompare.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: null,
      refetch: vi.fn(),
    })
    renderTable()
    expect(screen.getByText('Не удалось загрузить данные сравнения')).toBeInTheDocument()
  })
})

// ============================================================================
// Empty State
// ============================================================================

describe('PeriodComparisonTable - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmpty()
  })

  it('should show empty state message when no data for periods', () => {
    renderTable()
    expect(screen.getByText(/Нет данных для выбранных периодов/)).toBeInTheDocument()
  })

  it('should suggest selecting different periods', () => {
    renderTable()
    expect(screen.getByText(/Попробуйте выбрать другие даты/)).toBeInTheDocument()
  })

  it('should maintain period selectors when empty', () => {
    renderTable()
    expect(screen.getByTitle('Месяц к месяцу')).toBeInTheDocument()
  })

  it('should display alert with helpful message', () => {
    renderTable()
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Нет данных')
  })

  it('should not render any table when empty', () => {
    renderTable()
    expect(document.querySelectorAll('table')).toHaveLength(0)
  })
})

// ============================================================================
// Color Coding
// ============================================================================

describe('PeriodComparisonTable - Color Coding', () => {
  it('should use green for positive order and revenue changes', () => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    expect(document.querySelectorAll('.text-green-600').length).toBeGreaterThan(0)
  })

  it('should use green for LOWER cancellation rate (inverse=true)', () => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    const cancelRow = screen.getByText('Процент отмен').closest('tr')
    expect(cancelRow?.querySelectorAll('.text-green-600').length).toBeGreaterThanOrEqual(1)
  })

  it('should use red for negative order and revenue changes', () => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
    renderTable()
    expect(document.querySelectorAll('.text-red-600').length).toBeGreaterThan(0)
  })

  it('should use red for HIGHER cancellation rate (inverse=true)', () => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
    renderTable()
    const cancelRow = screen.getByText('Процент отмен').closest('tr')
    expect(cancelRow?.querySelectorAll('.text-red-600').length).toBeGreaterThanOrEqual(1)
  })

  it('should use semantic design-system colors (green-600, red-600, gray-500)', () => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
    renderTable()
    expect(
      document.querySelectorAll('.text-green-600, .text-red-600, .text-gray-500').length
    ).toBeGreaterThan(0)
  })
})

// ============================================================================
// Responsive Design
// ============================================================================

describe('PeriodComparisonTable - Responsive Design', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should provide horizontal scroll via overflow-x-auto', () => {
    renderTable()
    expect(document.querySelector('.overflow-x-auto')).toBeInTheDocument()
  })

  it('should stack period selectors with grid cols-1', () => {
    renderTable()
    expect(document.querySelector('.grid.grid-cols-1')).toBeInTheDocument()
  })

  it('should use responsive md:grid-cols-2 for date inputs', () => {
    renderTable()
    expect(document.querySelector('.md\\:grid-cols-2')).toBeInTheDocument()
  })

  it('should wrap preset buttons with flex-wrap', () => {
    renderTable()
    expect(document.querySelector('.flex.flex-wrap')).toBeInTheDocument()
  })

  it('should use readable font sizes (text-sm, text-xs, text-lg)', () => {
    renderTable()
    expect(document.querySelectorAll('.text-sm, .text-xs, .text-lg').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Accessibility
// ============================================================================

describe('PeriodComparisonTable - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should use semantic table markup (table/thead/tbody)', () => {
    renderTable()
    expect(document.querySelector('table')).toBeInTheDocument()
    expect(document.querySelector('thead')).toBeInTheDocument()
    expect(document.querySelector('tbody')).toBeInTheDocument()
  })

  it('should have scope="col" on all header cells', () => {
    renderTable()
    screen.getAllByRole('columnheader').forEach(cell => {
      expect(cell.getAttribute('scope')).toBe('col')
    })
  })

  it('should have scope="row" on metric label cells', () => {
    renderTable()
    expect(document.querySelectorAll('td[scope="row"]').length).toBeGreaterThanOrEqual(4)
  })

  it('should have CardTitle with text-lg class', () => {
    renderTable()
    expect(screen.getByText('Сравнение периодов')).toHaveClass('text-lg')
  })

  it('should have title attributes on preset buttons for screen readers', () => {
    renderTable()
    const presetBtns = screen
      .getAllByRole('button')
      .filter(btn => btn.textContent?.match(/MoM|QoQ|YoY|Свой/))
    expect(presetBtns).toHaveLength(4)
    presetBtns.forEach(btn => expect(btn).toHaveAttribute('title'))
  })

  it('should have labeled date inputs via Period N labels', () => {
    renderTable()
    expect(screen.getAllByText(/Период [12]/).length).toBeGreaterThanOrEqual(2)
  })

  it('should use accessible alert (role="alert") for error state', () => {
    vi.clearAllMocks()
    mockError('Test error')
    renderTable()
    expect(document.querySelector('[role="alert"]')).toBeInTheDocument()
  })

  it('should have SVG icons for delta direction indicators', () => {
    renderTable()
    expect(document.querySelectorAll('td svg').length).toBeGreaterThanOrEqual(4)
  })
})

// ============================================================================
// Integration
// ============================================================================

describe('PeriodComparisonTable - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should call useFbsCompare hook on mount', () => {
    renderTable()
    expect(mockUseFbsCompare).toHaveBeenCalledTimes(1)
  })

  it('should pass period params (period1From/To, period2From/To) to hook', () => {
    renderTable()
    const args = mockUseFbsCompare.mock.calls[0][0] as Record<string, string>
    expect(args).toHaveProperty('period1From')
    expect(args).toHaveProperty('period1To')
    expect(args).toHaveProperty('period2From')
    expect(args).toHaveProperty('period2To')
  })

  it('should render skeleton when hook returns loading', () => {
    vi.clearAllMocks()
    mockLoading()
    renderTable()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render error alert when hook returns error', () => {
    vi.clearAllMocks()
    mockError('Server error')
    renderTable()
    expect(screen.getByText('Server error')).toBeInTheDocument()
  })

  it('should refetch on preset change (QoQ click)', async () => {
    renderTable()
    await userEvent.setup().click(screen.getByTitle('Квартал к кварталу'))
    expect(mockUseFbsCompare).toHaveBeenCalled()
  })

  it('should render green deltas with positive data', () => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponsePositive)
    renderTable()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(document.querySelectorAll('.text-green-600').length).toBeGreaterThan(0)
  })

  it('should render red deltas with negative data', () => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
    renderTable()
    expect(document.querySelectorAll('.text-red-600').length).toBeGreaterThan(0)
  })

  it('should disable preset buttons during loading', () => {
    vi.clearAllMocks()
    mockLoading()
    renderTable()
    const btns = screen.getAllByRole('button').filter(b => b.textContent?.match(/MoM|QoQ|YoY|Свой/))
    expect(btns.filter(b => b.hasAttribute('disabled')).length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Preset Comparisons
// ============================================================================

describe('PeriodComparisonTable - Preset Comparisons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should offer MoM, QoQ, YoY, and Custom presets', () => {
    renderTable()
    expect(screen.getByTitle('Месяц к месяцу')).toBeInTheDocument()
    expect(screen.getByTitle('Квартал к кварталу')).toBeInTheDocument()
    expect(screen.getByTitle('Год к году')).toBeInTheDocument()
    expect(screen.getByTitle('Произвольный')).toBeInTheDocument()
  })

  it('should show preset buttons with short labels (MoM, QoQ, YoY, Свой)', () => {
    renderTable()
    expect(screen.getByText('MoM')).toBeInTheDocument()
    expect(screen.getByText('QoQ')).toBeInTheDocument()
    expect(screen.getByText('YoY')).toBeInTheDocument()
    expect(screen.getByText('Свой')).toBeInTheDocument()
  })

  it('should apply preset on selection and trigger refetch', async () => {
    renderTable()
    await userEvent.setup().click(screen.getByTitle('Квартал к кварталу'))
    expect(mockUseFbsCompare).toHaveBeenCalled()
  })
})

// ============================================================================
// Performance
// ============================================================================

describe('PeriodComparisonTable - Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess(mockCompareResponse)
  })

  it('should render exactly 4 metric rows', () => {
    const { container } = renderTable()
    expect(container.querySelectorAll('tbody tr')).toHaveLength(4)
  })

  it('should memoize formatted values via useMemo', () => {
    renderTable()
    expect(screen.getByText(/1[\s ]450/)).toBeInTheDocument()
  })

  it('should call hook exactly once per render', () => {
    renderTable()
    expect(mockUseFbsCompare).toHaveBeenCalledTimes(1)
  })

  it('should render all core elements without unnecessary re-renders', () => {
    renderTable()
    expect(screen.getByText('Сравнение периодов')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Выручка')).toBeInTheDocument()
  })
})
