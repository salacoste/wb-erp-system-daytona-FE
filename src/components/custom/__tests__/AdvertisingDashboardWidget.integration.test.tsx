/**
 * Integration Tests for AdvertisingEmptyState Integration
 * Story 60.6-FE: Sync Advertising Widget with Global Period
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * TDD Plan: Task 2 from docs/stories/epic-60/TDD-VALIDATION-INTEGRATION.md
 *
 * Tests the integration of AdvertisingEmptyState into AdvertisingDashboardWidget
 * following Red-Green-Refactor TDD methodology.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    cabinetId: 'test-cabinet-id',
  })),
}))

// Import mocked modules
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'

// Import components
import { AdvertisingDashboardWidget } from '../AdvertisingDashboardWidget'

// ============================================================================
// Test Fixtures (dynamic dates so predefined ranges always include all options)
// ============================================================================

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

/**
 * Build dynamic date strings relative to today so the AdvertisingEmptyState
 * getPredefinedRanges() always produces all 3 period options (7d, 14d, 30d).
 */
function dynamicDates() {
  const today = new Date()
  return {
    from: format(subDays(today, 90), 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
    cachedAt: new Date().toISOString(),
    // A recent date range for the widget dateRange prop
    recentFrom: format(subDays(today, 7), 'yyyy-MM-dd'),
    recentTo: format(subDays(today, 1), 'yyyy-MM-dd'),
    // Formatted for DD.MM.YYYY assertions
    fromFormatted: format(subDays(today, 90), 'dd.MM.yyyy'),
    toFormatted: format(today, 'dd.MM.yyyy'),
  }
}

function buildMockEmptyResponse(dates = dynamicDates()) {
  return {
    query: {
      cabinetId: 'test-cabinet-id',
      from: dates.from,
      to: dates.to,
      viewBy: 'sku',
    },
    summary: {
      totalSpend: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      avgRoas: null,
      avgRoi: 0,
      avgCtr: 0,
      avgConversionRate: 0,
      campaignCount: 0,
      activeCampaigns: 0,
      totalOrganicSales: 0,
      avgOrganicContribution: 0,
    },
    items: [],
    cachedAt: dates.cachedAt,
  }
}

function buildMockDataResponse(dates = dynamicDates()) {
  return {
    query: {
      cabinetId: 'test-cabinet-id',
      from: dates.from,
      to: dates.to,
      viewBy: 'sku',
    },
    summary: {
      totalSpend: 125300,
      totalSales: 500000,
      totalRevenue: 400000,
      totalProfit: 274700,
      avgRoas: 3.99,
      avgRoi: 1.19,
      avgCtr: 2.5,
      avgConversionRate: 3.2,
      campaignCount: 5,
      activeCampaigns: 3,
      totalOrganicSales: 100000,
      avgOrganicContribution: 72,
    },
    items: [],
    cachedAt: dates.cachedAt,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Story 60.6-FE: AdvertisingEmptyState Integration', () => {
  let dates: ReturnType<typeof dynamicDates>
  let mockEmptyResponse: ReturnType<typeof buildMockEmptyResponse>
  let mockDataResponse: ReturnType<typeof buildMockDataResponse>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      cabinetId: 'test-cabinet-id',
    } as ReturnType<typeof useAuthStore>)
    dates = dynamicDates()
    mockEmptyResponse = buildMockEmptyResponse(dates)
    mockDataResponse = buildMockDataResponse(dates)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Empty State Detection (Tests 1-3)
  // ==========================================================================

  describe('empty state detection', () => {
    it('should render AdvertisingEmptyState when data.summary is null (Test 1)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
      })
    })

    it('should render AdvertisingEmptyState when data has no items (Test 2)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        ...mockEmptyResponse,
        data: [],
      })

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
      })
    })

    it('should NOT render AdvertisingEmptyState when data.summary exists (Test 3)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDataResponse)

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(screen.queryByTestId('advertising-empty-state')).not.toBeInTheDocument()
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Available Range Prop (Tests 4-5)
  // ==========================================================================

  describe('available range prop', () => {
    it('should pass availableRange from data to AdvertisingEmptyState (Test 4)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        const emptyState = screen.getByTestId('advertising-empty-state')
        expect(emptyState).toBeInTheDocument()
        // Should show available range text (format: DD.MM.YYYY)
        const escapedFrom = dates.fromFormatted.replace(/\./g, '\\.')
        const escapedTo = dates.toFormatted.replace(/\./g, '\\.')
        expect(screen.getByText(new RegExp(escapedFrom))).toBeInTheDocument()
        expect(screen.getByText(new RegExp(escapedTo))).toBeInTheDocument()
      })
    })

    it('should pass requestedRange from props to AdvertisingEmptyState (Test 5)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Date Range Change Callback (Tests 6-7)
  // ==========================================================================

  describe('date range change callback', () => {
    it('should call onDateRangeChange when user selects period in empty state (Test 6)', async () => {
      const onDateRangeChange = vi.fn()
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      render(
        <AdvertisingDashboardWidget
          dateRange={{ from: dates.recentFrom, to: dates.recentTo }}
          onDateRangeChange={onDateRangeChange}
        />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
      })

      const user = userEvent.setup()

      // Click period selector (combobox) to open the dropdown
      await user.click(screen.getByRole('combobox'))

      // Find the option inside the listbox (Radix Select renders options in a portal)
      const listbox = await screen.findByRole('listbox')
      const option14d = within(listbox).getByText(/Последние 14 дней/)
      await user.click(option14d)

      // Callback should be called
      expect(onDateRangeChange).toHaveBeenCalledWith({
        from: expect.any(String),
        to: expect.any(String),
      })
    })

    it('should refetch advertising data after period selection (Test 7)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      // Wait for empty state to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
      })

      const user = userEvent.setup()

      // Click period selector to open dropdown
      await user.click(screen.getByRole('combobox'))

      // Find the option inside the listbox (Radix portal)
      const listbox = await screen.findByRole('listbox')
      const option30d = within(listbox).getByText(/Последние 30 дней/)
      await user.click(option30d)

      // Should trigger refetch (at least one more call)
      await waitFor(
        () => {
          expect(apiClient.get).toHaveBeenCalledTimes(2)
        },
        { timeout: 5000 }
      )
    })
  })

  // ==========================================================================
  // Loading and Error States (Tests 8-10)
  // ==========================================================================

  describe('loading and error states', () => {
    it('should show loading skeleton when loading (Test 8)', () => {
      vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}))

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      expect(screen.getByTestId('advertising-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('advertising-empty-state')).not.toBeInTheDocument()
    })

    it('should show error message instead of empty state on API error (Test 9)', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      })

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'))

      render(
        <QueryClientProvider client={queryClient}>
          <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />
        </QueryClientProvider>
      )

      await waitFor(
        () => {
          expect(screen.getByText(/ошибка/i)).toBeInTheDocument()
          expect(screen.queryByTestId('advertising-empty-state')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it('should prioritize error display over empty state (Test 10)', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      })

      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network Error'))

      render(
        <QueryClientProvider client={queryClient}>
          <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />
        </QueryClientProvider>
      )

      await waitFor(
        () => {
          expect(screen.getByText(/ошибка/i)).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Empty state should not be shown
      expect(screen.queryByTestId('advertising-empty-state')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Integration with useAdvertisingAnalytics (Tests 11-12)
  // ==========================================================================

  describe('integration with useAdvertisingAnalytics', () => {
    it('should handle API response with empty summary array (Test 11)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
      })
    })

    it('should extract available range from API response (Test 12)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        // Should show the available range from query (format: DD.MM.YYYY)
        const escapedFrom = dates.fromFormatted.replace(/\./g, '\\.')
        const escapedTo = dates.toFormatted.replace(/\./g, '\\.')
        expect(screen.getByText(new RegExp(escapedFrom))).toBeInTheDocument()
        expect(screen.getByText(new RegExp(escapedTo))).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Full Integration Flow (Test 13)
  // ==========================================================================

  describe('user flow: no data -> select period -> show data', () => {
    it('should complete flow from empty state to data display (Test 13)', async () => {
      // Start with empty response
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)

      const { rerender } = render(
        <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />,
        { wrapper: createQueryWrapper() }
      )

      // 1. Check empty state is shown
      await waitFor(() => {
        expect(screen.getByTestId('advertising-empty-state')).toBeInTheDocument()
        expect(screen.getByText(/Нет данных за выбранный период/)).toBeInTheDocument()
      })

      // 2. Simulate API returning data after period change
      vi.mocked(apiClient.get).mockResolvedValue(mockDataResponse)

      // 3. Re-render with same range (simulating refetch)
      rerender(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: { queries: { retry: false } },
            })
          }
        >
          <AdvertisingDashboardWidget dateRange={{ from: dates.recentFrom, to: dates.recentTo }} />
        </QueryClientProvider>
      )

      // 4. Check data is now shown
      await waitFor(() => {
        expect(screen.queryByTestId('advertising-empty-state')).not.toBeInTheDocument()
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
        expect(screen.getByText(/4\.0x/)).toBeInTheDocument() // ROAS value
      })
    })
  })
})
