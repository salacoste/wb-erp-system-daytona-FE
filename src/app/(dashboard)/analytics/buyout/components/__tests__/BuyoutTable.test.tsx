/**
 * Integration tests for BuyoutTable
 * Story 69.7: Buyout analytics component tests
 * Epic 69: Buyout Rate per-SKU analytics (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BuyoutTable } from '../BuyoutTable'
import type { BySkuBuyoutResponse } from '@/types/analytics-buyout'

const mockUseBuyoutBySku = vi.fn()
const mockUseProducts = vi.fn()

vi.mock('@/hooks/use-buyout-analytics', () => ({
  useBuyoutBySku: (...args: unknown[]) => mockUseBuyoutBySku(...args),
}))
vi.mock('@/hooks/useProducts', () => ({
  useProducts: (...args: unknown[]) => mockUseProducts(...args),
}))

const defaultProps = { from: '2025-12-01', to: '2025-12-31', source: 'blended' as const }

const mockBySkuData: BySkuBuyoutResponse = {
  data: [
    {
      nmId: 100500,
      supplierArticle: 'ART-001',
      productName: 'Товар тестовый',
      brand: 'БрендА',
      salesCount: 120,
      returnsCount: 18,
      buyoutRatePct: 85.0,
      confidence: 'high',
      trend: 'down',
      trendDelta: -3.2,
      returnBreakdown: {
        cancelBeforeShipment: 5,
        refusalAtPvz: 8,
        returnAfterReceipt: 5,
        total: 18,
      },
    },
    {
      nmId: 200600,
      supplierArticle: null,
      productName: null,
      brand: null,
      salesCount: 50,
      returnsCount: 25,
      buyoutRatePct: 50.0,
      confidence: 'low',
      trend: 'stable',
      trendDelta: 0,
      returnBreakdown: null,
    },
  ],
  pagination: { total: 80, limit: 50, offset: 0, hasMore: true },
}

const mockProducts = {
  products: [
    { nm_id: 100500, sa_name: 'Полное название товара', brand: 'ПродБренд', vendor_code: 'VC-100' },
  ],
}

function hookReturn(overrides: Record<string, unknown> = {}) {
  return { data: undefined, isLoading: false, isError: false, ...overrides }
}

describe('BuyoutTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProducts.mockReturnValue(hookReturn({ data: mockProducts }))
  })

  it('shows loading skeleton while fetching', () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ isLoading: true }))
    const { container } = renderWithProviders(<BuyoutTable {...defaultProps} />)
    const skeleton = container.querySelector('[class*="h-96"]')
    expect(skeleton).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ isError: true }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    expect(screen.getByText('Не удалось загрузить данные выкупов')).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    const empty = { data: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } }
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: empty }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('renders table headers correctly', () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: mockBySkuData }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    expect(screen.getByText('nmId')).toBeInTheDocument()
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Товар')).toBeInTheDocument()
    expect(screen.getByText('Бренд')).toBeInTheDocument()
    expect(screen.getByText('Продажи')).toBeInTheDocument()
    expect(screen.getByText('Возвраты')).toBeInTheDocument()
    expect(screen.getByText('До отправки')).toBeInTheDocument()
    expect(screen.getByText('Уверенность')).toBeInTheDocument()
  })

  it('renders item rows with data', () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: mockBySkuData }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    expect(screen.getByText('100500')).toBeInTheDocument()
    expect(screen.getByText('200600')).toBeInTheDocument()
    expect(screen.getByText('85.0%')).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })

  it('shows product info from backend + products enrichment', () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: mockBySkuData }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    // Артикул: backend supplierArticle takes priority over products vendorCode
    expect(screen.getByText('ART-001')).toBeInTheDocument()
    // Товар: products sa_name takes priority over backend productName
    expect(screen.getByText('Полное название товара')).toBeInTheDocument()
  })

  it('handles sort click (toggle order, reset offset)', async () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: mockBySkuData }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    const user = userEvent.setup()

    // Click "Продажи" sort button — changes sort field to salesCount, order=asc
    const salesBtn = screen.getByRole('button', { name: /Продажи/i })
    await user.click(salesBtn)

    // Hook should be called with new sort params
    const lastCall = mockUseBuyoutBySku.mock.calls.at(-1)
    expect(lastCall?.[2]).toMatchObject({ sort: 'salesCount', sortOrder: 'asc', offset: 0 })
  })

  it('shows pagination controls', () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: mockBySkuData }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    expect(screen.getByText('Назад')).toBeInTheDocument()
    expect(screen.getByText('Далее')).toBeInTheDocument()
    expect(screen.getByText(/1–50 из 80/)).toBeInTheDocument()
  })

  it('disables "Назад" when offset is 0', () => {
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: mockBySkuData }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    expect(screen.getByText('Назад').closest('button')).toBeDisabled()
  })

  it('disables "Далее" when hasMore is false', () => {
    const noMore = {
      ...mockBySkuData,
      pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
    }
    mockUseBuyoutBySku.mockReturnValue(hookReturn({ data: noMore }))
    renderWithProviders(<BuyoutTable {...defaultProps} />)
    expect(screen.getByText('Далее').closest('button')).toBeDisabled()
  })
})
