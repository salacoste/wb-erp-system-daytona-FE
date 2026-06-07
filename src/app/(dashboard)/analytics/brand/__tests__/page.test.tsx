/**
 * Unit Tests for Margin Analysis by Brand Page
 * Story 4.6: Margin Analysis by Brand & Category
 * Story 6.1-FE: Date Range Support for Analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import MarginAnalysisByBrandPage from '../page'

// --- Mock hooks ---
const mockUseMarginAnalyticsByBrand = vi.fn()
const mockUseCabinetLevelExpenses = vi.fn()

vi.mock('@/hooks/useMarginAnalytics', () => ({
  useMarginAnalyticsByBrand: (...args: unknown[]) => mockUseMarginAnalyticsByBrand(...args),
  useCabinetLevelExpenses: (...args: unknown[]) => mockUseCabinetLevelExpenses(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/brand',
}))

// --- Mock child components ---
vi.mock('@/components/custom/MarginByBrandTable', () => ({
  MarginByBrandTable: ({
    data,
    onBrandClick,
  }: {
    data: unknown[]
    onBrandClick: (brand: string) => void
  }) => (
    <div data-testid="margin-by-brand-table">
      MarginByBrandTable ({data.length} items)
      <button onClick={() => onBrandClick('TestBrand')} data-testid="brand-row">
        TestBrand
      </button>
    </div>
  ),
}))

vi.mock('@/components/custom/ExportDialog', () => ({
  ExportDialog: ({ open }: { open: boolean }) => (
    <div data-testid="export-dialog">{open ? 'ExportDialog Open' : 'ExportDialog Closed'}</div>
  ),
}))

vi.mock('@/components/custom/DateRangePicker', () => ({
  formatPeriodLabel: (start: string, end: string) => `${start} — ${end}`,
}))

vi.mock('@/app/(dashboard)/analytics/shared/useMarginPageState', () => ({
  useMarginPageState: () => ({
    weekStart: '2025-W49',
    weekEnd: '2025-W49',
    comparisonEnabled: false,
    setComparisonEnabled: vi.fn(),
    comparisonPreset: 'previous',
    setComparisonPreset: vi.fn(),
    customCompareStart: '2025-W48',
    customCompareEnd: '2025-W48',
    showExportDialog: false,
    setShowExportDialog: vi.fn(),
    effectiveComparisonPeriod: null,
    handleCompareRangeChange: vi.fn(),
    handleRangeChange: vi.fn(),
    handleDrillDown: vi.fn(),
    isRangeMode: false,
    comparisonParams: {},
  }),
}))

vi.mock('@/app/(dashboard)/analytics/shared/MarginFilterSection', () => ({
  MarginFilterSection: () => <div data-testid="margin-filter-section">MarginFilterSection</div>,
}))

vi.mock('@/app/(dashboard)/analytics/shared/MarginSummaryCards', () => ({
  MarginSummaryCards: ({
    entityNameDative,
  }: {
    stats: unknown
    entityNameDative: string
    entityNameGenitive: string
  }) => <div data-testid="margin-summary-cards">SummaryCards ({entityNameDative})</div>,
}))

vi.mock('@/app/(dashboard)/analytics/shared/StorageComparisonCard', () => ({
  StorageComparisonCard: () => <div data-testid="storage-comparison-card">StorageComparison</div>,
}))

vi.mock('@/app/(dashboard)/analytics/shared/calculate-margin-stats', () => ({
  calculateMarginStats: () => ({ totalRevenue: 100000, totalProfit: 40000, avgMargin: 40 }),
}))

vi.mock('../components/BrandHelpSection', () => ({
  BrandHelpSection: () => <div data-testid="brand-help-section">BrandHelpSection</div>,
}))

// --- Mock data ---
const mockBrandData = {
  data: [
    {
      brand: 'Brand A',
      revenue: 100000,
      cost: 60000,
      profit: 40000,
      margin_pct: 40,
      qty: 50,
      total_skus: 10,
    },
    {
      brand: 'Brand B',
      revenue: 50000,
      cost: 30000,
      profit: 20000,
      margin_pct: 40,
      qty: 25,
      total_skus: 5,
    },
  ],
}

function setupMocks(overrides?: Record<string, unknown>) {
  mockUseMarginAnalyticsByBrand.mockReturnValue({
    data: mockBrandData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  })
  mockUseCabinetLevelExpenses.mockReturnValue({
    data: { storage: 5000, storage_weekly_report: 4800, storage_difference: 200 },
    isLoading: false,
  })
}

function renderPage() {
  return renderWithProviders(<MarginAnalysisByBrandPage />)
}

// --- Rendering ---

describe('MarginAnalysisByBrandPage - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders the page heading "Маржинальность по брендам"', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Маржинальность по брендам/, level: 1 })
    ).toBeInTheDocument()
  })

  it('renders the subtitle text', () => {
    renderPage()
    expect(
      screen.getByText(/Агрегированная аналитика прибыли и маржинальности по брендам/)
    ).toBeInTheDocument()
  })

  it('renders the Export button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Экспорт/ })).toBeInTheDocument()
  })

  it('renders the aggregation info alert', () => {
    renderPage()
    expect(screen.getByText(/Агрегация:/)).toBeInTheDocument()
  })

  it('renders MarginFilterSection', () => {
    renderPage()
    expect(screen.getByTestId('margin-filter-section')).toBeInTheDocument()
  })

  it('renders MarginSummaryCards with "брендам" entity name', () => {
    renderPage()
    expect(screen.getByTestId('margin-summary-cards')).toHaveTextContent('брендам')
  })

  it('renders MarginByBrandTable when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('margin-by-brand-table')).toBeInTheDocument()
  })

  it('renders StorageComparisonCard when cabinet expenses available', () => {
    renderPage()
    expect(screen.getByTestId('storage-comparison-card')).toBeInTheDocument()
  })

  it('renders BrandHelpSection', () => {
    renderPage()
    expect(screen.getByTestId('brand-help-section')).toBeInTheDocument()
  })
})

// --- Loading State ---

describe('MarginAnalysisByBrandPage - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({ data: undefined, isLoading: true })
  })

  it('renders skeleton loading state', () => {
    const { container } = renderPage()
    expect(container.querySelector('[class*="h-24"]')).toBeInTheDocument()
  })

  it('does not render data table during loading', () => {
    renderPage()
    expect(screen.queryByTestId('margin-by-brand-table')).not.toBeInTheDocument()
  })
})

// --- Error State ---

describe('MarginAnalysisByBrandPage - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Ошибка загрузки данных'),
    })
  })

  it('renders page heading even on error', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Маржинальность по брендам/ })).toBeInTheDocument()
  })

  it('renders error message', () => {
    renderPage()
    expect(screen.getByText(/Ошибка загрузки данных/)).toBeInTheDocument()
  })

  it('renders retry button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('does not render data table on error', () => {
    renderPage()
    expect(screen.queryByTestId('margin-by-brand-table')).not.toBeInTheDocument()
  })
})

// --- Empty State ---

describe('MarginAnalysisByBrandPage - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({ data: { data: null } })
  })

  it('renders empty state message when no data', () => {
    renderPage()
    expect(screen.getByText(/Нет данных за выбранную неделю/)).toBeInTheDocument()
  })

  it('does not render table when no data', () => {
    renderPage()
    expect(screen.queryByTestId('margin-by-brand-table')).not.toBeInTheDocument()
  })
})

// --- Accessibility ---

describe('MarginAnalysisByBrandPage - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('has exactly one h1 heading', () => {
    renderPage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('unmounts without errors', () => {
    const { unmount } = renderPage()
    expect(() => unmount()).not.toThrow()
  })
})
