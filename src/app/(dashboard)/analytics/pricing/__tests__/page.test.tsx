/**
 * Unit Tests for Price Recommendations Page
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import PricingPage from '../page'
import type { PriceRecommendation } from '@/types/price-recommendations'

const mockPriceRecommendations = vi.fn()
const mockPriceRefresh = vi.fn()
const mockPriceHistory = vi.fn()

vi.mock('@/hooks/usePriceRecommendations', () => ({
  usePriceRecommendations: (...args: unknown[]) => mockPriceRecommendations(...args),
  usePriceRefresh: () => ({
    mutate: mockPriceRefresh,
    isPending: false,
  }),
  usePriceRecommendationHistory: (...args: unknown[]) => mockPriceHistory(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/pricing',
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { cabinetId: string | null }) => string | null) =>
    selector({ cabinetId: 'cab-test-1' }),
}))

vi.mock('../components/PricingBasisToggle', () => ({
  PricingBasisToggle: () => <div data-testid="pricing-basis-toggle">Базис</div>,
}))

const sampleItem: PriceRecommendation = {
  id: 'price-1',
  nmId: 12345678,
  vendorCode: 'SKU-001',
  productName: 'Товар тестовый',
  lastPrice: 1500,
  breakEvenPrice: 800,
  recommendedPrice: 1200,
  marginAtCurrentPct: 25.5,
  marginAtRecommendedPct: 33.3,
  gap: -300,
  gapPct: -20,
  targetMarginPct: 15,
  computedAt: '2026-06-07T10:00:00Z',
  priceBasis: 'SELLER',
  validationFlags: [],
  alternativeBasisPrice: null,
}

const sampleItemAbove: PriceRecommendation = {
  id: 'price-2',
  nmId: 87654321,
  vendorCode: 'SKU-002',
  productName: 'Товар выше цели',
  lastPrice: 2000,
  breakEvenPrice: 900,
  recommendedPrice: 1800,
  marginAtCurrentPct: 40,
  marginAtRecommendedPct: 50,
  gap: 200,
  gapPct: 10,
  targetMarginPct: 15,
  computedAt: '2026-06-07T10:00:00Z',
  priceBasis: 'SELLER',
  validationFlags: [],
  alternativeBasisPrice: null,
}

function okResponse(items: PriceRecommendation[] = [sampleItem, sampleItemAbove]) {
  return {
    data: { items, total: items.length, nextCursor: null },
    isLoading: false,
    isError: false,
    error: null,
  }
}

function setupMocks(items?: PriceRecommendation[]) {
  mockPriceRecommendations.mockReturnValue(okResponse(items))
  mockPriceHistory.mockReturnValue({ data: [], isLoading: false })
}

function renderPage() {
  return renderWithProviders(<PricingPage />)
}

// Page Header

describe('PricingPage - Page Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders h1 title', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Рекомендации по ценам/ })).toBeInTheDocument()
  })

  it('renders subtitle description', () => {
    renderPage()
    expect(
      screen.getByText(/Рекомендованные цены для достижения целевой маржинальности/)
    ).toBeInTheDocument()
  })

  it('renders breadcrumbs', () => {
    renderPage()
    expect(screen.getByText('Аналитика')).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument()
  })

  it('renders the basis toggle in the header (SPP-1.7-FE)', () => {
    renderPage()
    expect(screen.getByTestId('pricing-basis-toggle')).toBeInTheDocument()
  })
})

// Filters

describe('PricingPage - Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders target margin label with default 15%', () => {
    renderPage()
    expect(screen.getByText(/Целевая маржа: 15%/)).toBeInTheDocument()
  })

  it('renders gap filter label', () => {
    renderPage()
    expect(screen.getByText('Фильтр по разрыву')).toBeInTheDocument()
  })

  it('renders sort label', () => {
    renderPage()
    expect(screen.getByText('Сортировка')).toBeInTheDocument()
  })

  it('renders slider range labels', () => {
    renderPage()
    expect(screen.getByText('5%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})

// Summary Cards

describe('PricingPage - Summary Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders all four summary card titles', () => {
    renderPage()
    expect(screen.getByText('Всего SKU')).toBeInTheDocument()
    expect(screen.getByText('Средний разрыв')).toBeInTheDocument()
    expect(screen.getByText('Ниже цели')).toBeInTheDocument()
    expect(screen.getByText('Выше цели')).toBeInTheDocument()
  })

  it('renders total SKU count', () => {
    renderPage()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders below target count with description', () => {
    renderPage()
    expect(screen.getByText('рекомендуется повышение')).toBeInTheDocument()
  })

  it('renders above target count with description', () => {
    renderPage()
    expect(screen.getByText('цель достигнута')).toBeInTheDocument()
  })

  it('renders "с рекомендациями" sublabel', () => {
    renderPage()
    expect(screen.getByText('с рекомендациями')).toBeInTheDocument()
  })
})

// Recommendations Table

describe('PricingPage - Recommendations Table', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders table header with Рекомендации title', () => {
    renderPage()
    expect(screen.getByText('Рекомендации')).toBeInTheDocument()
  })

  it('renders count badge with total', () => {
    renderPage()
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('renders table column headers', () => {
    renderPage()
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Товар')).toBeInTheDocument()
    expect(screen.getByText('Текущая цена')).toBeInTheDocument()
    expect(screen.getByText('Рекомендация')).toBeInTheDocument()
    expect(screen.getByText('Разрыв')).toBeInTheDocument()
    expect(screen.getByText('Маржа (текущ.)')).toBeInTheDocument()
    expect(screen.getByText('Маржа (рек.)')).toBeInTheDocument()
  })

  it('renders item vendor codes in table', () => {
    renderPage()
    expect(screen.getByText('SKU-001')).toBeInTheDocument()
    expect(screen.getByText('SKU-002')).toBeInTheDocument()
  })

  it('renders product names in table', () => {
    renderPage()
    expect(screen.getByText('Товар тестовый')).toBeInTheDocument()
    expect(screen.getByText('Товар выше цели')).toBeInTheDocument()
  })
})

// Loading State

describe('PricingPage - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPriceRecommendations.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    })
    mockPriceHistory.mockReturnValue({ data: null, isLoading: true })
  })

  it('renders page header during loading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Рекомендации по ценам/ })).toBeInTheDocument()
  })

  it('renders refresh button during loading', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument()
  })

  it('renders filters during loading', () => {
    renderPage()
    expect(screen.getByText(/Целевая маржа/)).toBeInTheDocument()
  })

  it('renders table header during loading', () => {
    renderPage()
    expect(screen.getByText('Рекомендации')).toBeInTheDocument()
  })

  it('does not show count badge during loading', () => {
    renderPage()
    expect(screen.queryByText('(2)')).not.toBeInTheDocument()
  })
})

// Error State

describe('PricingPage - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPriceRecommendations.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Server error'),
    })
    mockPriceHistory.mockReturnValue({ data: null, isLoading: false })
  })

  it('displays error alert in Russian', () => {
    renderPage()
    expect(screen.getByText(/Не удалось загрузить рекомендации по ценам/)).toBeInTheDocument()
  })

  it('retains page header on error', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Рекомендации по ценам/ })).toBeInTheDocument()
  })

  it('retains refresh button on error', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument()
  })

  it('does not render table on error', () => {
    renderPage()
    expect(screen.queryByText('Артикул')).not.toBeInTheDocument()
  })

  it('does not render filters on error', () => {
    renderPage()
    expect(screen.queryByText('Фильтр по разрыву')).not.toBeInTheDocument()
  })
})

// Empty State

describe('PricingPage - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPriceRecommendations.mockReturnValue({
      data: { items: [], total: 0, nextCursor: null },
      isLoading: false,
      isError: false,
      error: null,
    })
    mockPriceHistory.mockReturnValue({ data: [], isLoading: false })
  })

  it('renders empty table message', () => {
    renderPage()
    expect(screen.getByText(/Нет рекомендаций по ценам/)).toBeInTheDocument()
  })

  it('keeps pricing filters visible when the current filter result is empty', () => {
    renderPage()

    expect(screen.getByText(/Нет рекомендаций/)).toBeInTheDocument()
    expect(screen.getByText(/Целевая маржа:/)).toBeInTheDocument()
    expect(screen.getByText('Фильтр по разрыву')).toBeInTheDocument()
    expect(screen.getByText('Сортировка')).toBeInTheDocument()
  })

  it('does not show count badge for zero total', () => {
    renderPage()
    expect(screen.queryByText('(0)')).not.toBeInTheDocument()
  })

  it('renders page header with empty data', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Рекомендации по ценам/ })).toBeInTheDocument()
  })

  it('does not render summary cards with empty data', () => {
    renderPage()
    expect(screen.queryByText('Всего SKU')).not.toBeInTheDocument()
  })
})

// Single Item State

describe('PricingPage - Single Item', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks([sampleItem])
  })

  it('renders count badge as (1)', () => {
    renderPage()
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  it('renders single item data', () => {
    renderPage()
    expect(screen.getByText('SKU-001')).toBeInTheDocument()
    expect(screen.getByText('Товар тестовый')).toBeInTheDocument()
  })

  it('renders single SKU count in summary', () => {
    renderPage()
    // '1' appears in multiple summary cards (Всего SKU, Ниже цели)
    const ones = screen.getAllByText('1')
    expect(ones.length).toBeGreaterThanOrEqual(1)
  })
})

// Price History Sheet

describe('PricingPage - Price History Sheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('does not render sheet when closed', () => {
    renderPage()
    expect(screen.queryByText(/История цен/)).not.toBeInTheDocument()
  })
})

// Refresh Behavior

describe('PricingPage - Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('refresh button click triggers refresh mutation', () => {
    renderPage()
    screen.getByRole('button', { name: /Обновить/ }).click()
    expect(mockPriceRefresh).toHaveBeenCalled()
  })
})

// Accessibility

describe('PricingPage - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('has proper heading hierarchy (single h1)', () => {
    renderPage()
    const h1s = screen.getAllByRole('heading').filter(h => h.tagName === 'H1')
    expect(h1s).toHaveLength(1)
  })

  it('refresh button is keyboard accessible', () => {
    renderPage()
    const btn = screen.getByRole('button', { name: /Обновить/ })
    expect(btn).toBeInTheDocument()
    expect(btn.tagName).toBe('BUTTON')
  })
})

// Full Integration

describe('PricingPage - Full Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders complete page: header + filters + cards + table', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Рекомендации по ценам/ })).toBeInTheDocument()
    expect(screen.getByText(/Целевая маржа/)).toBeInTheDocument()
    expect(screen.getByText('Всего SKU')).toBeInTheDocument()
    expect(screen.getByText('Рекомендации')).toBeInTheDocument()
    expect(screen.getByText('SKU-001')).toBeInTheDocument()
  })

  it('unmounts without errors', () => {
    const { unmount } = renderPage()
    expect(() => unmount()).not.toThrow()
  })

  it('recovers from error on rerender', () => {
    mockPriceRecommendations.mockReturnValueOnce({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('API Error'),
    })
    const { rerender } = renderPage()
    expect(screen.getByText(/Не удалось загрузить рекомендации/)).toBeInTheDocument()
    mockPriceRecommendations.mockReturnValue(okResponse())
    rerender(<PricingPage />)
    expect(screen.queryByText(/Не удалось загрузить рекомендации/)).not.toBeInTheDocument()
  })

  it('passes correct default params to hook (target_margin=15)', () => {
    renderPage()
    const call = mockPriceRecommendations.mock.calls[0][0]
    expect(call.target_margin_pct).toBe(15)
    expect(call.limit).toBe(50)
  })
})
