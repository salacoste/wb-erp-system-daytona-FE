/**
 * StorageAnalyticsPage Unit Tests
 *
 * Verifies storage analytics page:
 * - Renders all sections when data present
 * - Shows error state
 * - Shows no data state
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

vi.mock('../components/useStoragePageState', () => ({
  useStoragePageState: () => ({
    weekStart: '2026-W22',
    weekEnd: '2026-W23',
    selectedBrands: [],
    selectedWarehouses: [],
    selectedWeek: null,
    bySkuData: {
      has_data: true,
      summary: { total_cost: 150000, avg_cost_per_sku: 5000 },
      period: { from: '2026-05-26', to: '2026-06-01' },
      pagination: { total: 30 },
      data: [],
    },
    isLoadingBySku: false,
    bySkuError: null,
    topConsumersData: { top_consumers: [] },
    isLoadingTopConsumers: false,
    topConsumersError: null,
    filledTrendsData: [],
    trendsData: { summary: { storage_cost: 150000 } },
    isLoadingTrends: false,
    trendsError: null,
    isLoadingUnfiltered: false,
    availableBrands: [],
    availableWarehouses: [],
    handleWeekRangeChange: vi.fn(),
    handleWeekClick: vi.fn(),
    handleClearWeekFilter: vi.fn(),
    handleBrandsChange: vi.fn(),
    handleWarehousesChange: vi.fn(),
  }),
}))

vi.mock('../components/StoragePageHeader', () => ({
  StoragePageHeader: () => <div data-testid="storage-header">Header</div>,
}))

vi.mock('../components/StorageFilters', () => ({
  StorageFilters: () => <div data-testid="storage-filters">Filters</div>,
}))

vi.mock('../components/StorageSummaryCards', () => ({
  StorageSummaryCards: () => <div data-testid="storage-summary-cards">Summary</div>,
}))

vi.mock('../components/StorageBySkuTable', () => ({
  StorageBySkuTable: () => <div data-testid="storage-sku-table">SKU Table</div>,
}))

vi.mock('../components/TopConsumersWidget', () => ({
  TopConsumersWidget: () => <div data-testid="storage-top-consumers">Top Consumers</div>,
}))

vi.mock('../components/StorageTrendsChart', () => ({
  StorageTrendsChart: () => <div data-testid="storage-trends-chart">Trends</div>,
}))

vi.mock('../components/StorageAlertBanner', () => ({
  StorageAlertBanner: () => <div data-testid="storage-alert-banner">Alert</div>,
}))

vi.mock('../components/WeekFilterBadge', () => ({
  WeekFilterBadge: () => <div data-testid="week-filter-badge">Week Badge</div>,
}))

import StorageAnalyticsPage from '../page'

describe('StorageAnalyticsPage - data present', () => {
  it('renders all main sections', () => {
    renderWithProviders(<StorageAnalyticsPage />)
    expect(screen.getByTestId('storage-header')).toBeInTheDocument()
    expect(screen.getByTestId('storage-filters')).toBeInTheDocument()
    expect(screen.getByTestId('storage-summary-cards')).toBeInTheDocument()
    expect(screen.getByTestId('storage-sku-table')).toBeInTheDocument()
    expect(screen.getByTestId('storage-top-consumers')).toBeInTheDocument()
    expect(screen.getByTestId('storage-trends-chart')).toBeInTheDocument()
  })

  it('renders trends chart title', () => {
    renderWithProviders(<StorageAnalyticsPage />)
    expect(screen.getByText('Динамика расходов на хранение')).toBeInTheDocument()
  })

  it('renders top consumers title', () => {
    renderWithProviders(<StorageAnalyticsPage />)
    expect(screen.getByText('Топ-5 по расходам на хранение')).toBeInTheDocument()
  })

  it('renders all products section', () => {
    renderWithProviders(<StorageAnalyticsPage />)
    expect(screen.getByText('Все товары')).toBeInTheDocument()
  })
})

describe('StorageAnalyticsPage - error state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../components/useStoragePageState', () => ({
      useStoragePageState: () => ({
        weekStart: '2026-W22',
        weekEnd: '2026-W23',
        selectedBrands: [],
        selectedWarehouses: [],
        selectedWeek: null,
        bySkuData: null,
        isLoadingBySku: false,
        bySkuError: new Error('Network error'),
        topConsumersData: null,
        isLoadingTopConsumers: false,
        topConsumersError: null,
        filledTrendsData: [],
        trendsData: null,
        isLoadingTrends: false,
        trendsError: null,
        isLoadingUnfiltered: false,
        availableBrands: [],
        availableWarehouses: [],
        handleWeekRangeChange: vi.fn(),
        handleWeekClick: vi.fn(),
        handleClearWeekFilter: vi.fn(),
        handleBrandsChange: vi.fn(),
        handleWarehousesChange: vi.fn(),
      }),
    }))
    vi.doMock('../components/StoragePageHeader', () => ({
      StoragePageHeader: () => <div data-testid="storage-header">Header</div>,
    }))
  })

  it('renders error message', async () => {
    const { default: Page } = await import('../page')
    renderWithProviders(<Page />)
    expect(
      screen.getByText(/Не удалось загрузить данные по расходам на хранение/)
    ).toBeInTheDocument()
  })
})

describe('StorageAnalyticsPage - no data state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../components/useStoragePageState', () => ({
      useStoragePageState: () => ({
        weekStart: '2026-W22',
        weekEnd: '2026-W23',
        selectedBrands: [],
        selectedWarehouses: [],
        selectedWeek: null,
        bySkuData: { has_data: false },
        isLoadingBySku: false,
        bySkuError: null,
        topConsumersData: null,
        isLoadingTopConsumers: false,
        topConsumersError: null,
        filledTrendsData: [],
        trendsData: null,
        isLoadingTrends: false,
        trendsError: null,
        isLoadingUnfiltered: false,
        availableBrands: [],
        availableWarehouses: [],
        handleWeekRangeChange: vi.fn(),
        handleWeekClick: vi.fn(),
        handleClearWeekFilter: vi.fn(),
        handleBrandsChange: vi.fn(),
        handleWarehousesChange: vi.fn(),
      }),
    }))
    vi.doMock('../components/StoragePageHeader', () => ({
      StoragePageHeader: () => <div data-testid="storage-header">Header</div>,
    }))
    vi.doMock('../components/StorageFilters', () => ({
      StorageFilters: () => <div data-testid="storage-filters">Filters</div>,
    }))
  })

  it('renders no data message', async () => {
    const { default: Page } = await import('../page')
    renderWithProviders(<Page />)
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })
})


// ============================================================================
// Story 169.12 (AC-2): per-section recoverable errors — trends/topConsumers
// hooks previously dropped their errors silently; other sections retain data.
// ============================================================================

describe('StorageAnalyticsPage - per-section error states (Story 169.12)', () => {
  function mockState(overrides: Record<string, unknown>) {
    vi.resetModules()
    const base = {
      weekStart: '2026-W22',
      weekEnd: '2026-W23',
      selectedBrands: [],
      selectedWarehouses: [],
      selectedWeek: null,
      bySkuData: {
        has_data: true,
        summary: { total_cost: 150000, avg_cost_per_sku: 5000 },
        period: { from: '2026-05-26', to: '2026-06-01' },
        pagination: { total: 30 },
        data: [],
      },
      isLoadingBySku: false,
      bySkuError: null,
      topConsumersData: { top_consumers: [] },
      isLoadingTopConsumers: false,
      topConsumersError: null,
      filledTrendsData: [],
      trendsData: null,
      isLoadingTrends: false,
      trendsError: null,
      isLoadingUnfiltered: false,
      availableBrands: [],
      availableWarehouses: [],
      handleWeekRangeChange: vi.fn(),
      handleWeekClick: vi.fn(),
      handleClearWeekFilter: vi.fn(),
      handleBrandsChange: vi.fn(),
      handleWarehousesChange: vi.fn(),
      ...overrides,
    }
    vi.doMock('../components/useStoragePageState', () => ({
      useStoragePageState: () => base,
    }))
    vi.doMock('../components/StoragePageHeader', () => ({
      StoragePageHeader: () => <div data-testid="storage-header">Header</div>,
    }))
    vi.doMock('../components/StorageFilters', () => ({
      StorageFilters: () => <div data-testid="storage-filters">Filters</div>,
    }))
    vi.doMock('../components/StorageSummaryCards', () => ({
      StorageSummaryCards: () => <div data-testid="storage-summary-cards">Summary</div>,
    }))
    vi.doMock('../components/StorageBySkuTable', () => ({
      StorageBySkuTable: () => <div data-testid="storage-sku-table">SKU Table</div>,
    }))
    vi.doMock('../components/TopConsumersWidget', () => ({
      TopConsumersWidget: () => <div data-testid="storage-top-consumers">Top Consumers</div>,
    }))
    vi.doMock('../components/StorageTrendsChart', () => ({
      StorageTrendsChart: () => <div data-testid="storage-trends-chart">Trends</div>,
    }))
  }

  it('trends error renders a recoverable Alert while other sections keep data', async () => {
    mockState({ trendsError: new Error('trends failed') })
    const { default: Page } = await import('../page')
    renderWithProviders(<Page />)
    expect(
      screen.getByText(/Не удалось загрузить динамику расходов на хранение/)
    ).toBeInTheDocument()
    // Retention: the other sections still render their data
    expect(screen.getByTestId('storage-summary-cards')).toBeInTheDocument()
    expect(screen.getByTestId('storage-top-consumers')).toBeInTheDocument()
    expect(screen.getByTestId('storage-sku-table')).toBeInTheDocument()
    expect(screen.queryByTestId('storage-trends-chart')).not.toBeInTheDocument()
  })

  it('topConsumers error renders a recoverable Alert while the SKU table keeps data', async () => {
    mockState({ topConsumersError: new Error('consumers failed') })
    const { default: Page } = await import('../page')
    renderWithProviders(<Page />)
    expect(
      screen.getByText(/Не удалось загрузить топ товаров по расходам на хранение/)
    ).toBeInTheDocument()
    expect(screen.getByTestId('storage-sku-table')).toBeInTheDocument()
    expect(screen.getByTestId('storage-trends-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('storage-top-consumers')).not.toBeInTheDocument()
  })
})
