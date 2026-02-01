/**
 * TDD Tests for StorageTrendsWidget Component
 * Story 63.6-FE: Storage Trends Chart Enhancement (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Tests storage trends widget with:
 * - Loading skeleton state
 * - Error state with retry button
 * - Empty state when no data
 * - Chart rendering with data
 * - TrendBadge with inverted colors (increase = red for costs)
 * - Summary statistics display
 *
 * @see docs/stories/epic-63/story-63.6-fe-storage-trends-chart.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  createMockQueryResult,
  createLoadingQueryResult,
  createErrorQueryResult,
} from '@/test/utils/query-mock'
import type { StorageTrendsResponse, MetricSummary } from '@/types/storage-analytics'

// ============================================================================
// Mock Setup
// ============================================================================

vi.mock('@/hooks/useStorageAnalytics', () => ({
  useStorageTrends: vi.fn(),
}))

// Import after mocking
import { useStorageTrends } from '@/hooks/useStorageAnalytics'
import { StorageTrendsWidget } from '../StorageTrendsWidget'

// ============================================================================
// Test Data
// ============================================================================

const mockSummary: { storage_cost: MetricSummary } = {
  storage_cost: {
    min: 1200.5,
    max: 3500.75,
    avg: 2350.62,
    trend: 12.5, // Positive trend (increase in costs = bad)
  },
}

const mockTrendsData: StorageTrendsResponse = {
  period: {
    from: '2026-W01',
    to: '2026-W05',
    days_count: 35,
  },
  nm_id: null,
  data: [
    { week: '2026-W01', storage_cost: 1200.5, volume: 150 },
    { week: '2026-W02', storage_cost: 1850.25, volume: 180 },
    { week: '2026-W03', storage_cost: 2500.0, volume: 200 },
    { week: '2026-W04', storage_cost: 3100.5, volume: 220 },
    { week: '2026-W05', storage_cost: 3500.75, volume: 250 },
  ],
  summary: mockSummary,
  has_data: true,
}

const mockEmptyResponse: StorageTrendsResponse = {
  period: {
    from: '2026-W01',
    to: '2026-W05',
    days_count: 35,
  },
  nm_id: null,
  data: [],
  summary: undefined,
  has_data: false,
}

const defaultProps = {
  weekStart: '2026-W01',
  weekEnd: '2026-W05',
}

// ============================================================================
// Loading State Tests (~4 tests)
// ============================================================================

describe('StorageTrendsWidget - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTrends).mockReturnValue(createLoadingQueryResult<StorageTrendsResponse>())
  })

  it('renders loading skeleton when isLoading is true', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // Should have skeleton elements (Skeleton components use animate-pulse class)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays card header with title while loading', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // Title should still be visible
    expect(screen.getByText('Динамика расходов на хранение')).toBeInTheDocument()
  })

  it('does not display TrendBadge while loading', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // TrendBadge should not be visible
    expect(screen.queryByText(/Тренд:/)).not.toBeInTheDocument()
  })

  it('does not display summary stats while loading', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // Summary stats should not be visible
    expect(screen.queryByText(/Мин:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Макс:/)).not.toBeInTheDocument()
  })
})

// ============================================================================
// Error State Tests (~5 tests)
// ============================================================================

describe('StorageTrendsWidget - Error State', () => {
  const mockRefetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockRefetch.mockClear()
    vi.mocked(useStorageTrends).mockReturnValue(
      createErrorQueryResult<StorageTrendsResponse>(new Error('Failed to fetch storage trends'), {
        refetch: mockRefetch,
      })
    )
  })

  it('renders error state when fetch fails', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // Should show error message
    expect(screen.getByText('Failed to fetch storage trends')).toBeInTheDocument()
  })

  it('displays retry button in error state', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    const retryButton = screen.getByRole('button', { name: /повторить/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('calls refetch when retry button is clicked', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    const retryButton = screen.getByRole('button', { name: /повторить/i })
    fireEvent.click(retryButton)

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('displays card header with title in error state', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    expect(screen.getByText('Динамика расходов на хранение')).toBeInTheDocument()
  })

  it('displays default error message when error.message is empty', () => {
    vi.mocked(useStorageTrends).mockReturnValue(createErrorQueryResult<StorageTrendsResponse>(null))

    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()
  })
})

// ============================================================================
// Empty State Tests (~4 tests)
// ============================================================================

describe('StorageTrendsWidget - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTrends).mockReturnValue(createMockQueryResult(mockEmptyResponse))
  })

  it('renders empty state when has_data is false', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('displays BarChart icon in empty state', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // BarChart3 icon should be visible (check for SVG or icon container)
    const emptyStateContainer = screen.getByText('Нет данных за выбранный период').closest('div')
    expect(emptyStateContainer).toBeInTheDocument()
    // Icon is rendered as SVG
    const svg = emptyStateContainer?.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('displays card header with title in empty state', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    expect(screen.getByText('Динамика расходов на хранение')).toBeInTheDocument()
  })

  it('does not display TrendBadge in empty state', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    expect(screen.queryByText(/Тренд:/)).not.toBeInTheDocument()
  })
})

// ============================================================================
// Data Display Tests (~6 tests)
// ============================================================================

describe('StorageTrendsWidget - Data Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTrends).mockReturnValue(createMockQueryResult(mockTrendsData))
  })

  it('renders card with title and TrendingUp icon', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    expect(screen.getByText('Динамика расходов на хранение')).toBeInTheDocument()
  })

  it('displays TrendBadge with trend percentage', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // TrendBadge should show trend value
    expect(screen.getByText(/Тренд:.*12\.5%/)).toBeInTheDocument()
  })

  it('displays summary stats when showSummary is true (default)', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // Summary stats should be visible
    expect(screen.getByText(/Мин:/)).toBeInTheDocument()
    expect(screen.getByText(/Макс:/)).toBeInTheDocument()
    expect(screen.getByText(/Среднее:/)).toBeInTheDocument()
  })

  it('hides summary stats when showSummary is false', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} showSummary={false} />)

    // Summary stats should not be visible
    expect(screen.queryByText(/Мин:/)).not.toBeInTheDocument()
  })

  it('applies custom className to card', () => {
    renderWithProviders(<StorageTrendsWidget {...defaultProps} className="custom-test-class" />)

    // Card should have custom class
    const card = document.querySelector('.custom-test-class')
    expect(card).toBeInTheDocument()
  })

  it.todo('renders StorageTrendsChart component with data')
})

// ============================================================================
// TrendBadge Inverted Colors Tests (~4 tests)
// ============================================================================

describe('StorageTrendsWidget - TrendBadge Inverted Colors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows red color for positive trend (increase = bad for costs)', () => {
    vi.mocked(useStorageTrends).mockReturnValue(
      createMockQueryResult(mockTrendsData) // trend: 12.5 (positive)
    )

    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // TrendBadge with invertColors should show red for positive (increase in costs)
    const trendBadge = screen.getByText(/Тренд:.*12\.5%/).closest('div')
    expect(trendBadge).toHaveClass('text-red-600')
    expect(trendBadge).toHaveClass('bg-red-50')
  })

  it('shows green color for negative trend (decrease = good for costs)', () => {
    const negativeTrendData: StorageTrendsResponse = {
      ...mockTrendsData,
      summary: {
        storage_cost: {
          ...mockSummary.storage_cost,
          trend: -8.5, // Negative trend (decrease in costs = good)
        },
      },
    }

    vi.mocked(useStorageTrends).mockReturnValue(createMockQueryResult(negativeTrendData))

    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // TrendBadge with invertColors should show green for negative (decrease in costs)
    const trendBadge = screen.getByText(/Тренд:.*-8\.5%/).closest('div')
    expect(trendBadge).toHaveClass('text-green-600')
    expect(trendBadge).toHaveClass('bg-green-50')
  })

  it('shows gray color for zero trend (neutral)', () => {
    const neutralTrendData: StorageTrendsResponse = {
      ...mockTrendsData,
      summary: {
        storage_cost: {
          ...mockSummary.storage_cost,
          trend: 0, // Zero trend (neutral)
        },
      },
    }

    vi.mocked(useStorageTrends).mockReturnValue(createMockQueryResult(neutralTrendData))

    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // TrendBadge should show gray for zero trend
    const trendBadge = screen.getByText(/Тренд:.*0\.0%/).closest('div')
    expect(trendBadge).toHaveClass('text-gray-600')
    expect(trendBadge).toHaveClass('bg-gray-50')
  })

  it('displays + sign for positive trend', () => {
    vi.mocked(useStorageTrends).mockReturnValue(
      createMockQueryResult(mockTrendsData) // trend: 12.5 (positive)
    )

    renderWithProviders(<StorageTrendsWidget {...defaultProps} />)

    // Should show +12.5%
    expect(screen.getByText(/Тренд:.*\+12\.5%/)).toBeInTheDocument()
  })
})

// ============================================================================
// Period Props Tests (~3 tests)
// ============================================================================

describe('StorageTrendsWidget - Period Props', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTrends).mockReturnValue(createMockQueryResult(mockTrendsData))
  })

  it('passes weekStart and weekEnd to useStorageTrends hook', () => {
    renderWithProviders(<StorageTrendsWidget weekStart="2026-W10" weekEnd="2026-W15" />)

    expect(useStorageTrends).toHaveBeenCalledWith('2026-W10', '2026-W15')
  })

  it.todo('refetches when period changes')

  it.todo('passes height prop to chart component')
})

// ============================================================================
// Accessibility Tests (~4 tests)
// ============================================================================

describe('StorageTrendsWidget - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTrends).mockReturnValue(createMockQueryResult(mockTrendsData))
  })

  it.todo('has accessible card structure')

  it.todo('retry button is keyboard accessible')

  it.todo('provides screen reader text for trend direction')

  it.todo('chart has appropriate aria-label')
})

// ============================================================================
// Chart Height Tests (~3 tests)
// ============================================================================

describe('StorageTrendsWidget - Chart Height', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorageTrends).mockReturnValue(createMockQueryResult(mockTrendsData))
  })

  it.todo('uses default height of 250px')

  it.todo('respects custom height prop')

  it.todo('applies height to loading skeleton')
})
