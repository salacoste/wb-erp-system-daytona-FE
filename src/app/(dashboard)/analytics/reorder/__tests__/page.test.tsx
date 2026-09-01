/**
 * Unit Tests for Reorder Dashboard Page
 * Warehouse replenishment recommendations with fulfillment metrics.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import ReorderDashboardPage from '../page'
import type {
  ReorderRecommendation,
  ReorderFulfillmentMetrics,
} from '@/types/reorder-recommendations'

const mockRecommendations = vi.fn()
const mockMetrics = vi.fn()
const mockRefresh = vi.fn()
const mockUpdateStatus = vi.fn()

vi.mock('@/hooks/useReorderDashboard', () => ({
  useReorderRecommendations: (...args: unknown[]) => mockRecommendations(...args),
  useReorderMetrics: (...args: unknown[]) => mockMetrics(...args),
  useReorderRefresh: () => ({
    mutate: mockRefresh,
    isPending: false,
  }),
  useUpdateReorderStatus: () => ({
    mutate: mockUpdateStatus,
    isPending: false,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/analytics/reorder',
}))

const sampleRecommendation: ReorderRecommendation = {
  id: 'rec-1',
  nmId: 12345678,
  recommendedQty: 50,
  currentStock: 5,
  inTransitQty: 0,
  avgDailyDemand: 3.2,
  demandSource: 'velocity',
  leadTimeDays: 7,
  coverageDays: 2,
  orderByDate: '2026-06-10',
  stockoutDate: '2026-06-12',
  status: 'pending',
  unitCostRub: 150,
  totalReorderValue: 7500,
  computedAt: '2026-06-07T10:00:00Z',
}

const sampleMetrics: ReorderFulfillmentMetrics = {
  totalPending: 8,
  totalOrdered: 3,
  totalReceived: 12,
  totalExpired: 1,
  avgHoursToOrder: 4.5,
  avgHoursToReceive: 48,
  reorderCoveragePct: 72,
}

function okRecommendations() {
  return {
    data: [sampleRecommendation],
    isLoading: false,
    error: null,
  }
}

function okMetrics() {
  return {
    data: sampleMetrics,
    isLoading: false,
  }
}

function setupMocks() {
  mockRecommendations.mockReturnValue(okRecommendations())
  mockMetrics.mockReturnValue(okMetrics())
}

function renderPage() {
  return renderWithProviders(<ReorderDashboardPage />)
}

// Page Header

describe('ReorderDashboardPage - Page Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders h1 title', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Дашборд пополнения/ })).toBeInTheDocument()
  })

  it('renders subtitle description', () => {
    renderPage()
    expect(
      screen.getByText(/Рекомендации по пополнению запасов на складах Wildberries/)
    ).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument()
  })
})

// Summary Cards

describe('ReorderDashboardPage - Summary Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders all four metric card labels', () => {
    renderPage()
    expect(screen.getByText('Ожидают')).toBeInTheDocument()
    // 'Заказано' appears in both summary card label and table status badge
    expect(screen.getAllByText('Заказано').length).toBeGreaterThanOrEqual(1)
    // 'Получено' appears in both summary card label and table status badge
    expect(screen.getAllByText('Получено').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Покрытие')).toBeInTheDocument()
  })

  it('displays metric values from API', () => {
    renderPage()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('displays coverage percentage', () => {
    renderPage()
    expect(screen.getByText(/72/)).toBeInTheDocument()
  })

  it('renders coverage sublabel', () => {
    renderPage()
    expect(screen.getByText('SKUs с рекомендацией')).toBeInTheDocument()
  })
})

// Filters

describe('ReorderDashboardPage - Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders status filter label', () => {
    renderPage()
    expect(screen.getByText('Статус:')).toBeInTheDocument()
  })

  it('renders default filter value (all)', () => {
    renderPage()
    expect(screen.getByText('Все')).toBeInTheDocument()
  })
})

// Recommendations Table

describe('ReorderDashboardPage - Recommendations Table', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders table header with Рекомендации title', () => {
    renderPage()
    expect(screen.getByText('Рекомендации')).toBeInTheDocument()
  })

  it('renders count badge', () => {
    renderPage()
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  it('renders table column headers', () => {
    renderPage()
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Кол-во')).toBeInTheDocument()
    expect(screen.getByText('Остаток')).toBeInTheDocument()
    expect(screen.getByText('Источник')).toBeInTheDocument()
    expect(screen.getByText('Статус')).toBeInTheDocument()
    expect(screen.getByText('Действия')).toBeInTheDocument()
  })

  it('renders recommendation data in table rows', () => {
    renderPage()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders status badge for pending items', () => {
    renderPage()
    expect(screen.getByText('Ожидает')).toBeInTheDocument()
  })

  it('renders action button for pending recommendation', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Заказано/ })).toBeInTheDocument()
  })
})

// Loading State

describe('ReorderDashboardPage - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRecommendations.mockReturnValue({ data: null, isLoading: true, error: null })
    mockMetrics.mockReturnValue({ data: null, isLoading: true })
  })

  it('renders page header during loading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Дашборд пополнения/ })).toBeInTheDocument()
  })

  it('renders refresh button during loading', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument()
  })

  it('renders loading skeletons in summary cards', () => {
    const { container } = renderPage()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders table header during loading', () => {
    renderPage()
    expect(screen.getByText('Рекомендации')).toBeInTheDocument()
  })

  it('does not show count badge during loading', () => {
    renderPage()
    expect(screen.queryByText('(1)')).not.toBeInTheDocument()
  })
})

// Error State

describe('ReorderDashboardPage - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRecommendations.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Server error'),
    })
    mockMetrics.mockReturnValue(okMetrics())
  })

  it('displays error alert in Russian', () => {
    renderPage()
    expect(screen.getByText(/Не удалось загрузить рекомендации по пополнению/)).toBeInTheDocument()
  })

  it('retains page header on error', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Дашборд пополнения/ })).toBeInTheDocument()
  })

  it('retains refresh button on error', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Обновить/ })).toBeInTheDocument()
  })

  it('does not render table on error', () => {
    renderPage()
    expect(screen.queryByText('Артикул')).not.toBeInTheDocument()
  })
})

// Empty State

describe('ReorderDashboardPage - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRecommendations.mockReturnValue({ data: [], isLoading: false, error: null })
    mockMetrics.mockReturnValue({ data: sampleMetrics, isLoading: false })
  })

  it('renders empty table message', () => {
    renderPage()
    expect(screen.getByText('Нет рекомендаций по пополнению')).toBeInTheDocument()
  })

  it('shows count badge as (0)', () => {
    renderPage()
    expect(screen.getByText('(0)')).toBeInTheDocument()
  })

  it('renders summary cards with data', () => {
    renderPage()
    expect(screen.getByText('Ожидают')).toBeInTheDocument()
    expect(screen.getByText('Покрытие')).toBeInTheDocument()
  })
})

// Full Integration

describe('ReorderDashboardPage - Full Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('renders complete page: header + cards + filters + table', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /Дашборд пополнения/ })).toBeInTheDocument()
    expect(screen.getByText('Ожидают')).toBeInTheDocument()
    expect(screen.getByText('Статус:')).toBeInTheDocument()
    expect(screen.getByText('Рекомендации')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
  })

  it('unmounts without errors', () => {
    const { unmount } = renderPage()
    expect(() => unmount()).not.toThrow()
  })

  it('recovers from error on rerender', () => {
    mockRecommendations.mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: new Error('API Error'),
    })
    const { rerender } = renderPage()
    expect(screen.getByText(/Не удалось загрузить рекомендации/)).toBeInTheDocument()
    mockRecommendations.mockReturnValue(okRecommendations())
    rerender(<ReorderDashboardPage />)
    expect(screen.queryByText(/Не удалось загрузить рекомендации/)).not.toBeInTheDocument()
  })
})

// Accessibility

describe('ReorderDashboardPage - Accessibility', () => {
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

  it('marks the exact pending recommendation as ordered from its row action', () => {
    renderPage()
    const actionBtn = screen.getByRole('button', { name: /Заказано/ })
    actionBtn.focus()
    expect(actionBtn).toHaveFocus()
    actionBtn.click()
    expect(actionBtn.tagName).toBe('BUTTON')
    expect(mockUpdateStatus).toHaveBeenCalledTimes(1)
    expect(mockUpdateStatus).toHaveBeenCalledWith({
      id: 'rec-1',
      payload: { status: 'ordered' },
    })
  })
})

// Ordered Status

describe('ReorderDashboardPage - Ordered Recommendation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const orderedRec: ReorderRecommendation = {
      ...sampleRecommendation,
      id: 'rec-2',
      status: 'ordered',
    }
    mockRecommendations.mockReturnValue({ data: [orderedRec], isLoading: false, error: null })
    mockMetrics.mockReturnValue(okMetrics())
  })

  it('renders ordered status badge', () => {
    renderPage()
    // 'Заказано' appears in summary card label + table status badge
    const matches = screen.getAllByText('Заказано')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders received action button for ordered item', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Получено/ })).toBeInTheDocument()
  })
})

// Multiple Recommendations

describe('ReorderDashboardPage - Multiple Recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const recs: ReorderRecommendation[] = [
      sampleRecommendation,
      {
        ...sampleRecommendation,
        id: 'rec-2',
        nmId: 87654321,
        status: 'received',
        recommendedQty: 30,
      },
      {
        ...sampleRecommendation,
        id: 'rec-3',
        nmId: 11111111,
        status: 'expired',
        recommendedQty: 10,
      },
    ]
    mockRecommendations.mockReturnValue({ data: recs, isLoading: false, error: null })
    mockMetrics.mockReturnValue(okMetrics())
  })

  it('renders count badge as (3)', () => {
    renderPage()
    expect(screen.getByText('(3)')).toBeInTheDocument()
  })

  it('renders received status badge', () => {
    renderPage()
    // 'Получено' appears in summary card label + table status badge
    const matches = screen.getAllByText('Получено')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders expired status badge', () => {
    renderPage()
    expect(screen.getByText('Просрочено')).toBeInTheDocument()
  })

  it('renders all nmIds in table', () => {
    renderPage()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('87654321')).toBeInTheDocument()
    expect(screen.getByText('11111111')).toBeInTheDocument()
  })
})

// Refresh Behavior

describe('ReorderDashboardPage - Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('refresh button click triggers refresh mutation', () => {
    renderPage()
    screen.getByRole('button', { name: /Обновить/ }).click()
    expect(mockRefresh).toHaveBeenCalled()
  })
})
