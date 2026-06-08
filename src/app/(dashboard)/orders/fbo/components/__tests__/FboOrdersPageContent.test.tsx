/**
 * FboOrdersPageContent Unit Tests
 *
 * Verifies page-level orchestration:
 * - Renders page title and date filters
 * - Renders tab triggers for Orders and Sales
 * - Date inputs are present with correct testids
 * - Search input is present with correct testid
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FboOrdersPageContent } from '../FboOrdersPageContent'

// Mock all hooks used by the page
vi.mock('@/hooks/useOrdersFbo', () => ({
  useOrdersFbo: () => ({
    data: { items: [], pagination: { total: 0, limit: 20, offset: 0 } },
    isLoading: false,
  }),
  useOrdersFboAggregate: () => ({
    data: {
      count: 50,
      totalPrice: 750000,
      totalFinishedPrice: 675000,
      cancelledCount: 5,
      cancelRate: 10,
      dateRange: { from: '2025-06-01', to: '2025-06-08' },
    },
    isLoading: false,
  }),
  useOrdersFboSyncStatus: () => ({ data: null }),
  useSyncOrdersFbo: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useSalesFbo', () => ({
  useSalesFbo: () => ({
    data: { items: [], pagination: { total: 0, limit: 20, offset: 0 } },
    isLoading: false,
  }),
  useSalesFboAggregate: () => ({
    data: {
      count: 30,
      totalForPay: 500000,
      returnRate: 5.5,
      returnsCount: 3,
      totalFinishedPrice: 550000,
      avgSaleValue: null,
      returnsRevenue: null,
      dateRange: { from: '2025-06-01', to: '2025-06-08' },
    },
    isLoading: false,
  }),
}))

describe('FboOrdersPageContent', () => {
  it('renders page title', () => {
    renderWithProviders(<FboOrdersPageContent />)
    expect(screen.getByText('FBO Заказы и продажи')).toBeInTheDocument()
  })

  it('renders date filter inputs', () => {
    renderWithProviders(<FboOrdersPageContent />)
    expect(screen.getByTestId('fbo-date-from')).toBeInTheDocument()
    expect(screen.getByTestId('fbo-date-to')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderWithProviders(<FboOrdersPageContent />)
    expect(screen.getByTestId('fbo-search')).toBeInTheDocument()
  })

  it('renders tab triggers', () => {
    renderWithProviders(<FboOrdersPageContent />)
    // "Заказы" appears in tab trigger AND aggregate card title — use getAllByText
    expect(screen.getAllByText('Заказы').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('tab', { name: 'Заказы' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Продажи' })).toBeInTheDocument()
  })

  it('renders the page container with testid', () => {
    renderWithProviders(<FboOrdersPageContent />)
    expect(screen.getByTestId('fbo-orders-page')).toBeInTheDocument()
  })
})
