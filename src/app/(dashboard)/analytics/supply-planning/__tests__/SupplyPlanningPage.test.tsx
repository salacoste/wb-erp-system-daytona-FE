/**
 * SupplyPlanningPage Unit Tests
 *
 * Verifies supply planning page:
 * - Renders header, risk cards, metrics bar, table when data present
 * - Shows error state with retry button
 * - Shows loading state
 * - Shows empty state when no data
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

vi.mock('@/hooks/useSupplyPlanning', () => ({
  useSupplyPlanning: () => ({
    data: {
      summary: {
        total_skus: 20,
        risk_distribution: { critical: 2, high: 3, medium: 5, low: 8, safe: 2 },
      },
      data: [
        {
          nm_id: 123,
          vendor_code: 'SKU-001',
          stockout_risk: 'critical',
          days_until_stockout: 3,
          current_stock: 10,
          daily_velocity: 3.3,
        },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    dataUpdatedAt: Date.now(),
  }),
}))

vi.mock('../components/SupplyPlanningHeader', () => ({
  SupplyPlanningHeader: () => <div data-testid="supply-header">Header</div>,
}))

vi.mock('../components/SupplyRiskCards', () => ({
  SupplyRiskCards: () => <div data-testid="supply-risk-cards">Risk Cards</div>,
}))

vi.mock('../components/SupplyMetricsBar', () => ({
  SupplyMetricsBar: () => <div data-testid="supply-metrics-bar">Metrics Bar</div>,
}))

vi.mock('../components/SupplyPlanningTable', () => ({
  SupplyPlanningTable: () => <div data-testid="supply-table">Table</div>,
}))

vi.mock('../components/SupplyPlanningEmpty', () => ({
  SupplyPlanningEmpty: () => <div data-testid="supply-empty">Empty</div>,
}))

vi.mock('../components/SupplyPlanningLoading', () => ({
  SupplyPlanningLoading: () => <div data-testid="supply-loading">Loading</div>,
}))

import SupplyPlanningPage from '../page'

describe('SupplyPlanningPage - data present', () => {
  it('renders all main sections', () => {
    renderWithProviders(<SupplyPlanningPage />)
    expect(screen.getByTestId('supply-header')).toBeInTheDocument()
    expect(screen.getByTestId('supply-risk-cards')).toBeInTheDocument()
    expect(screen.getByTestId('supply-metrics-bar')).toBeInTheDocument()
    expect(screen.getByTestId('supply-table')).toBeInTheDocument()
  })

  it('does not show loading or empty when data present', () => {
    renderWithProviders(<SupplyPlanningPage />)
    expect(screen.queryByTestId('supply-loading')).not.toBeInTheDocument()
    expect(screen.queryByTestId('supply-empty')).not.toBeInTheDocument()
  })
})

describe('SupplyPlanningPage - error state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/hooks/useSupplyPlanning', () => ({
      useSupplyPlanning: () => ({
        data: null,
        isLoading: false,
        error: new Error('Server error'),
        refetch: vi.fn(),
        dataUpdatedAt: 0,
      }),
    }))
    vi.doMock('../components/SupplyPlanningHeader', () => ({
      SupplyPlanningHeader: () => <div data-testid="supply-header">Header</div>,
    }))
  })

  it('renders error message', async () => {
    const { default: Page } = await import('../page')
    renderWithProviders(<Page />)
    expect(screen.getByText(/Не удалось загрузить данные о поставках/)).toBeInTheDocument()
  })
})

describe('SupplyPlanningPage - loading state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/hooks/useSupplyPlanning', () => ({
      useSupplyPlanning: () => ({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        dataUpdatedAt: 0,
      }),
    }))
    vi.doMock('../components/SupplyPlanningHeader', () => ({
      SupplyPlanningHeader: () => <div data-testid="supply-header">Header</div>,
    }))
    vi.doMock('../components/SupplyPlanningLoading', () => ({
      SupplyPlanningLoading: () => <div data-testid="supply-loading">Loading</div>,
    }))
  })

  it('renders loading skeleton', async () => {
    const { default: Page } = await import('../page')
    renderWithProviders(<Page />)
    expect(screen.getByTestId('supply-loading')).toBeInTheDocument()
  })
})

describe('SupplyPlanningPage - empty state', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/hooks/useSupplyPlanning', () => ({
      useSupplyPlanning: () => ({
        data: { summary: { total_skus: 0 }, data: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        dataUpdatedAt: Date.now(),
      }),
    }))
    vi.doMock('../components/SupplyPlanningHeader', () => ({
      SupplyPlanningHeader: () => <div data-testid="supply-header">Header</div>,
    }))
    vi.doMock('../components/SupplyPlanningEmpty', () => ({
      SupplyPlanningEmpty: () => <div data-testid="supply-empty">Empty</div>,
    }))
  })

  it('renders empty state', async () => {
    const { default: Page } = await import('../page')
    renderWithProviders(<Page />)
    expect(screen.getByTestId('supply-empty')).toBeInTheDocument()
  })
})
