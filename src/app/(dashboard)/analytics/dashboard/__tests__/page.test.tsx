/**
 * Unit Tests for Cabinet Summary Dashboard Page
 * Story 6.4-FE: Cabinet Summary Dashboard
 */

import { act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import CabinetDashboardPage from '../page'

// --- Mock hooks ---
const mockUseCabinetSummary = vi.fn()
const mockUseAvailableWeeks = vi.fn()
const mockUseDataAvailability = vi.fn()
const mockUseDashboardPeriod = vi.fn()

vi.mock('@/hooks/useCabinetSummary', () => ({
  useCabinetSummary: (...args: unknown[]) => mockUseCabinetSummary(...args),
}))

vi.mock('@/hooks/useFinancialSummary', () => ({
  useAvailableWeeks: (...args: unknown[]) => mockUseAvailableWeeks(...args),
}))

vi.mock('@/hooks/useDataAvailability', () => ({
  useDataAvailability: (...args: unknown[]) => mockUseDataAvailability(...args),
}))

vi.mock('@/hooks/useDashboardPeriod', () => ({
  useDashboardPeriod: (...args: unknown[]) => mockUseDashboardPeriod(...args),
  DashboardPeriodProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// --- Mock child components ---
vi.mock('@/components/custom/TopProductsTable', () => ({
  TopProductsTable: ({ products }: { products: unknown[] }) => (
    <div data-testid="top-products-table">TopProductsTable ({products.length})</div>
  ),
}))

vi.mock('@/components/custom/TopBrandsTable', () => ({
  TopBrandsTable: ({ brands }: { brands: unknown[] }) => (
    <div data-testid="top-brands-table">TopBrandsTable ({brands.length})</div>
  ),
}))

vi.mock('@/components/custom/PnLWaterfall', () => ({
  PnLWaterfall: ({ data: _data }: { data: unknown }) => (
    <div data-testid="pnl-waterfall">PnLWaterfall</div>
  ),
}))

vi.mock('@/components/custom/DashboardPeriodSelector', () => ({
  DashboardPeriodSelector: () => <div data-testid="period-selector">PeriodSelector</div>,
}))

vi.mock('@/components/custom/dashboard', () => ({
  IncompleteWeekBanner: ({ period }: { period: string }) => (
    <div data-testid="incomplete-week-banner">IncompleteWeek: {period}</div>
  ),
}))

vi.mock('@/app/(dashboard)/dashboard/components/ReportPendingBanner', () => ({
  ReportPendingBanner: () => <div data-testid="report-pending-banner">ReportPending</div>,
}))

// --- Default mock returns ---
const defaultPeriodState = {
  periodType: 'week',
  selectedWeek: '2025-W49',
  selectedMonth: '2025-12',
}

const defaultSummaryData = {
  summary: {
    totals: { revenue: 100000, cost: 60000, profit: 40000 },
    products: [],
  },
  top_products: [{ name: 'Product A', revenue: 50000 }],
  top_brands: [{ name: 'Brand X', revenue: 80000 }],
}

function setupMocks(overrides?: {
  summary?: Partial<ReturnType<typeof mockUseCabinetSummary>>
  financeAvailable?: boolean
  period?: Partial<typeof defaultPeriodState>
  availableWeeks?: { week: string }[]
}) {
  mockUseDashboardPeriod.mockReturnValue({ ...defaultPeriodState, ...overrides?.period })
  mockUseAvailableWeeks.mockReturnValue({
    data: overrides?.availableWeeks ?? [{ week: '2025-W49' }],
    isLoading: false,
  })
  mockUseDataAvailability.mockReturnValue({
    isFinanceAvailable: overrides?.financeAvailable ?? true,
    latestAvailableWeek: '2025-W49',
  })
  mockUseCabinetSummary.mockReturnValue({
    data: defaultSummaryData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides?.summary,
  })
}

function renderPage() {
  return renderWithProviders(<CabinetDashboardPage />)
}

afterEach(() => {
  vi.useRealTimers()
})

// --- Rendering ---

describe('CabinetDashboardPage - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders the page heading "Сводка по кабинету"', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Сводка по кабинету/, level: 1 })
    ).toBeInTheDocument()
  })

  it('renders the subtitle text', () => {
    renderPage()
    expect(screen.getByText(/Ключевые показатели эффективности и топ-товары/)).toBeInTheDocument()
  })

  it('renders the period selector', () => {
    renderPage()
    expect(screen.getByTestId('period-selector')).toBeInTheDocument()
  })

  it('renders PnLWaterfall when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('pnl-waterfall')).toBeInTheDocument()
  })

  it('renders TopProductsTable when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('top-products-table')).toBeInTheDocument()
  })

  it('renders TopBrandsTable when data is loaded', () => {
    renderPage()
    expect(screen.getByTestId('top-brands-table')).toBeInTheDocument()
  })

  it('makes effective WB-week coverage visible in month mode', () => {
    setupMocks({
      period: { periodType: 'month', selectedMonth: '2026-05', selectedWeek: '2026-W22' },
      availableWeeks: [
        { week: '2026-W19' },
        { week: '2026-W20' },
        { week: '2026-W21' },
        { week: '2026-W22' },
      ],
    })

    renderPage()

    // Concurrent commit 1176c0ad changed the notice to list each covered week
    // (weekListLabel, comma-separated) instead of a "start — end" range.
    expect(screen.getByText(/2026-W19, 2026-W20, 2026-W21, 2026-W22/)).toBeInTheDocument()
    expect(screen.getByText(/04\.05\.2026 — 31\.05\.2026/)).toBeInTheDocument()
    expect(mockUseCabinetSummary).toHaveBeenCalledWith(
      { weekStart: '2026-W19', weekEnd: '2026-W22' },
      { enabled: true }
    )
  })
})

// --- Loading State ---

describe('CabinetDashboardPage - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({
      summary: { data: undefined, isLoading: true },
    })
  })

  it('renders skeleton loading state', () => {
    renderPage()
    // Skeleton cards should be present during loading
    expect(screen.getByRole('heading', { name: /Сводка по кабинету/ })).toBeInTheDocument()
  })

  it('does not render data tables during loading', () => {
    renderPage()
    expect(screen.queryByTestId('pnl-waterfall')).not.toBeInTheDocument()
    expect(screen.queryByTestId('top-products-table')).not.toBeInTheDocument()
    expect(screen.queryByTestId('top-brands-table')).not.toBeInTheDocument()
  })

  it('replaces long-loading skeletons with an explicit retry state', () => {
    vi.useFakeTimers()
    renderPage()

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.getByText(/Сводка по кабинету загружается дольше обычного/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })
})

// --- Error State ---

describe('CabinetDashboardPage - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({
      summary: {
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Ошибка загрузки данных'),
      },
    })
  })

  it('renders error message', () => {
    renderPage()
    expect(screen.getByText(/Ошибка загрузки данных/)).toBeInTheDocument()
  })

  it('renders retry button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('does not render data tables on error', () => {
    renderPage()
    expect(screen.queryByTestId('pnl-waterfall')).not.toBeInTheDocument()
  })
})

describe('CabinetDashboardPage - Background freshness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('retains loaded dashboard evidence during a background refresh', () => {
    setupMocks({ summary: { data: defaultSummaryData, isLoading: true } })

    renderPage()

    expect(screen.getByTestId('pnl-waterfall')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Обновляем сводку по кабинету')
  })

  it('retains stale dashboard evidence and retries a failed background refresh', () => {
    const refetch = vi.fn()
    setupMocks({
      summary: {
        data: defaultSummaryData,
        isError: true,
        error: new Error('Сбой обновления'),
        refetch,
      },
    })

    renderPage()

    expect(screen.getByTestId('pnl-waterfall')).toBeInTheDocument()
    expect(screen.getByText(/Показаны ранее загруженные данные/)).toBeInTheDocument()
    screen.getByRole('button', { name: 'Повторить' }).click()
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})

// --- Finance Unavailable ---

describe('CabinetDashboardPage - Finance Unavailable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({ financeAvailable: false })
  })

  it('renders IncompleteWeekBanner when finance not available', () => {
    renderPage()
    expect(screen.getByTestId('incomplete-week-banner')).toBeInTheDocument()
  })

  it('renders ReportPendingBanner when finance not available', () => {
    renderPage()
    expect(screen.getByTestId('report-pending-banner')).toBeInTheDocument()
  })

  it('does not render data tables when finance not available', () => {
    renderPage()
    expect(screen.queryByTestId('pnl-waterfall')).not.toBeInTheDocument()
  })
})

// --- Empty State ---

describe('CabinetDashboardPage - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks({
      summary: {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      },
    })
  })

  it('renders empty state alert when no data', () => {
    renderPage()
    expect(screen.getByText(/Нет данных для отображения/)).toBeInTheDocument()
  })
})

// --- Accessibility ---

describe('CabinetDashboardPage - Accessibility', () => {
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
