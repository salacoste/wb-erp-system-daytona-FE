/**
 * LiquidityPage Unit Tests
 *
 * Verifies liquidity analysis page:
 * - Renders header, distribution cards, summary bar, benchmarks, table
 * - Shows error state with retry button
 * - Shows loading state
 * - Shows empty state when no data
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

vi.mock('@/hooks/useLiquidity', () => ({
  useLiquidity: () => ({
    data: {
      summary: {
        total_sku_count: 10,
        distribution: { high: 3, medium: 4, low: 2, illiquid: 1 },
        benchmarks: { avg_turnover: 14, avg_margin: 22 },
      },
      data: [
        {
          nm_id: 123,
          vendor_code: 'SKU-001',
          liquidity_category: 'high',
          turnover_days: 5,
          stock_value: 50000,
          velocity_per_day: 2.5,
        },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    dataUpdatedAt: Date.now(),
  }),
  // Story 165.4-FE: the page now mounts LiquidityTrendsSection which calls this hook.
  useLiquidityTrends: () => ({
    data: {
      meta: { cabinet_id: 'test', period_days: 90, generated_at: '2026-08-07T00:00:00Z' },
      trends: [],
      insights: [],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/lib/liquidity-utils', () => ({
  mapLiquiditySortToApi: vi.fn(() => 'turnover_days'),
  sortLiquidityItems: (data: unknown[]) => data,
}))

vi.mock('../components/LiquidityHeader', () => ({
  LiquidityHeader: () => <div data-testid="liquidity-header">Liquidity Header</div>,
}))

vi.mock('../components/LiquidityDistributionCards', () => ({
  LiquidityDistributionCards: () => (
    <div data-testid="liquidity-distribution-cards">Distribution Cards</div>
  ),
}))

vi.mock('../components/LiquiditySummaryBar', () => ({
  LiquiditySummaryBar: () => <div data-testid="liquidity-summary-bar">Summary Bar</div>,
}))

vi.mock('../components/LiquidityBenchmarks', () => ({
  LiquidityBenchmarks: () => <div data-testid="liquidity-benchmarks">Benchmarks</div>,
}))

vi.mock('../components/LiquidityTable', () => ({
  LiquidityTable: () => <div data-testid="liquidity-table">Table</div>,
}))

vi.mock('../components/LiquidityEmpty', () => ({
  LiquidityEmpty: () => <div data-testid="liquidity-empty">Empty State</div>,
}))

vi.mock('../components/LiquidityLoading', () => ({
  LiquidityLoading: () => <div data-testid="liquidity-loading">Loading</div>,
}))

vi.mock('../components/LiquidityDistributionChart', () => ({
  LiquidityDistributionChart: () => (
    <div data-testid="liquidity-distribution-chart">Distribution Chart</div>
  ),
}))

import LiquidityPage from '../page'

describe('LiquidityPage', () => {
  it('renders all main sections with data', () => {
    renderWithProviders(<LiquidityPage />)
    expect(screen.getByTestId('liquidity-header')).toBeInTheDocument()
    expect(screen.getByTestId('liquidity-distribution-cards')).toBeInTheDocument()
    expect(screen.getByTestId('liquidity-summary-bar')).toBeInTheDocument()
    expect(screen.getByTestId('liquidity-benchmarks')).toBeInTheDocument()
    expect(screen.getByTestId('liquidity-table')).toBeInTheDocument()
  })

  it('does not show loading or empty states when data present', () => {
    renderWithProviders(<LiquidityPage />)
    expect(screen.queryByTestId('liquidity-loading')).not.toBeInTheDocument()
    expect(screen.queryByTestId('liquidity-empty')).not.toBeInTheDocument()
  })
})

describe('LiquidityPage - error state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/hooks/useLiquidity', () => ({
      useLiquidity: () => ({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
        dataUpdatedAt: 0,
      }),
    }))
  })

  it('renders error message when error occurs', async () => {
    const { default: LiquidityPageError } = await import('../page')
    renderWithProviders(<LiquidityPageError />)
    expect(screen.getByText(/Не удалось загрузить данные о ликвидности/)).toBeInTheDocument()
  })
})

describe('LiquidityPage - empty state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/hooks/useLiquidity', () => ({
      useLiquidity: () => ({
        data: { summary: { total_sku_count: 0 }, data: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        dataUpdatedAt: Date.now(),
      }),
    }))
    vi.doMock('@/lib/liquidity-utils', () => ({
      mapLiquiditySortToApi: vi.fn(() => 'turnover_days'),
      sortLiquidityItems: (data: unknown[]) => data,
    }))
    vi.doMock('../components/LiquidityHeader', () => ({
      LiquidityHeader: () => <div data-testid="liquidity-header">Header</div>,
    }))
    vi.doMock('../components/LiquidityEmpty', () => ({
      LiquidityEmpty: () => <div data-testid="liquidity-empty">Empty</div>,
    }))
  })

  it('renders empty state when no data', async () => {
    const { default: LiquidityPageEmpty } = await import('../page')
    renderWithProviders(<LiquidityPageEmpty />)
    expect(screen.getByTestId('liquidity-empty')).toBeInTheDocument()
  })
})

describe('LiquidityPage - loading state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/hooks/useLiquidity', () => ({
      useLiquidity: () => ({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        dataUpdatedAt: 0,
      }),
    }))
    vi.doMock('@/lib/liquidity-utils', () => ({
      mapLiquiditySortToApi: vi.fn(() => 'turnover_days'),
      sortLiquidityItems: (data: unknown[]) => data,
    }))
    vi.doMock('../components/LiquidityHeader', () => ({
      LiquidityHeader: () => <div data-testid="liquidity-header">Header</div>,
    }))
    vi.doMock('../components/LiquidityLoading', () => ({
      LiquidityLoading: () => <div data-testid="liquidity-loading">Loading</div>,
    }))
  })

  it('renders loading state', async () => {
    const { default: LiquidityPageLoading } = await import('../page')
    renderWithProviders(<LiquidityPageLoading />)
    expect(screen.getByTestId('liquidity-loading')).toBeInTheDocument()
  })
})
