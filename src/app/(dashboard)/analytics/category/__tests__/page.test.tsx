/**
 * Unit Tests for Margin Analysis by Category Page
 * Story 4.6: Margin Analysis by Brand & Category
 * Story 6.1-FE: Date Range Support for Analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import MarginAnalysisByCategoryPage from '../page'

// --- Mock hooks ---
const mockUseMarginAnalyticsByCategory = vi.fn()
const mockUseCabinetLevelExpenses = vi.fn()

vi.mock('@/hooks/useMarginAnalytics', () => ({
  useMarginAnalyticsByCategory: (...args: unknown[]) => mockUseMarginAnalyticsByCategory(...args),
  useCabinetLevelExpenses: (...args: unknown[]) => mockUseCabinetLevelExpenses(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/category',
}))

// --- Mock child components ---
vi.mock('@/components/custom/MarginByCategoryTable', () => ({
  MarginByCategoryTable: ({
    data,
    onCategoryClick,
  }: {
    data: unknown[]
    onCategoryClick: (category: string) => void
  }) => (
    <div data-testid="margin-by-category-table">
      MarginByCategoryTable ({data.length} items)
      <button onClick={() => onCategoryClick('TestCategory')} data-testid="category-row">
        TestCategory
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

vi.mock('../components/CategoryHelpSection', () => ({
  CategoryHelpSection: () => <div data-testid="category-help-section">CategoryHelpSection</div>,
}))

// --- Mock data ---
const mockCategoryData = {
  data: [
    {
      category: 'Category A',
      revenue: 120000,
      cost: 72000,
      profit: 48000,
      margin_pct: 40,
      qty: 60,
      total_skus: 12,
    },
    {
      category: 'Category B',
      revenue: 80000,
      cost: 50000,
      profit: 30000,
      margin_pct: 37.5,
      qty: 30,
      total_skus: 8,
    },
  ],
}

function setupMocks(overrides?: Record<string, unknown>) {
  mockUseMarginAnalyticsByCategory.mockReturnValue({
    data: mockCategoryData,
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
  return renderWithProviders(<MarginAnalysisByCategoryPage />)
}

// --- Rendering ---

describe('MarginAnalysisByCategoryPage - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders the page heading "Маржинальность по категориям"', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Маржинальность по категориям/, level: 1 })
    ).toBeInTheDocument()
  })

  it('renders the subtitle text', () => {
    renderPage()
    expect(
      screen.getByText(/Агрегированная аналитика прибыли и маржинальности по категориям товаров/)
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

  it('renders MarginSummaryCards with "категориям" entity name', () => {
    renderPage()
    expect(screen.getByTestId('margin-summary-cards')).toHaveTextContent('категориям')
  })

  it('renders MarginByCategoryTable when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('margin-by-category-table')).toBeInTheDocument()
  })

  it('renders StorageComparisonCard when cabinet expenses available', () => {
    renderPage()
    expect(screen.getByTestId('storage-comparison-card')).toBeInTheDocument()
  })

  it('renders CategoryHelpSection', () => {
    renderPage()
    expect(screen.getByTestId('category-help-section')).toBeInTheDocument()
  })

  it('renders table card title', () => {
    renderPage()
    // Text appears in both h1 and CardTitle — use getAllByText
    const matches = screen.getAllByText('Маржинальность по категориям')
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })
})

// --- Loading State ---

describe('MarginAnalysisByCategoryPage - Loading State', () => {
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
    expect(screen.queryByTestId('margin-by-category-table')).not.toBeInTheDocument()
  })
})

// --- Error State ---

describe('MarginAnalysisByCategoryPage - Error State', () => {
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
    expect(
      screen.getByRole('heading', { name: /Маржинальность по категориям/ })
    ).toBeInTheDocument()
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
    expect(screen.queryByTestId('margin-by-category-table')).not.toBeInTheDocument()
  })
})

// --- Empty State ---

describe('MarginAnalysisByCategoryPage - Empty State', () => {
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
    expect(screen.queryByTestId('margin-by-category-table')).not.toBeInTheDocument()
  })
})

// --- No Cabinet Expenses ---

describe('MarginAnalysisByCategoryPage - No Cabinet Expenses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
    mockUseCabinetLevelExpenses.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('does not render StorageComparisonCard when no expenses data', () => {
    renderPage()
    expect(screen.queryByTestId('storage-comparison-card')).not.toBeInTheDocument()
  })

  it('still renders the main data table', () => {
    renderPage()
    expect(screen.getByTestId('margin-by-category-table')).toBeInTheDocument()
  })
})

// --- Accessibility ---

describe('MarginAnalysisByCategoryPage - Accessibility', () => {
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
