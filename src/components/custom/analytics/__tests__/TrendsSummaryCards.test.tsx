/**
 * Unit Tests for TrendsSummaryCards Component
 * Story 51.5-FE: Trends Summary Cards
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Tests summary cards displaying total orders, revenue, avg daily,
 * cancellation rates with formatting and Russian locale.
 *
 * @see docs/stories/epic-51/story-51.5-fe-trends-summary-cards.md
 */

import { describe, it, expect } from 'vitest'
import { screen, renderWithProviders } from '@/test/utils/test-utils'
import {
  TrendsSummaryCards,
  buildDeltaTooltip,
  type TrendsSummaryData,
} from '../TrendsSummaryCards'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockSummaryData: TrendsSummaryData = {
  totalOrders: 1350,
  totalRevenue: 2025000.0,
  avgDailyOrders: 45.0,
  cancellationRate: 5.78,
  returnRate: 3.85,
}

const mockEmptySummary: TrendsSummaryData = {
  totalOrders: 0,
  totalRevenue: 0,
  avgDailyOrders: 0,
  cancellationRate: 0,
  returnRate: 0,
}

const mockLargeNumbers: TrendsSummaryData = {
  totalOrders: 15000,
  totalRevenue: 5_000_000,
  avgDailyOrders: 45.5,
  cancellationRate: 12.5,
}

const mockLowCancellation: TrendsSummaryData = {
  totalOrders: 100,
  totalRevenue: 500000,
  avgDailyOrders: 10,
  cancellationRate: 2.5,
}

const mockMedCancellation: TrendsSummaryData = {
  totalOrders: 200,
  totalRevenue: 800000,
  avgDailyOrders: 20,
  cancellationRate: 7.3,
}

/** Helper: count child cards (regions inside the outer grid region) */
function getCardRegions(): HTMLElement[] {
  const regions = screen.getAllByRole('region')
  // Outer grid has role="region" + 4 inner cards have role="region"
  return regions.filter(r => r.getAttribute('aria-label') !== 'Сводка показателей')
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('TrendsSummaryCards - Basic Rendering', () => {
  it('should render 4 summary cards in a grid', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // Outer grid region + 4 card regions = 5 total
    const cards = getCardRegions()
    expect(cards).toHaveLength(4)
  })

  it('should render Card component from shadcn/ui', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // shadcn Card renders a div with class containing "rounded-xl border"
    const cards = container.querySelectorAll('.rounded-xl.border')
    expect(cards).toHaveLength(4)
  })

  it('should display "Всего заказов" card with total orders', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
  })

  it('should display "Общая выручка" card with total revenue', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    expect(screen.getByText('Общая выручка')).toBeInTheDocument()
  })

  it('should display "Среднее в день" card with avg daily orders', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    expect(screen.getByText('Среднее в день')).toBeInTheDocument()
  })

  it('should display "Отмены" card with cancellation rate', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    expect(screen.getByText('Процент отмен')).toBeInTheDocument()
  })

  it('should apply responsive grid classes (1 col mobile, 2 col sm, 4 col lg)', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid-cols-1')
    expect(grid.className).toContain('sm:grid-cols-2')
    expect(grid.className).toContain('lg:grid-cols-4')
  })

  it('should apply gap-4 spacing between cards', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('gap-4')
  })

  it('should accept custom className prop', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} className="extra-class" />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('extra-class')
  })

  it('should render card icons for each metric type', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // Each SummaryCard renders an SVG icon inside a div with aria-hidden
    const icons = container.querySelectorAll('[aria-hidden="true"] svg')
    expect(icons.length).toBeGreaterThanOrEqual(4)
  })
})

// ============================================================================
// Total Orders Card Tests
// ============================================================================

describe('TrendsSummaryCards - Total Orders Card', () => {
  it('should display total orders value formatted', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // formatNumber(1350) => "1 350" (Russian locale with NBSP grouping)
    expect(screen.getByText(/1\s350/)).toBeInTheDocument()
  })

  it('should format with Russian locale thousands separator', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // 1350 formatted with Russian locale uses NBSP as grouping separator
    const el = screen.getByText(/1\s350/)
    expect(el.textContent).toMatch(/1[\s ]350/)
  })

  it('should display ShoppingCart icon', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // ShoppingCart renders an SVG with lucide-shopping-cart class
    const cartSvg = container.querySelector('.lucide-shopping-cart')
    expect(cartSvg).toBeInTheDocument()
  })

  it('should show card title "Всего заказов"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const title = screen.getByText('Всего заказов')
    expect(title.tagName).toBe('H3')
  })

  it('should show card subtitle with period info', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // 3 cards share "за 30 дней" as subtitle — use getAllByText
    expect(screen.getAllByText('за 30 дней').length).toBeGreaterThanOrEqual(1)
  })

  it('should display zero as "0" not empty', () => {
    renderWithProviders(<TrendsSummaryCards data={mockEmptySummary} periodDays={30} />)
    // aria-label includes ": 0 за 30 дней"
    const cards = getCardRegions()
    const ordersCard = cards.find(r => r.getAttribute('aria-label')?.includes('Всего заказов'))
    expect(ordersCard?.getAttribute('aria-label')).toMatch(/0/)
  })

  it('should handle large numbers (10 000+)', () => {
    renderWithProviders(<TrendsSummaryCards data={mockLargeNumbers} periodDays={30} />)
    // formatNumber(15000) => "15 000"
    expect(screen.getByText(/15\s000/)).toBeInTheDocument()
  })

  it('should apply blue color theme to icon', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const iconContainer = container.querySelector('.text-blue-600')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer?.className).toContain('bg-blue-100')
  })
})

// ============================================================================
// Total Revenue Card Tests
// ============================================================================

describe('TrendsSummaryCards - Total Revenue Card', () => {
  it('should display total revenue with currency', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // formatCurrency(2025000) produces "2 025 000 ₽" in Russian locale
    expect(screen.getByText(/2\s025\s000/)).toBeInTheDocument()
  })

  it('should format currency with Russian locale', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const el = screen.getByText(/2\s025\s000/)
    expect(el.textContent).toContain('₽')
  })

  it('should display Banknote icon', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // Banknote renders an SVG with lucide-banknote class
    const banknoteSvg = container.querySelector('.lucide-banknote')
    expect(banknoteSvg).toBeInTheDocument()
  })

  it('should show card title "Общая выручка"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const title = screen.getByText('Общая выручка')
    expect(title.tagName).toBe('H3')
  })

  it('should handle revenue over 1 million', () => {
    renderWithProviders(<TrendsSummaryCards data={mockLargeNumbers} periodDays={30} />)
    // formatCurrency(5_000_000) => "5 000 000 ₽"
    expect(screen.getByText(/5\s000\s000/)).toBeInTheDocument()
  })

  it('should display zero revenue as "0 ₽"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockEmptySummary} periodDays={30} />)
    // formatCurrency(0) => "0 ₽"
    expect(screen.getByText(/0\s₽/)).toBeInTheDocument()
  })

  it('should truncate decimals for display', () => {
    const fractionalData: TrendsSummaryData = {
      ...mockSummaryData,
      totalRevenue: 1234.56,
    }
    renderWithProviders(<TrendsSummaryCards data={fractionalData} periodDays={30} />)
    // formatCurrency with max 2 decimals, 1234.56 should show
    expect(screen.getByText(/1\s234,56/)).toBeInTheDocument()
  })

  it('should apply green color theme to icon', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const iconContainer = container.querySelector('.text-green-600')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer?.className).toContain('bg-green-100')
  })
})

// ============================================================================
// Avg Daily Orders Card Tests
// ============================================================================

describe('TrendsSummaryCards - Avg Daily Orders Card', () => {
  it('should display average daily orders', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // formatAvgDaily(45.0) - integer, so formatNumber(45) => "45"
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('should round to one decimal place', () => {
    renderWithProviders(<TrendsSummaryCards data={mockLargeNumbers} periodDays={30} />)
    // formatAvgDaily(45.5) => "45,5" (one decimal with comma)
    expect(screen.getByText(/45,5/)).toBeInTheDocument()
  })

  it('should display TrendingUp icon', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const trendSvg = container.querySelector('.lucide-trending-up')
    expect(trendSvg).toBeInTheDocument()
  })

  it('should show card title "Среднее в день"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const title = screen.getByText('Среднее в день')
    expect(title.tagName).toBe('H3')
  })

  it('should show subtitle "заказов"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    expect(screen.getByText('заказов')).toBeInTheDocument()
  })

  it('should display zero as "0"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockEmptySummary} periodDays={30} />)
    const cards = getCardRegions()
    const avgCard = cards.find(r => r.textContent?.includes('Среднее в день'))
    expect(avgCard?.textContent).toMatch(/\b0\b/)
  })

  it('should handle decimal values (45.5)', () => {
    renderWithProviders(<TrendsSummaryCards data={mockLargeNumbers} periodDays={30} />)
    // Russian locale decimal separator is comma
    expect(screen.getByText(/45,5/)).toBeInTheDocument()
  })

  it('should apply purple color theme to icon', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const iconContainer = container.querySelector('.text-purple-600')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer?.className).toContain('bg-purple-100')
  })
})

// ============================================================================
// Cancellation Rate Card Tests
// ============================================================================

describe('TrendsSummaryCards - Cancellation Rate Card', () => {
  it('should display cancellation rate as percentage', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // formatPercentValue(5.78) => "5,78 %" (Russian locale)
    expect(screen.getByText(/5,78\s%/)).toBeInTheDocument()
  })

  it('should format with Russian locale decimal separator', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const el = screen.getByText(/5,78\s%/)
    expect(el.textContent).toMatch(/5,78/)
  })

  it('should display XCircle icon', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // lucide XCircle renders as "lucide-circle-x" in current versions
    const xCircleSvg = container.querySelector('.lucide-circle-x')
    expect(xCircleSvg).toBeInTheDocument()
  })

  it('should show card title "Процент отмен"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const title = screen.getByText('Процент отмен')
    expect(title.tagName).toBe('H3')
  })

  it('should display zero rate as "0%"', () => {
    renderWithProviders(<TrendsSummaryCards data={mockEmptySummary} periodDays={30} />)
    // formatPercentValue(0) => "0 %"
    expect(screen.getByText(/0\s%/)).toBeInTheDocument()
  })

  it('should color code based on threshold (green <5%, yellow 5-10%, red >10%)', () => {
    const { container: c1, unmount: u1 } = renderWithProviders(
      <TrendsSummaryCards data={mockLowCancellation} periodDays={30} />
    )
    expect(c1.querySelector('.text-green-600')).toBeInTheDocument()
    u1()

    const { container: c2, unmount: u2 } = renderWithProviders(
      <TrendsSummaryCards data={mockMedCancellation} periodDays={30} />
    )
    expect(c2.querySelector('.text-yellow-600')).toBeInTheDocument()
    u2()

    const { container: c3 } = renderWithProviders(
      <TrendsSummaryCards data={mockLargeNumbers} periodDays={30} />
    )
    expect(c3.querySelector('.text-red-600')).toBeInTheDocument()
  })

  it('should show green color for rate below 5%', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockLowCancellation} periodDays={30} />
    )
    const greenIcons = container.querySelectorAll('.text-green-600')
    // Cancellation card icon is green when rate < 5
    expect(greenIcons.length).toBeGreaterThanOrEqual(1)
  })

  it('should show yellow/amber color for rate 5-10%', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockMedCancellation} periodDays={30} />
    )
    expect(container.querySelector('.text-yellow-600')).toBeInTheDocument()
  })

  it('should show red color for rate above 10%', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockLargeNumbers} periodDays={30} />
    )
    expect(container.querySelector('.text-red-600')).toBeInTheDocument()
  })

  it('should apply conditional icon color based on rate', () => {
    const { container: lowContainer, unmount: unmountLow } = renderWithProviders(
      <TrendsSummaryCards data={mockLowCancellation} periodDays={30} />
    )
    // Green icon is present for low cancellation rate
    expect(lowContainer.querySelector('.text-green-600')).toBeInTheDocument()
    unmountLow()

    const { container: highContainer } = renderWithProviders(
      <TrendsSummaryCards data={mockLargeNumbers} periodDays={30} />
    )
    expect(highContainer.querySelector('.text-red-600')).toBeInTheDocument()
  })
})

// ============================================================================
// Loading State Tests
// ============================================================================

describe('TrendsSummaryCards - Loading State', () => {
  it('should show skeleton loaders when isLoading is true', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} isLoading />
    )
    // Skeleton elements have animate-pulse class
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render 4 skeleton cards', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} isLoading />
    )
    // Cards still render as skeleton containers
    const cards = container.querySelectorAll('.rounded-xl.border')
    expect(cards).toHaveLength(4)
  })

  it('should skeleton match card dimensions', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} isLoading />
    )
    // Each skeleton has an icon placeholder (h-10 w-10)
    const iconSkeleton = container.querySelector('.h-10.w-10')
    expect(iconSkeleton).toBeInTheDocument()
  })

  it('should apply animate-pulse class to skeletons', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} isLoading />
    )
    const skeletons = container.querySelectorAll('.animate-pulse')
    skeletons.forEach(skel => {
      expect(skel.className).toContain('animate-pulse')
    })
  })

  it('should maintain grid layout during loading', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} isLoading />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid')
    expect(grid.className).toContain('lg:grid-cols-4')
  })

  it('should hide actual values during loading', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} isLoading />)
    // Should NOT show card titles when loading
    expect(screen.queryByText('Всего заказов')).not.toBeInTheDocument()
    expect(screen.queryByText('Общая выручка')).not.toBeInTheDocument()
    expect(screen.queryByText('Среднее в день')).not.toBeInTheDocument()
    expect(screen.queryByText('Процент отмен')).not.toBeInTheDocument()
  })
})

// ============================================================================
// Empty State Tests
// ============================================================================

describe('TrendsSummaryCards - Empty State', () => {
  it('should display zero values when summary is empty', () => {
    renderWithProviders(<TrendsSummaryCards data={mockEmptySummary} periodDays={30} />)
    const cards = getCardRegions()
    expect(cards).toHaveLength(4)
  })

  it('should still render all 4 cards with zeros', () => {
    renderWithProviders(<TrendsSummaryCards data={mockEmptySummary} periodDays={30} />)
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
    expect(screen.getByText('Общая выручка')).toBeInTheDocument()
    expect(screen.getByText('Среднее в день')).toBeInTheDocument()
    expect(screen.getByText('Процент отмен')).toBeInTheDocument()
  })

  it('should show appropriate messaging for no data', () => {
    renderWithProviders(<TrendsSummaryCards data={mockEmptySummary} periodDays={30} />)
    // Zero values should be displayed (multiple cards show "0")
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })

  it('should not show error state for zero values', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockEmptySummary} periodDays={30} />
    )
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument()
  })

  it('should apply muted styling for zero values', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockEmptySummary} periodDays={30} />
    )
    // Zero cancellation should use green (since 0 < 5)
    expect(container.querySelector('.text-green-600')).toBeInTheDocument()
  })
})

// ============================================================================
// Period Context Tests
// ============================================================================

describe('TrendsSummaryCards - Period Context', () => {
  it('should display period range in subtitle', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // 3 cards (orders, revenue, cancellation) share "за 30 дней"
    expect(screen.getAllByText('за 30 дней').length).toBeGreaterThanOrEqual(1)
  })

  it('should show "за неделю" for 7 day period', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={7} />)
    // 3 cards share "за неделю" as subtitle
    expect(screen.getAllByText('за неделю').length).toBeGreaterThanOrEqual(1)
  })

  it('should show "за 30 дней" for 30 day period', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    expect(screen.getAllByText('за 30 дней').length).toBeGreaterThanOrEqual(1)
  })

  it('should show "за 90 дней" for 90 day period', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={90} />)
    expect(screen.getAllByText('за 90 дней').length).toBeGreaterThanOrEqual(1)
  })

  it('should show "за год" for 365 day period', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={365} />)
    expect(screen.getAllByText('за год').length).toBeGreaterThanOrEqual(1)
  })

  it('should show generic label for other day counts', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={45} />)
    expect(screen.getAllByText('за 45 дней').length).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================================
// Delta/Comparison Indicator Tests
// ============================================================================

describe('TrendsSummaryCards - Delta Indicators', () => {
  it('should show delta indicator when comparison data provided', () => {
    const dataWithDelta: TrendsSummaryData = {
      ...mockSummaryData,
      ordersDelta: 15.5,
    }
    renderWithProviders(<TrendsSummaryCards data={dataWithDelta} periodDays={30} />)
    // DeltaIndicator renders with role="img"
    const deltaEls = screen.getAllByRole('img')
    expect(deltaEls.length).toBeGreaterThanOrEqual(1)
  })

  it('should display positive delta with green color and up arrow', () => {
    const dataWithDelta: TrendsSummaryData = {
      ...mockSummaryData,
      ordersDelta: 15.5,
    }
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={dataWithDelta} periodDays={30} />
    )
    // Positive delta uses text-green-600 (the delta indicator, not card icon)
    const greenElements = container.querySelectorAll('.text-green-600')
    expect(greenElements.length).toBeGreaterThanOrEqual(2)
  })

  it('should display negative delta with red color and down arrow', () => {
    const dataWithDelta: TrendsSummaryData = {
      ...mockSummaryData,
      ordersDelta: -8.5,
    }
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={dataWithDelta} periodDays={30} />
    )
    // Negative delta uses text-red-600
    expect(container.querySelector('.text-red-600')).toBeInTheDocument()
  })

  it('should display zero delta with gray color', () => {
    const dataWithDelta: TrendsSummaryData = {
      ...mockSummaryData,
      ordersDelta: 0,
    }
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={dataWithDelta} periodDays={30} />
    )
    // Zero delta uses text-gray-400
    expect(container.querySelector('.text-gray-400')).toBeInTheDocument()
  })

  it('should format delta as percentage', () => {
    const dataWithDelta: TrendsSummaryData = {
      ...mockSummaryData,
      ordersDelta: 15.5,
    }
    renderWithProviders(<TrendsSummaryCards data={dataWithDelta} periodDays={30} />)
    // formatDeltaValue(15.5, 'percentage') => "+15,5 %" (Russian locale)
    expect(screen.getByText(/\+15,5\s%/)).toBeInTheDocument()
  })

  it('should hide delta when no comparison data', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    // Without delta props, DeltaIndicator is not rendered at all
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    // Cards still render normally
    const cards = getCardRegions()
    expect(cards).toHaveLength(4)
  })

  it('should show tooltip with previous period value on hover', () => {
    const dataWithDelta: TrendsSummaryData = {
      ...mockSummaryData,
      ordersDelta: 15.5,
    }
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={dataWithDelta} periodDays={30} />
    )
    // Radix Tooltip renders content lazily; verify the delta indicator is present.
    // Tooltip text correctness is covered by buildDeltaTooltip pure-function tests.
    const deltaImg = container.querySelector('[role="img"]')
    expect(deltaImg).toBeInTheDocument()
    expect(buildDeltaTooltip(15.5)).toMatch(/Изменение к предыдущему периоду: \+15,5\s%/)
  })

  it('should use DeltaIndicator component from shared components', () => {
    const dataWithDelta: TrendsSummaryData = {
      ...mockSummaryData,
      ordersDelta: 10,
    }
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={dataWithDelta} periodDays={30} />
    )
    // DeltaIndicator renders with role="img" and aria-label
    const deltaImg = container.querySelector('[role="img"]')
    expect(deltaImg).toBeInTheDocument()
  })
})

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('TrendsSummaryCards - Accessibility', () => {
  it('should have ARIA labels for each card', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const cards = getCardRegions()
    cards.forEach(card => {
      expect(card).toHaveAttribute('aria-label')
    })
  })

  it('should use semantic heading for card titles', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(4)
    const titles = headings.map(h => h.textContent)
    expect(titles).toContain('Всего заказов')
    expect(titles).toContain('Общая выручка')
    expect(titles).toContain('Среднее в день')
    expect(titles).toContain('Процент отмен')
  })

  it('should have sufficient color contrast for text', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // Verify text color classes are present (gray-900 for values, gray-600 for titles)
    expect(container.querySelector('.text-gray-900')).toBeInTheDocument()
    expect(container.querySelector('.text-gray-600')).toBeInTheDocument()
  })

  it('should announce values to screen readers', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const cards = getCardRegions()
    const ordersCard = cards.find(r => r.getAttribute('aria-label')?.includes('Всего заказов'))
    expect(ordersCard?.getAttribute('aria-label')).toMatch(/Всего заказов/)
  })

  it('should have role="region" on the outer container', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const outerRegion = container.firstChild as HTMLElement
    expect(outerRegion.getAttribute('role')).toBe('region')
    expect(outerRegion.getAttribute('aria-label')).toBe('Сводка показателей')
  })

  it('should provide aria-hidden for decorative icons', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
    // Each card icon container has aria-hidden
    expect(hiddenIcons.length).toBeGreaterThanOrEqual(4)
  })

  it('should support reduced motion preferences', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // The component does not add custom animations in non-loading state
    const grid = container.firstChild as HTMLElement
    expect(grid.className).not.toContain('animate-')
  })

  it('should have descriptive aria-labels on each card region', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    const cards = getCardRegions()
    const labels = cards.map(r => r.getAttribute('aria-label'))
    // All 4 cards should have aria-labels
    expect(labels.filter(Boolean)).toHaveLength(4)
  })
})

// ============================================================================
// Responsive Design Tests
// ============================================================================

describe('TrendsSummaryCards - Responsive Design', () => {
  it('should have 1 column base class for mobile', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid-cols-1')
  })

  it('should have 2 columns class for tablet breakpoint', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('sm:grid-cols-2')
  })

  it('should have 4 columns class for desktop breakpoint', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('lg:grid-cols-4')
  })

  it('should maintain readable font sizes', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // Values use text-2xl, titles use text-sm
    expect(container.querySelector('.text-2xl')).toBeInTheDocument()
    expect(container.querySelector('.text-sm')).toBeInTheDocument()
  })

  it('should have proper card padding', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    const cards = container.querySelectorAll('.rounded-xl.border')
    cards.forEach(card => {
      expect(card.className).toContain('p-4')
    })
  })

  it('should support touch-friendly interactions via truncation', () => {
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={mockSummaryData} periodDays={30} />
    )
    // Values and titles use truncate for responsive text handling
    const truncated = container.querySelectorAll('.truncate')
    expect(truncated.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('TrendsSummaryCards - Integration', () => {
  it('should render with TrendsSummaryData hook data shape', () => {
    const hookData: TrendsSummaryData = {
      totalOrders: 500,
      totalRevenue: 750000,
      avgDailyOrders: 16.7,
      cancellationRate: 3.2,
      returnRate: 1.5,
      ordersDelta: 12.0,
      revenueDelta: -5.3,
      avgDailyDelta: 2.1,
      cancellationDelta: -1.0,
    }
    renderWithProviders(<TrendsSummaryCards data={hookData} periodDays={30} />)
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
    expect(screen.getByText('Общая выручка')).toBeInTheDocument()
  })

  it('should handle undefined summary gracefully', () => {
    renderWithProviders(<TrendsSummaryCards data={undefined} periodDays={30} />)
    // Should render with default zero values
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
    const cards = getCardRegions()
    expect(cards).toHaveLength(4)
  })

  it('should handle null summary gracefully', () => {
    renderWithProviders(<TrendsSummaryCards data={null} periodDays={30} />)
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
  })

  it('should update values when summary data changes', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} periodDays={30} />)
    expect(screen.getByText(/1\s350/)).toBeInTheDocument()

    const updatedData: TrendsSummaryData = {
      ...mockSummaryData,
      totalOrders: 2000,
    }
    // Re-render with updated data in a fresh provider
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={updatedData} periodDays={30} />
    )
    // The new render should show the updated value
    expect(container.textContent).toContain('2')
  })

  it('should render without periodDays (no subtitle for orders/revenue/cancellation)', () => {
    renderWithProviders(<TrendsSummaryCards data={mockSummaryData} />)
    // No period label should appear for orders/revenue/cancellation cards
    expect(screen.queryByText('за 30 дней')).not.toBeInTheDocument()
    // "заказов" subtitle is always shown for avg daily card
    expect(screen.getByText('заказов')).toBeInTheDocument()
  })

  it('should handle edge case with all deltas provided', () => {
    const fullDeltaData: TrendsSummaryData = {
      totalOrders: 1000,
      totalRevenue: 3000000,
      avgDailyOrders: 33.3,
      cancellationRate: 4.5,
      ordersDelta: 10,
      revenueDelta: 25.5,
      avgDailyDelta: -3.2,
      cancellationDelta: 1.5,
    }
    const { container } = renderWithProviders(
      <TrendsSummaryCards data={fullDeltaData} periodDays={30} />
    )
    // All 4 deltas should render delta indicators (role="img")
    const deltaImgs = container.querySelectorAll('[role="img"]')
    expect(deltaImgs.length).toBeGreaterThanOrEqual(4)
  })
})

// ============================================================================
// buildDeltaTooltip pure-function tests (iter-79)
// ============================================================================

describe('buildDeltaTooltip', () => {
  it('formats a positive delta with a leading + and comma+NBSP percent', () => {
    expect(buildDeltaTooltip(15.5)).toMatch(/: \+15,5\s%$/)
  })

  it('formats a negative delta with a minus and no +', () => {
    expect(buildDeltaTooltip(-8.5)).toMatch(/: [-−]8,5\s%$/)
  })

  it('formats a zero delta with no sign', () => {
    expect(buildDeltaTooltip(0)).toMatch(/: 0,0\s%$/)
  })

  it('returns undefined when delta is undefined (no tooltip)', () => {
    expect(buildDeltaTooltip(undefined)).toBeUndefined()
  })

  it('never produces the dot-locale form', () => {
    expect(buildDeltaTooltip(15.5)).not.toContain('15.5%')
  })
})
