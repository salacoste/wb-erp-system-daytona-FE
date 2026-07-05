/**
 * BrandShareView tests — PR4b.
 * Covers: brand-select population, report rendering with the chart, and the
 * friendly RU 503 upstream-failure error state (plus generic non-503 message).
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BrandShareView } from '../BrandShareView'
import type { BrandShareDateRange } from '@/types/brand-share'

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
      error: { status: 503, message: 'upstream WB failed' },
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
      error: { status: 500, message: 'boom' },
      refetch: vi.fn(),
    })
    renderView({ brand: 'DURABOND', parentId: 8555 })
    expect(screen.getByTestId('brand-share-error')).toHaveTextContent(
      /Не удалось загрузить данные о доле бренда/i
    )
  })
})
