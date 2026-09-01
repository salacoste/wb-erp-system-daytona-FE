/**
 * BrandShareView tests — PR4b.
 * Covers: brand-select population, report rendering with the chart, and the
 * friendly RU 503 upstream-failure error state (plus generic non-503 message).
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BrandShareView } from '../BrandShareView'
import type { BrandShareDateRange } from '@/types/brand-share'
import { ApiError } from '@/types/api'

// Mock the three hooks — keep per-test return values mutable via mockReturnValue.
const mockBrands = vi.fn()
const mockSubjects = vi.fn()
const mockReport = vi.fn()
vi.mock('@/hooks/useBrandShare', () => ({
  useBrandShareBrands: () => mockBrands(),
  useBrandShareParentSubjects: () => mockSubjects(),
  useBrandShareReport: () => mockReport(),
}))

vi.mock('recharts', () => {
  const React = require('react')
  const Fake = ({ children, data, dataKey }: Record<string, unknown>) =>
    React.createElement(
      'div',
      {
        'data-testid': 'mock-chart',
        'data-points': (data as unknown[] | undefined)?.length ?? 0,
        'data-datakey': dataKey ?? '',
      },
      children
    )
  return {
    ResponsiveContainer: (p: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'responsive-container' }, p.children),
    LineChart: Fake,
    Line: Fake,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  }
})

function defaultHooks() {
  mockBrands.mockReturnValue({ data: ['DURABOND', 'Acme'], isLoading: false, error: null })
  mockSubjects.mockReturnValue({
    data: [{ parentId: 8555, parentName: 'Отделочные материалы' }],
    isLoading: false,
    error: null,
  })
  mockReport.mockReturnValue({
    data: { report: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })
}

function renderView(overrides: Partial<Parameters<typeof BrandShareView>[0]> = {}) {
  const props = {
    brand: null as string | null,
    parentId: null as number | null,
    dateRange: {} as BrandShareDateRange,
    onBrandChange: vi.fn(),
    onParentIdChange: vi.fn(),
    onDateRangeChange: vi.fn(),
    ...overrides,
  }
  return renderWithProviders(<BrandShareView {...props} />)
}

describe('BrandShareView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    defaultHooks()
  })

  it('renders the brand select and the category select (disabled until brand chosen)', () => {
    renderView()
    expect(screen.getByTestId('brand-share-brand-select')).toBeInTheDocument()
    // Category select is gated on a brand being chosen — the hint copy proves it.
    expect(screen.getByTestId('brand-share-parent-select')).toBeInTheDocument()
    expect(screen.getByText(/Сначала выберите бренд/i)).toBeInTheDocument()
  })

  it('shows each cascading dependency loading state without hiding the filter context', () => {
    mockBrands.mockReturnValue({ data: undefined, isLoading: true, error: null })
    mockSubjects.mockReturnValue({ data: undefined, isLoading: true, error: null })
    mockReport.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    renderView({ brand: 'DURABOND', parentId: 42 })

    expect(screen.getByTestId('brand-share-brands-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('brand-share-parent-select')).toBeDisabled()
    expect(screen.getByTestId('brand-share-report-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('brand-share-brand-select')).toBeInTheDocument()
  })

  it('renders the empty-state message when the report window is empty', () => {
    mockReport.mockReturnValue({
      data: { report: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderView({ brand: 'DURABOND', parentId: 8555 })
    expect(screen.getByText(/Нет данных о доле бренда/i)).toBeInTheDocument()
  })

  it('renders the chart when report data is present (null percents preserved as gaps)', () => {
    mockReport.mockReturnValue({
      data: {
        report: [
          { applyDate: '2026-07-01', brandRating: 3, pricePercent: 12.5, qtyPercent: 8 },
          { applyDate: '2026-07-02', brandRating: null, pricePercent: null, qtyPercent: null },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderView({ brand: 'DURABOND', parentId: 8555 })
    // The recharts mock renders LineChart (and each Line) with the same testid;
    // the LineChart node carries the data-point count on its `data-points` attr.
    const charts = screen.getAllByTestId('mock-chart')
    const points = charts.map(el => el.getAttribute('data-points') ?? '0').find(p => p !== '0')
    expect(points).toBe('2')
  })

  it('surfaces a friendly RU 503 error state with a retry button', () => {
    mockReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError('ServiceUnavailableException', 503, {}),
      refetch: vi.fn(),
    })
    renderView({ brand: 'DURABOND', parentId: 8555 })
    expect(screen.getByTestId('brand-share-error')).toHaveTextContent(
      /Сервис Wildberries временно недоступен/i
    )
    expect(screen.getByTestId('brand-share-retry')).toBeInTheDocument()
  })

  it('shows a generic error message for non-503 failures', () => {
    mockReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError('boom', 500, {}),
      refetch: vi.fn(),
    })
    renderView({ brand: 'DURABOND', parentId: 8555 })
    expect(screen.getByTestId('brand-share-error')).toHaveTextContent(
      /Не удалось загрузить данные о доле бренда/i
    )
  })

  it('cascading reset: choosing a brand resets the downstream category (Story 170.4 pin)', async () => {
    const user = userEvent.setup()
    const onParentIdChange = vi.fn()
    const onBrandChange = vi.fn()
    renderView({ brand: 'Acme', parentId: 8555, onBrandChange, onParentIdChange })
    await user.click(screen.getByTestId('brand-share-brand-select'))
    await user.click(await screen.findByText('DURABOND'))
    expect(onBrandChange).toHaveBeenCalledWith('DURABOND')
    expect(onParentIdChange).toHaveBeenCalledWith(null)
  })

  it('links the visible span labels to the Select triggers (aria-labelledby, Story 170.4)', () => {
    renderView()
    expect(screen.getByLabelText('Бренд')).toBeInTheDocument()
    expect(screen.getByLabelText('Категория (родительский предмет)')).toBeInTheDocument()
    expect(screen.getByLabelText('Дата начала периода')).toBeInTheDocument()
    expect(screen.getByLabelText('Дата окончания периода')).toBeInTheDocument()
  })

  it('min-h-11 (44px epic-AX) on both Select triggers and the retry button', () => {
    renderView()
    expect(screen.getByTestId('brand-share-brand-select').className).toContain('min-h-11')
    expect(screen.getByTestId('brand-share-parent-select').className).toContain('min-h-11')
    expect(screen.getByTestId('brand-share-brand-select')).toHaveClass(
      'bg-background',
      'text-foreground'
    )
    expect(screen.getByTestId('brand-share-parent-select')).toHaveClass(
      'bg-background',
      'text-foreground'
    )
    mockReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError('boom', 500, {}),
      refetch: vi.fn(),
    })
    renderView({ brand: 'DURABOND', parentId: 8555 })
    expect(screen.getByTestId('brand-share-retry').className).toContain('min-h-11')
  })

  it('error icon uses the status-warning token (was text-amber-500)', () => {
    mockReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError('boom', 500, {}),
      refetch: vi.fn(),
    })
    renderView({ brand: 'DURABOND', parentId: 8555 })
    // SVG className is SVGAnimatedString in jsdom — read the raw attribute.
    expect(screen.getByTestId('brand-share-error-icon').getAttribute('class')).toContain(
      'text-status-warning'
    )
  })

  it('invalid date range: destructive hint shown, values RETAINED, no other branch disabled', () => {
    renderView({
      brand: 'DURABOND',
      parentId: 8555,
      dateRange: { dateFrom: '2026-07-10', dateTo: '2026-07-01' },
    })
    expect(screen.getByTestId('brand-share-invalid-range')).toHaveTextContent(
      /Дата начала позже даты окончания/i
    )
    // Selections retained — inputs keep the invalid values (AC-2: no auto-reset).
    expect(screen.getByTestId('brand-share-date-from')).toHaveValue('2026-07-10')
    expect(screen.getByTestId('brand-share-date-to')).toHaveValue('2026-07-01')
    // The default-period hint is replaced by the error, not shown alongside.
    expect(screen.queryByText(/Без выбора — последние 7 дней/i)).not.toBeInTheDocument()
    // The selects stay enabled — range validity does not disable other branches.
    expect(screen.getByTestId('brand-share-brand-select')).toBeEnabled()
  })

  it('valid range keeps the default-period hint and no destructive hint', () => {
    renderView({
      brand: 'DURABOND',
      parentId: 8555,
      dateRange: { dateFrom: '2026-07-01', dateTo: '2026-07-10' },
    })
    expect(screen.queryByTestId('brand-share-invalid-range')).not.toBeInTheDocument()
    expect(screen.getByText(/Без выбора — последние 7 дней/i)).toBeInTheDocument()
  })
})
