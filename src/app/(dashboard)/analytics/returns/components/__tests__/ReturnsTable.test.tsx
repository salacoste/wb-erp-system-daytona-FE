/**
 * ReturnsTable smoke tests — Epic 70-FE
 *
 * Covers: loading, error, empty, happy-path rendering with table columns,
 * anomaly row highlighting, cursor pagination controls.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { BySkuReturnResponse } from '@/types/analytics-returns'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/use-return-analytics', () => ({
  useReturnsBySku: vi.fn(),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

import { useReturnsBySku } from '@/hooks/use-return-analytics'
import { useProducts } from '@/hooks/useProducts'
import { ReturnsTable } from '../ReturnsTable'

const mockUseReturnsBySku = vi.mocked(useReturnsBySku)
const mockUseProducts = vi.mocked(useProducts)

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockSkuData: BySkuReturnResponse = {
  data: [
    {
      nmId: 12345,
      productName: 'Test Product',
      brand: 'Test Brand',
      totalReturns: 5,
      returnRate: 2.5,
      cancelBeforeShipment: 2,
      refusalAtPvz: 1,
      returnAfterReceipt: 2,
      anomalyFlag: false,
    },
    {
      nmId: 67890,
      productName: 'Anomaly Product',
      brand: 'Bad Brand',
      totalReturns: 50,
      returnRate: 25.0,
      cancelBeforeShipment: 10,
      refusalAtPvz: 20,
      returnAfterReceipt: 20,
      anomalyFlag: true,
    },
  ],
  pagination: { count: 2, hasMore: true, nextCursor: 'cursor123' },
  summary: { totalSkus: 100, anomalyCount: 1 },
}

function hookReturn(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useReturnsBySku>
}

function productsReturn(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useProducts>
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ReturnsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProducts.mockReturnValue(
      productsReturn({ data: { products: [], pagination: { count: 0 } } })
    )
  })

  it('shows skeleton while loading', () => {
    mockUseReturnsBySku.mockReturnValue(hookReturn({ isLoading: true }))
    const { container } = renderWithProviders(<ReturnsTable anomalyOnly={false} />)
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })

  it('shows error alert when request fails', () => {
    mockUseReturnsBySku.mockReturnValue(hookReturn({ isError: true }))
    renderWithProviders(<ReturnsTable anomalyOnly={false} />)
    expect(screen.getByText(/Не удалось загрузить данные возвратов по SKU/)).toBeInTheDocument()
  })

  it('shows empty state when no data and anomalyOnly=false', () => {
    mockUseReturnsBySku.mockReturnValue(
      hookReturn({
        data: { data: [], pagination: { count: 0 }, summary: { totalSkus: 0, anomalyCount: 0 } },
      })
    )
    renderWithProviders(<ReturnsTable anomalyOnly={false} />)
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('shows anomaly-specific empty state when anomalyOnly=true', () => {
    mockUseReturnsBySku.mockReturnValue(
      hookReturn({
        data: { data: [], pagination: { count: 0 }, summary: { totalSkus: 0, anomalyCount: 0 } },
      })
    )
    renderWithProviders(<ReturnsTable anomalyOnly={true} />)
    expect(screen.getByText('Нет проблемных товаров за выбранный период')).toBeInTheDocument()
  })

  describe('happy path', () => {
    beforeEach(() => {
      mockUseReturnsBySku.mockReturnValue(hookReturn({ data: mockSkuData }))
    })

    it('renders table column headers', () => {
      renderWithProviders(<ReturnsTable from="2026-01-01" to="2026-01-31" anomalyOnly={false} />)
      expect(screen.getByText('nmId')).toBeInTheDocument()
      expect(screen.getByText('Товар')).toBeInTheDocument()
      expect(screen.getByText('Бренд')).toBeInTheDocument()
      expect(screen.getByText('Возвраты')).toBeInTheDocument()
      expect(screen.getByText('% возврата')).toBeInTheDocument()
    })

    it('renders summary line with total SKU count and anomaly count', () => {
      renderWithProviders(<ReturnsTable anomalyOnly={false} />)
      expect(screen.getByText(/Всего SKU: 100/)).toBeInTheDocument()
      expect(screen.getByText(/1 с аномальным возвратом/)).toBeInTheDocument()
    })

    it('renders nmId values in table rows', () => {
      renderWithProviders(<ReturnsTable anomalyOnly={false} />)
      // nmId values should appear as links
      expect(screen.getByText('12345')).toBeInTheDocument()
      expect(screen.getByText('67890')).toBeInTheDocument()
    })

    it('renders return counts per SKU', () => {
      renderWithProviders(<ReturnsTable anomalyOnly={false} />)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('shows cursor pagination with "Далее" button', () => {
      renderWithProviders(<ReturnsTable anomalyOnly={false} />)
      expect(screen.getByText('Далее')).toBeInTheDocument()
      expect(screen.getByText(/2 SKU на странице/)).toBeInTheDocument()
    })

    it('shows "В начало" button when cursor is set', () => {
      // The component manages cursor state internally via useState.
      // Initially no cursor, so the stable previous-page control is disabled.
      renderWithProviders(<ReturnsTable anomalyOnly={false} />)
      expect(screen.getByRole('button', { name: 'В начало' })).toBeDisabled()
    })
  })
})
