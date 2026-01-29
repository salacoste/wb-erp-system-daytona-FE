/**
 * Unit Tests for AdvertisingDashboardWidget Synchronization
 * Story 60.6-FE: Sync Advertising Widget with Global Period
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Tests for widget prop behavior: dateRange, hideLocalSelector
 *
 * KEY REQUIREMENTS (AC):
 * - AC1: Local period state (selectedDays: 7d/14d/30d) removed when controlled
 * - AC2: Widget accepts dateRange prop from parent (dashboard context)
 * - AC3: Week-to-date-range conversion implemented (2026-W05 -> from/to dates)
 * - AC4: Widget header no longer shows local period selector when controlled
 * - AC5: Widget gracefully falls back to local state when outside provider
 * - AC6: Widget remains usable on standalone pages (e.g., /analytics/advertising)
 * - AC7: Period context label matches dashboard header format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

// Import components and helpers
import { AdvertisingDashboardWidget } from '../AdvertisingDashboardWidget'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'

// ==========================================================================
// Test Fixtures
// ==========================================================================

// Mock data matches backend response format (camelCase)
const mockAdvertisingData = {
  summary: {
    totalSales: 500000,
    totalSpend: 125300,
    avgRoas: 3.99,
    avgOrganicContribution: 72,
  },
  items: [],
}

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

// ==========================================================================
// Tests
// ==========================================================================

describe('AdvertisingDashboardWidget Sync - Story 60.6-FE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      cabinetId: 'test-cabinet-id',
    } as ReturnType<typeof useAuthStore>)
    vi.mocked(apiClient.get).mockResolvedValue(mockAdvertisingData)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // AC2: Widget accepts dateRange prop
  // ==========================================================================

  describe('dateRange prop handling (AC2)', () => {
    it('should accept dateRange prop from parent', async () => {
      render(<AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />, {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/реклама/i)).toBeInTheDocument()
      })
    })

    it('should use provided dateRange for API calls', async () => {
      render(<AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />, {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled()
      })

      const calls = vi.mocked(apiClient.get).mock.calls
      const call = calls[0][0] as string
      expect(call).toContain('from=2026-01-27')
      expect(call).toContain('to=2026-02-02')
    })

    it('should refetch when dateRange prop changes', async () => {
      const { rerender } = render(
        <AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1))

      // Change date range
      rerender(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: { queries: { retry: false } },
            })
          }
        >
          <AdvertisingDashboardWidget dateRange={{ from: '2026-01-20', to: '2026-01-26' }} />
        </QueryClientProvider>
      )

      await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2))
      const calls = vi.mocked(apiClient.get).mock.calls
      const lastCall = calls[1][0] as string
      expect(lastCall).toContain('from=2026-01-20')
    })
  })

  // ==========================================================================
  // AC1 & AC4: Hide local selector when controlled
  // ==========================================================================

  describe('hide local selector when controlled (AC1, AC4)', () => {
    it('should NOT show period selector when dateRange provided', async () => {
      render(<AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />, {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })

      // Should not find the local period selector dropdown
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      expect(screen.queryByText(/7 дней/)).not.toBeInTheDocument()
    })

    it('should NOT show period selector when hideLocalSelector=true', async () => {
      render(
        <AdvertisingDashboardWidget
          dateRange={{ from: '2026-01-27', to: '2026-02-02' }}
          hideLocalSelector={true}
        />,
        { wrapper: createQueryWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('should use external range, not default 7d', async () => {
      render(<AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />, {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled()
      })

      // API should be called with external range, NOT 7d default
      const calls = vi.mocked(apiClient.get).mock.calls
      const call = calls[0][0] as string
      expect(call).toContain('from=2026-01-27')
      expect(call).toContain('to=2026-02-02')
    })
  })

  // ==========================================================================
  // AC5: Fallback to local state
  // ==========================================================================

  describe('fallback to local state (AC5)', () => {
    it('should show period selector when no dateRange provided', async () => {
      render(<AdvertisingDashboardWidget />, { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })

      // Should find the local period selector dropdown
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should use internal 7d default when no dateRange prop', async () => {
      render(<AdvertisingDashboardWidget />, { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })

      // Default selection should be "7 дней"
      expect(screen.getByText(/7 дней/)).toBeInTheDocument()
    })

    it('should allow local period selection when standalone', async () => {
      const user = userEvent.setup()

      render(<AdvertisingDashboardWidget />, { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })

      // Open selector
      await user.click(screen.getByRole('combobox'))

      // Select 14 days
      await user.click(screen.getByText(/14 дней/))

      // Should have changed
      expect(screen.getByText(/14 дней/)).toBeInTheDocument()
    })

    it('should work correctly on /analytics/advertising page (standalone)', async () => {
      // Standalone mode = no dateRange prop, local state controls
      render(<AdvertisingDashboardWidget />, { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })

      // Has its own selector
      expect(screen.getByRole('combobox')).toBeInTheDocument()

      // Shows period options
      expect(screen.getByText(/7 дней/)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AC6: Backward compatibility
  // ==========================================================================

  describe('backward compatibility (AC6)', () => {
    it('should maintain existing className prop behavior', async () => {
      render(<AdvertisingDashboardWidget className="custom-class" />, {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByTestId('advertising-widget')).toBeInTheDocument()
      })

      expect(screen.getByTestId('advertising-widget')).toHaveClass('custom-class')
    })

    it('should render all existing metrics', async () => {
      render(<AdvertisingDashboardWidget />, { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(screen.getByText(/продажи/i)).toBeInTheDocument()
        expect(screen.getByText(/органика/i)).toBeInTheDocument()
        expect(screen.getByText(/roas/i)).toBeInTheDocument()
      })
    })

    it('should maintain "Подробная аналитика" link', async () => {
      render(<AdvertisingDashboardWidget />, { wrapper: createQueryWrapper() })

      await waitFor(() => {
        expect(screen.getByText(/подробная аналитика/i)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Data display with external range
  // ==========================================================================

  describe('data display with external range', () => {
    it('should display metrics from fetched data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        summary: {
          totalSales: 500000,
          totalSpend: 125300,
          avgRoas: 3.99,
          avgOrganicContribution: 72,
        },
        items: [],
      })

      render(<AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />, {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/500/)).toBeInTheDocument() // sales formatted
        expect(screen.getByText(/72%/)).toBeInTheDocument() // organic share
        expect(screen.getByText(/4\.0x/)).toBeInTheDocument() // ROAS (3.99 rounds to 4.0)
      })
    })

    it('should show loading state while fetching', () => {
      vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}))

      render(<AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />, {
        wrapper: createQueryWrapper(),
      })

      expect(screen.getByTestId('advertising-skeleton')).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      })

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'))

      render(
        <QueryClientProvider client={queryClient}>
          <AdvertisingDashboardWidget dateRange={{ from: '2026-01-27', to: '2026-02-02' }} />
        </QueryClientProvider>
      )

      await waitFor(
        () => {
          expect(screen.getByText(/ошибка/i)).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })
})

// ==========================================================================
// weekToDateRange Helper Tests (AC3)
// ==========================================================================

describe('weekToDateRange helper (AC3)', () => {
  it('should convert 2026-W05 to correct date range', () => {
    const result = weekToDateRange('2026-W05')
    expect(result.from).toBe('2026-01-26') // Monday
    expect(result.to).toBe('2026-02-01') // Sunday
  })

  it('should handle week 1 correctly (may start in previous year)', () => {
    const result = weekToDateRange('2026-W01')
    expect(result.from).toBe('2025-12-29') // Week 1 of 2026 starts in 2025
    expect(result.to).toBe('2026-01-04')
  })

  it('should handle week 52 correctly', () => {
    const result = weekToDateRange('2025-W52')
    expect(result.from).toBe('2025-12-22')
    expect(result.to).toBe('2025-12-28')
  })

  it('should handle week 53 when year has 53 weeks', () => {
    // 2020 had 53 weeks
    const result = weekToDateRange('2020-W53')
    expect(result.from).toBe('2020-12-28')
    expect(result.to).toBe('2021-01-03')
  })

  it('should return dates in YYYY-MM-DD format', () => {
    const result = weekToDateRange('2026-W10')
    expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should handle single-digit week numbers', () => {
    const result = weekToDateRange('2026-W03')
    expect(result.from).toBe('2026-01-12')
    expect(result.to).toBe('2026-01-18')
  })
})

// ==========================================================================
// monthToDateRange Helper Tests
// ==========================================================================

describe('monthToDateRange helper', () => {
  it('should convert 2026-01 to correct date range', () => {
    const result = monthToDateRange('2026-01')
    expect(result.from).toBe('2026-01-01')
    expect(result.to).toBe('2026-01-31')
  })

  it('should handle February correctly (non-leap year)', () => {
    const result = monthToDateRange('2026-02')
    expect(result.from).toBe('2026-02-01')
    expect(result.to).toBe('2026-02-28') // 2026 is not a leap year
  })

  it('should handle February correctly (leap year)', () => {
    const result = monthToDateRange('2024-02')
    expect(result.from).toBe('2024-02-01')
    expect(result.to).toBe('2024-02-29') // 2024 is a leap year
  })

  it('should handle month with 30 days', () => {
    const result = monthToDateRange('2026-04')
    expect(result.from).toBe('2026-04-01')
    expect(result.to).toBe('2026-04-30')
  })

  it('should handle December (year boundary)', () => {
    const result = monthToDateRange('2026-12')
    expect(result.from).toBe('2026-12-01')
    expect(result.to).toBe('2026-12-31')
  })
})

// ==========================================================================
// Integration with Dashboard Period Context
// ==========================================================================

describe('integration with DashboardPeriodContext', () => {
  it('should update when global period context changes', async () => {
    // This tests the pattern: parent converts week -> dateRange -> widget
    const dateRange1 = weekToDateRange('2026-W04')
    const dateRange2 = weekToDateRange('2026-W05')

    const { rerender } = render(<AdvertisingDashboardWidget dateRange={dateRange1} />, {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled())

    // Simulate parent changing period
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <AdvertisingDashboardWidget dateRange={dateRange2} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      const calls = vi.mocked(apiClient.get).mock.calls
      const lastCall = calls[calls.length - 1][0] as string
      expect(lastCall).toContain(`from=${dateRange2.from}`)
      expect(lastCall).toContain(`to=${dateRange2.to}`)
    })
  })

  it('should receive converted dateRange from parent dashboard', async () => {
    vi.clearAllMocks() // Ensure clean state

    // Dashboard converts week to dateRange using weekToDateRange
    const weekDateRange = weekToDateRange('2026-W05')

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <AdvertisingDashboardWidget dateRange={weekDateRange} hideLocalSelector />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled()
    })

    // Widget receives { from, to } props and uses them
    const calls = vi.mocked(apiClient.get).mock.calls
    // Find the call that contains our expected date range
    const matchingCall = calls.find(c => (c[0] as string).includes(`from=${weekDateRange.from}`))
    expect(matchingCall).toBeDefined()
    const call = matchingCall![0] as string
    expect(call).toContain(`from=${weekDateRange.from}`)
    expect(call).toContain(`to=${weekDateRange.to}`)
  })
})
