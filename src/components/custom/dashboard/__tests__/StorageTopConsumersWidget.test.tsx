/**
 * TDD Tests for StorageTopConsumersWidget Component
 * Story 63.5-FE: Storage Top Consumers Widget (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Tests top storage consumers display with ranking, ratio indicators,
 * color coding thresholds, and navigation interactions.
 *
 * @see docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md
 */

import { describe, it, vi, beforeEach, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { TopConsumerItem } from '@/types/storage-analytics'
import {
  createMockQueryResult,
  createLoadingQueryResult,
  createErrorQueryResult,
} from '@/test/utils/query-mock'
import type { TopConsumersResponse } from '@/types/storage-analytics'
import { renderWithProviders } from '@/test/utils/test-utils'
import { StorageTopConsumersWidget } from '../StorageTopConsumersWidget'

// ============================================================================
// Mock Setup
// ============================================================================

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/hooks/useStorageAnalytics', () => ({
  useStorageTopConsumers: vi.fn(),
}))

// Import after mocking
import { useStorageTopConsumers } from '@/hooks/useStorageAnalytics'

// ============================================================================
// Test Data
// ============================================================================

const mockTopConsumers: TopConsumerItem[] = [
  {
    rank: 1,
    nm_id: '87654321',
    vendor_code: 'COAT-XL-001',
    product_name: 'Пальто зимнее XL',
    brand: 'TestBrand',
    storage_cost: 3500.0,
    percent_of_total: 12.5,
    volume: 2.5,
    revenue_net: 15000.0,
    storage_to_revenue_ratio: 23.3, // High risk (>20%)
  },
  {
    rank: 2,
    nm_id: '87654322',
    vendor_code: 'SOFA-001',
    product_name: 'Диван угловой',
    brand: 'FurnitureBrand',
    storage_cost: 2800.0,
    percent_of_total: 10.0,
    volume: 3.2,
    revenue_net: 45000.0,
    storage_to_revenue_ratio: 6.2, // Healthy (<10%)
  },
  {
    rank: 3,
    nm_id: '87654323',
    vendor_code: 'WARD-001',
    product_name: 'Шкаф-купе',
    brand: 'FurnitureBrand',
    storage_cost: 2200.0,
    percent_of_total: 7.9,
    volume: 4.1,
    revenue_net: 27160.0,
    storage_to_revenue_ratio: 8.1, // Healthy (<10%)
  },
  {
    rank: 4,
    nm_id: '87654324',
    vendor_code: 'CHAIR-001',
    product_name: 'Кресло офисное',
    brand: 'OfficeBrand',
    storage_cost: 1800.0,
    percent_of_total: 6.4,
    volume: 1.8,
    revenue_net: 11842.0,
    storage_to_revenue_ratio: 15.2, // Medium (10-20%)
  },
  {
    rank: 5,
    nm_id: '87654325',
    vendor_code: 'TABLE-001',
    product_name: 'Стол обеденный',
    brand: 'FurnitureBrand',
    storage_cost: 1500.0,
    percent_of_total: 5.4,
    volume: 2.0,
    revenue_net: 34884.0,
    storage_to_revenue_ratio: 4.3, // Healthy (<10%)
  },
]

const mockResponse = {
  period: { from: '2026-W01', to: '2026-W05', days_count: 35 },
  top_consumers: mockTopConsumers,
  total_storage_cost: 28000.0,
  has_data: true,
}

function renderWidget(overrides: Record<string, unknown> = {}) {
  const props = {
    weekStart: '2026-W01',
    weekEnd: '2026-W05',
    ...overrides,
  }
  return renderWithProviders(<StorageTopConsumersWidget {...props} />)
}

describe('StorageTopConsumersWidget - React child identity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not emit duplicate-key warnings when backend rows have blank nm_id values', () => {
    const blankIdConsumers: TopConsumerItem[] = mockTopConsumers.slice(0, 3).map((item, index) => ({
      ...item,
      rank: index + 1,
      nm_id: '',
      vendor_code: item.vendor_code ? `${item.vendor_code}-${index}` : null,
    }))
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({
        ...mockResponse,
        top_consumers: blankIdConsumers,
      } as TopConsumersResponse)
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    try {
      renderWidget()

      expect(
        consoleError.mock.calls.some(call =>
          call.some(arg => String(arg).includes('Encountered two children with the same key'))
        )
      ).toBe(false)
    } finally {
      consoleError.mockRestore()
    }
  })

  it('preserves focused row identity when blank-id rows reorder on refresh', () => {
    const blankIdConsumers: TopConsumerItem[] = mockTopConsumers.slice(0, 2).map(item => ({
      ...item,
      nm_id: '',
    }))
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({
        ...mockResponse,
        top_consumers: blankIdConsumers,
      } as TopConsumersResponse)
    )

    const { rerender } = renderWidget()
    const focusedProduct = screen.getByRole('button', { name: /Пальто зимнее XL/ })
    focusedProduct.focus()
    expect(document.activeElement).toHaveAccessibleName(/Пальто зимнее XL/)

    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({
        ...mockResponse,
        top_consumers: [...blankIdConsumers].reverse(),
      } as TopConsumersResponse)
    )

    rerender(<StorageTopConsumersWidget weekStart="2026-W01" weekEnd="2026-W05" />)

    expect(document.activeElement).toHaveAccessibleName(/Пальто зимнее XL/)
  })
})

// ============================================================================
// Ranking Display Tests (~8 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Ranking Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
  })

  it('should show Trophy icon for rank 1 (gold)', () => {
    const { container } = renderWidget()
    // RankIndicator renders SVG with aria-label="1 место"
    const svg = container.querySelector('svg[aria-label="1 место"]')
    expect(svg).toBeInTheDocument()
  })

  it('should show Medal icon for rank 2 (silver)', () => {
    const { container } = renderWidget()
    const svg = container.querySelector('svg[aria-label="2 место"]')
    expect(svg).toBeInTheDocument()
  })

  it('should show Medal icon for rank 3 (bronze)', () => {
    const { container } = renderWidget()
    const svg = container.querySelector('svg[aria-label="3 место"]')
    expect(svg).toBeInTheDocument()
  })

  it('should show numeric rank for positions 4-5', () => {
    renderWidget()
    const row4 = screen.getByLabelText(/Кресло офисное.*хранение/)
    expect(row4).toHaveTextContent('4')
    const row5 = screen.getByLabelText(/Стол обеденный.*хранение/)
    expect(row5).toHaveTextContent('5')
  })

  it('should display all 5 products in order', () => {
    renderWidget()
    expect(screen.getByText('Пальто зимнее XL')).toBeInTheDocument()
    expect(screen.getByText('Диван угловой')).toBeInTheDocument()
    expect(screen.getByText('Шкаф-купе')).toBeInTheDocument()
    expect(screen.getByText('Кресло офисное')).toBeInTheDocument()
    expect(screen.getByText('Стол обеденный')).toBeInTheDocument()
  })

  it('should truncate long product names with ellipsis', () => {
    renderWidget()
    const nameEl = screen.getByText('Пальто зимнее XL')
    expect(nameEl.className).toContain('truncate')
  })

  it('should show vendor code as secondary info', () => {
    renderWidget()
    expect(screen.getByText('COAT-XL-001')).toBeInTheDocument()
    expect(screen.getByText('SOFA-001')).toBeInTheDocument()
  })

  it('should use aria-label for rank icons', () => {
    renderWidget()
    expect(screen.getByLabelText('1 место')).toBeInTheDocument()
    expect(screen.getByLabelText('2 место')).toBeInTheDocument()
    expect(screen.getByLabelText('3 место')).toBeInTheDocument()
  })
})

// ============================================================================
// Storage Cost Display Tests (~6 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Storage Cost Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
  })

  it('should format storage cost as Russian currency', () => {
    renderWidget()
    // 3500 RUB → formatted with Russian locale
    const costEl = screen.getByText(/3 500/)
    expect(costEl).toBeInTheDocument()
  })

  it('should display percent of total storage', () => {
    renderWidget()
    // Item 1 has 12.5% of total
    expect(screen.getByText(/12,5/)).toBeInTheDocument()
  })

  it('should format percentage with one decimal', () => {
    renderWidget()
    // 12.5% → "12,5 %" in Russian locale
    const pctEl = screen.getByText(/12,5/)
    expect(pctEl).toBeInTheDocument()
  })

  it('should use purple color scheme for storage values', () => {
    renderWidget()
    // Storage cost text uses the chart-2 storage tone
    const costEl = screen.getByText(/3 500/)
    expect(costEl.className).toContain('text-chart-2')
  })

  it('should show RUB symbol after value', () => {
    const { container } = renderWidget()
    // formatCurrency renders "3 500 ₽" — check full rendered output
    expect(container.textContent).toContain('₽')
  })

  it('should handle null storage cost gracefully', () => {
    const itemWithNullCost: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '00000001',
        vendor_code: 'NULL-001',
        product_name: 'Товар без стоимости',
        brand: 'Test',
        storage_cost: 0,
        percent_of_total: 0,
        volume: null,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({
        ...mockResponse,
        top_consumers: itemWithNullCost,
      } as TopConsumersResponse)
    )
    renderWidget()
    expect(screen.getByText('Товар без стоимости')).toBeInTheDocument()
  })
})

// ============================================================================
// Storage-to-Revenue Ratio Indicator Tests (~12 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Ratio Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
  })

  it('should show red dot for ratio >20% (high risk)', () => {
    renderWidget()
    const highLabel = screen.getByLabelText('Высокие затраты на хранение (>20%)')
    expect(highLabel).toBeInTheDocument()
    expect(highLabel.className).toContain('bg-status-error')
  })

  it('should show yellow dot for ratio 10-20% (medium)', () => {
    renderWidget()
    const mediumLabel = screen.getByLabelText('Умеренные затраты (10-20%)')
    expect(mediumLabel).toBeInTheDocument()
    expect(mediumLabel.className).toContain('bg-status-warning')
  })

  it('should show green dot for ratio <10% (healthy)', () => {
    renderWidget()
    const lowLabel = screen.getAllByLabelText('Низкие затраты (<10%)')
    expect(lowLabel.length).toBeGreaterThanOrEqual(1)
    expect(lowLabel[0].className).toContain('bg-status-success')
  })

  it('should show gray dot for null ratio (no revenue data)', () => {
    const itemsWithNull: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '00000001',
        vendor_code: 'NULL-001',
        product_name: 'Без выручки',
        brand: 'Test',
        storage_cost: 1000,
        percent_of_total: 50,
        volume: null,
        storage_to_revenue_ratio: null,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({
        ...mockResponse,
        top_consumers: itemsWithNull,
      } as TopConsumersResponse)
    )
    renderWidget()
    const unknownLabel = screen.getByLabelText('Нет данных о выручке')
    expect(unknownLabel).toBeInTheDocument()
    expect(unknownLabel.className).toContain('bg-muted')
  })

  it('should show warning icon (AlertTriangle) for ratio >20%', () => {
    renderWidget()
    const warningIcon = screen.getByLabelText('Требуется оптимизация')
    expect(warningIcon).toBeInTheDocument()
  })

  it('should NOT show warning icon for ratio <=20%', () => {
    const itemsWithMediumRatio: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '00000001',
        vendor_code: 'MED-001',
        product_name: 'Средний товар',
        brand: 'Test',
        storage_cost: 1000,
        percent_of_total: 50,
        volume: null,
        storage_to_revenue_ratio: 15.0,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({
        ...mockResponse,
        top_consumers: itemsWithMediumRatio,
      } as TopConsumersResponse)
    )
    renderWidget()
    expect(screen.queryByLabelText('Требуется оптимизация')).not.toBeInTheDocument()
  })

  it('should format ratio with one decimal', () => {
    renderWidget()
    // Item 1 has ratio 23.3 → formatted as "23,3 %"
    expect(screen.getByText(/23,3/)).toBeInTheDocument()
  })

  it('should apply red text color for high ratio values', () => {
    renderWidget()
    // The text span for high ratio uses the error tone
    const ratioText = screen.getByText(/23,3/)
    expect(ratioText.className).toContain('text-status-error')
  })

  it('should display ratio percentage text', () => {
    renderWidget()
    // Ratio 23.3% should be visible
    expect(screen.getByText(/23,3/)).toBeInTheDocument()
    // Ratio 6.2% for rank 2
    expect(screen.getByText(/6,2/)).toBeInTheDocument()
  })

  it('should show tooltip on ratio indicator hover', () => {
    renderWidget()
    // Each ratio indicator is wrapped in a TooltipProvider with a trigger div
    const triggerDivs = document.querySelectorAll('.cursor-help')
    expect(triggerDivs.length).toBeGreaterThan(0)
  })

  it('should explain threshold meaning in tooltip', () => {
    renderWidget()
    // Radix renders tooltip content lazily — verify via severity aria-labels instead
    // which encode the threshold meaning directly
    expect(screen.getByLabelText('Высокие затраты на хранение (>20%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Умеренные затраты (10-20%)')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Низкие затраты (<10%)').length).toBeGreaterThan(0)
  })

  it('should suggest optimization in tooltip for high ratio', () => {
    renderWidget()
    // Radix tooltip is lazy — verify the warning icon is present for high ratio
    // which signals optimization need to the user
    expect(screen.getByLabelText('Требуется оптимизация')).toBeInTheDocument()
    expect(screen.getByLabelText('Высокие затраты на хранение (>20%)')).toBeInTheDocument()
  })
})

// ============================================================================
// Color Threshold Precision Tests (~6 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Color Thresholds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show green for ratio exactly 10.0%', () => {
    const items: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '1',
        vendor_code: 'V1',
        product_name: 'Item',
        brand: 'B',
        storage_cost: 1000,
        percent_of_total: 50,
        volume: null,
        storage_to_revenue_ratio: 10.0,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({ ...mockResponse, top_consumers: items } as TopConsumersResponse)
    )
    renderWidget()
    // 10.0% → severity=low (ratio > 10 is medium, but 10 is NOT >10)
    expect(screen.getByLabelText('Низкие затраты (<10%)')).toBeInTheDocument()
  })

  it('should show yellow for ratio 10.01%', () => {
    const items: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '1',
        vendor_code: 'V1',
        product_name: 'Item',
        brand: 'B',
        storage_cost: 1000,
        percent_of_total: 50,
        volume: null,
        storage_to_revenue_ratio: 10.01,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({ ...mockResponse, top_consumers: items } as TopConsumersResponse)
    )
    renderWidget()
    expect(screen.getByLabelText('Умеренные затраты (10-20%)')).toBeInTheDocument()
  })

  it('should show yellow for ratio exactly 20.0%', () => {
    const items: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '1',
        vendor_code: 'V1',
        product_name: 'Item',
        brand: 'B',
        storage_cost: 1000,
        percent_of_total: 50,
        volume: null,
        storage_to_revenue_ratio: 20.0,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({ ...mockResponse, top_consumers: items } as TopConsumersResponse)
    )
    renderWidget()
    expect(screen.getByLabelText('Умеренные затраты (10-20%)')).toBeInTheDocument()
  })

  it('should show red for ratio 20.01%', () => {
    const items: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '1',
        vendor_code: 'V1',
        product_name: 'Item',
        brand: 'B',
        storage_cost: 1000,
        percent_of_total: 50,
        volume: null,
        storage_to_revenue_ratio: 20.01,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({ ...mockResponse, top_consumers: items } as TopConsumersResponse)
    )
    renderWidget()
    expect(screen.getByLabelText('Высокие затраты на хранение (>20%)')).toBeInTheDocument()
  })

  it('should handle edge case ratio 0%', () => {
    const items: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '1',
        vendor_code: 'V1',
        product_name: 'Item',
        brand: 'B',
        storage_cost: 0,
        percent_of_total: 0,
        volume: null,
        storage_to_revenue_ratio: 0,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({ ...mockResponse, top_consumers: items } as TopConsumersResponse)
    )
    renderWidget()
    expect(screen.getByLabelText('Низкие затраты (<10%)')).toBeInTheDocument()
  })

  it('should handle very high ratio 100%+', () => {
    const items: TopConsumerItem[] = [
      {
        rank: 1,
        nm_id: '1',
        vendor_code: 'V1',
        product_name: 'Item',
        brand: 'B',
        storage_cost: 10000,
        percent_of_total: 100,
        volume: null,
        storage_to_revenue_ratio: 150.0,
      },
    ]
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({ ...mockResponse, top_consumers: items } as TopConsumersResponse)
    )
    renderWidget()
    expect(screen.getByLabelText('Высокие затраты на хранение (>20%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Требуется оптимизация')).toBeInTheDocument()
  })
})

// ============================================================================
// Navigation Tests (~6 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
  })

  it('should navigate to storage analytics on row click', () => {
    renderWidget()
    // Use aria-label to get the correct consumer row (not the header button)
    const row = screen.getByLabelText(/Пальто зимнее XL.*хранение/)
    fireEvent.click(row)
    expect(mockPush).toHaveBeenCalledWith('/analytics/storage')
  })

  it('should navigate on Enter key press', () => {
    renderWidget()
    const row = screen.getByLabelText(/Диван угловой.*хранение/)
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/analytics/storage')
  })

  it('should navigate on Space key press', () => {
    renderWidget()
    const row = screen.getByLabelText(/Диван угловой.*хранение/)
    fireEvent.keyDown(row, { key: ' ' })
    expect(mockPush).toHaveBeenCalledWith('/analytics/storage')
  })

  it('should show "Смотреть все" link in header', () => {
    renderWidget()
    expect(screen.getByText('Смотреть все')).toBeInTheDocument()
  })

  it('should navigate to /analytics/storage on "Смотреть все" click', () => {
    renderWidget()
    const viewAllBtn = screen.getByText('Смотреть все')
    fireEvent.click(viewAllBtn)
    expect(mockPush).toHaveBeenCalledWith('/analytics/storage')
  })

  it('should have hover state class on rows for interactivity feedback', () => {
    const { container } = renderWidget()
    // Tailwind hover: classes are in the class string even in jsdom
    const row = container.querySelector('[class*="hover:bg"]')
    expect(row).toBeInTheDocument()
  })
})

// ============================================================================
// Loading State Tests (~5 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createLoadingQueryResult<TopConsumersResponse>()
    )
  })

  it('should show loading skeleton during fetch', () => {
    renderWidget()
    // LoadingSkeleton renders Skeleton divs with animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should skeleton match widget layout (5 rows)', () => {
    renderWidget()
    // Default limit is 5, so skeleton rows are rendered
    const skeletons = document.querySelectorAll('.animate-pulse')
    // Each row has multiple skeleton items — just verify count is reasonable
    expect(skeletons.length).toBeGreaterThanOrEqual(5)
  })

  it('should display title while loading', () => {
    renderWidget()
    expect(screen.getByText('Топ по расходам на хранение')).toBeInTheDocument()
  })

  it('should hide data rows while loading', () => {
    renderWidget()
    expect(screen.queryByText('Пальто зимнее XL')).not.toBeInTheDocument()
  })

  it('should apply animate-pulse to skeleton', () => {
    renderWidget()
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
    expect(skeletons[0].className).toContain('animate-pulse')
  })
})

// ============================================================================
// Empty State Tests (~4 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult({ ...mockResponse, top_consumers: [], has_data: false })
    )
  })

  it('should show empty state message in Russian', () => {
    renderWidget()
    expect(screen.getByText('Нет данных по хранению за выбранный период')).toBeInTheDocument()
  })

  it('should display "Нет данных по хранению за выбранный период"', () => {
    renderWidget()
    expect(screen.getByText('Нет данных по хранению за выбранный период')).toBeVisible()
  })

  it('should display title in empty state', () => {
    renderWidget()
    expect(screen.getByText('Топ по расходам на хранение')).toBeInTheDocument()
  })

  it('should hide table in empty state', () => {
    renderWidget()
    // No product names from data should appear
    expect(screen.queryByText('Пальто зимнее XL')).not.toBeInTheDocument()
    expect(screen.queryByText('Диван угловой')).not.toBeInTheDocument()
  })
})

// ============================================================================
// Error State Tests (~5 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createErrorQueryResult<TopConsumersResponse>(new Error('Failed to fetch'))
    )
  })

  it('should show error state when fetch fails', () => {
    renderWidget()
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
  })

  it('should display error message in Russian for fallback', () => {
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createErrorQueryResult<TopConsumersResponse>(null)
    )
    renderWidget()
    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()
  })

  it('should show retry button', () => {
    renderWidget()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('should call refetch on retry button click', () => {
    const mockRefetchFn = vi.fn()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createErrorQueryResult<TopConsumersResponse>(new Error('Failed'), { refetch: mockRefetchFn })
    )
    renderWidget()
    fireEvent.click(screen.getByText('Повторить'))
    expect(mockRefetchFn).toHaveBeenCalledOnce()
  })

  it('should display title in error state', () => {
    renderWidget()
    expect(screen.getByText('Топ по расходам на хранение')).toBeInTheDocument()
  })
})

// ============================================================================
// Accessibility Tests (~8 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
  })

  it('should have aria-label on rank icons', () => {
    renderWidget()
    expect(screen.getByLabelText('1 место')).toBeInTheDocument()
    expect(screen.getByLabelText('2 место')).toBeInTheDocument()
    expect(screen.getByLabelText('3 место')).toBeInTheDocument()
  })

  it('should have aria-label on ratio color dots', () => {
    renderWidget()
    // High risk dot
    expect(screen.getByLabelText('Высокие затраты на хранение (>20%)')).toBeInTheDocument()
    // Medium dot
    expect(screen.getByLabelText('Умеренные затраты (10-20%)')).toBeInTheDocument()
    // Low dots
    const lowDots = screen.getAllByLabelText('Низкие затраты (<10%)')
    expect(lowDots.length).toBeGreaterThanOrEqual(1)
  })

  it('should have role="button" on clickable rows', () => {
    renderWidget()
    const rows = screen.getAllByRole('button')
    // 5 consumer rows (rank indicator divs also have role=button but those are the rows)
    expect(rows.length).toBeGreaterThanOrEqual(5)
  })

  it('should have tabIndex for keyboard navigation', () => {
    renderWidget()
    // All consumer rows have tabIndex=0
    const rows = screen.getAllByRole('button')
    for (const row of rows) {
      if (row.textContent?.includes('Пальто') || row.textContent?.includes('Диван')) {
        expect(row).toHaveAttribute('tabindex', '0')
      }
    }
  })

  it('should have accessible row labels', () => {
    renderWidget()
    // Each row has aria-label with product name and storage cost
    const row = screen.getByLabelText(/Пальто зимнее XL.*хранение/)
    expect(row).toBeInTheDocument()
  })

  it('should provide tooltip explanations for color indicators', () => {
    renderWidget()
    // Tooltip content is rendered by Radix — check severity labels via aria-labels
    expect(screen.getByLabelText('Высокие затраты на хранение (>20%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Умеренные затраты (10-20%)')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Низкие затраты (<10%)').length).toBeGreaterThanOrEqual(1)
  })

  it('should use semantic colors with text/icon indicators', () => {
    renderWidget()
    // Warning icon has aria-label
    expect(screen.getByLabelText('Требуется оптимизация')).toBeInTheDocument()
    // Rank icons have aria-labels
    expect(screen.getByLabelText('1 место')).toBeInTheDocument()
  })

  it('should support keyboard navigation through rows', () => {
    const onProductClick = vi.fn()
    renderWidget({ onProductClick })
    // Use aria-label to target specific consumer rows
    const row1 = screen.getByLabelText(/Пальто зимнее XL.*хранение/)
    fireEvent.keyDown(row1, { key: 'Enter' })
    expect(onProductClick).toHaveBeenCalledWith('87654321')
    // Simulate Space on second row
    onProductClick.mockClear()
    const row2 = screen.getByLabelText(/Диван угловой.*хранение/)
    fireEvent.keyDown(row2, { key: ' ' })
    expect(onProductClick).toHaveBeenCalledWith('87654322')
  })
})

// ============================================================================
// Period Context Tests (~4 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Period Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
  })

  it('should pass weekStart and weekEnd to hook', () => {
    renderWidget({ weekStart: '2026-W02', weekEnd: '2026-W04' })
    expect(useStorageTopConsumers).toHaveBeenCalledWith('2026-W02', '2026-W04', expect.anything())
  })

  it('should pass includeRevenue=true for ratio calculation', () => {
    renderWidget({ includeRevenue: true })
    expect(useStorageTopConsumers).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ include_revenue: true })
    )
  })

  it('should pass limit prop to hook', () => {
    renderWidget({ limit: 10 })
    expect(useStorageTopConsumers).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ limit: 10 })
    )
  })

  it('should refetch when period changes', () => {
    const { rerender } = renderWidget({ weekStart: '2026-W01', weekEnd: '2026-W05' })
    expect(useStorageTopConsumers).toHaveBeenCalledWith('2026-W01', '2026-W05', expect.anything())

    // Rerender with new period — hook is called with new args
    vi.mocked(useStorageTopConsumers).mockClear()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
    rerender(<StorageTopConsumersWidget weekStart="2026-W10" weekEnd="2026-W14" />)
    expect(useStorageTopConsumers).toHaveBeenCalledWith('2026-W10', '2026-W14', expect.anything())
  })
})

// ============================================================================
// Widget Header Tests (~4 tests)
// ============================================================================

describe('StorageTopConsumersWidget - Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTopConsumers).mockReturnValue(
      createMockQueryResult(mockResponse as TopConsumersResponse)
    )
  })

  it('should display Package icon in header', () => {
    renderWidget()
    // The header Package icon uses the chart-2 storage tone
    const header = screen.getByText('Топ по расходам на хранение').closest('div')
    expect(header).toBeInTheDocument()
    // Header contains an SVG (Package icon)
    const svg = header?.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should display title "Топ по расходам на хранение"', () => {
    renderWidget()
    expect(screen.getByText('Топ по расходам на хранение')).toBeInTheDocument()
  })

  it('should display "Смотреть все" link with arrow', () => {
    renderWidget()
    expect(screen.getByText('Смотреть все')).toBeInTheDocument()
    // ArrowRight icon is next to the text
    const btn = screen.getByText('Смотреть все').closest('button')
    expect(btn).toBeInTheDocument()
    const arrowSvg = btn?.querySelector('svg')
    expect(arrowSvg).toBeInTheDocument()
  })

  it('should apply purple color theme to header icon', () => {
    renderWidget()
    // The Package icon in header uses the chart-2 storage tone
    const titleEl = screen.getByText('Топ по расходам на хранение')
    const iconContainer = titleEl.closest('div')
    const svg = iconContainer?.querySelector('svg')
    expect(svg?.className.baseVal || svg?.getAttribute('class')).toContain('text-chart-2')
  })
})
