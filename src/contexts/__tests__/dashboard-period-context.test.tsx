/**
 * TDD Tests for Story 60.1-FE: Dashboard Period State Management
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * GREEN Phase: Tests enabled after implementation
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPeriodProvider, useDashboardPeriod } from '../dashboard-period-context'

// Mock useSearchParams from Next.js
const mockSearchParams = new URLSearchParams()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => mockSearchParams),
  useRouter: vi.fn(() => ({ replace: mockReplace, push: vi.fn() })),
  usePathname: vi.fn(() => '/dashboard'),
}))

// Mock margin-helpers for getLastCompletedWeek
vi.mock('@/lib/margin-helpers', () => ({
  getLastCompletedWeek: vi.fn(() => '2026-W05'),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Test fixtures
const CURRENT_WEEK = '2026-W05'
const PREVIOUS_WEEK = '2026-W04'
const CURRENT_MONTH = '2026-01'
const PREVIOUS_MONTH = '2025-12'

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <DashboardPeriodProvider>{children}</DashboardPeriodProvider>
      </QueryClientProvider>
    )
  }
}

function createWrapperWithInitialWeek(week: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <DashboardPeriodProvider initialWeek={week}>{children}</DashboardPeriodProvider>
      </QueryClientProvider>
    )
  }
}

// =============================================================================
// Story 60.1-FE: AC1 - Context Provider Renders Children
// =============================================================================

describe('Story 60.1-FE: AC1 - Context Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('renders children without crashing', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current).toBeDefined()
    })

    it('throws error when useDashboardPeriod is used outside provider', () => {
      expect(() => {
        renderHook(() => useDashboardPeriod())
      }).toThrow(/DashboardPeriodProvider/)
    })

    it('accepts initialWeek prop for testing', () => {
      const { result } = renderHook(() => useDashboardPeriod(), {
        wrapper: createWrapperWithInitialWeek('2026-W03'),
      })
      expect(result.current.selectedWeek).toBe('2026-W03')
    })
  })
})

// =============================================================================
// Story 60.1-FE: AC3 - Default State is Current Completed Week
// =============================================================================

describe('Story 60.1-FE: AC3 - Default State Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('initial values', () => {
    it('initializes periodType to "week" by default', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current.periodType).toBe('week')
    })

    it('initializes selectedWeek to last completed week', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current.selectedWeek).toBe(CURRENT_WEEK)
    })

    it('initializes selectedMonth from selectedWeek', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current.selectedMonth).toBe(CURRENT_MONTH)
    })

    it('initializes isLoading to true then false after hydration', async () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      // After useEffect runs, isLoading should be false
      expect(result.current.isLoading).toBe(false)
    })

    it('initializes lastRefresh to current date', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current.lastRefresh).toBeInstanceOf(Date)
    })
  })
})

// =============================================================================
// Story 60.1-FE: AC1, AC2 - Period Type State Management
// =============================================================================

describe('Story 60.1-FE: setPeriodType Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('setPeriodType', () => {
    it('updates periodType from week to month', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      expect(result.current.periodType).toBe('month')
    })

    it('updates periodType from month to week', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      act(() => result.current.setPeriodType('week'))
      expect(result.current.periodType).toBe('week')
    })

    it('derives selectedMonth from selectedWeek when switching to month', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W05'))
      act(() => result.current.setPeriodType('month'))
      expect(result.current.selectedMonth).toBe('2026-01')
    })

    it('persists periodType to localStorage', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dashboard-period-type', 'month')
    })
  })
})

// =============================================================================
// Story 60.1-FE: AC1 - Week Selection
// =============================================================================

describe('Story 60.1-FE: setWeek Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('setWeek', () => {
    it('updates selectedWeek state', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W04'))
      expect(result.current.selectedWeek).toBe('2026-W04')
    })

    it('updates previousWeek when selectedWeek changes', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W04'))
      expect(result.current.previousWeek).toBe('2026-W03')
    })

    it('syncs to URL params when week changes', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W04'))
      expect(mockReplace).toHaveBeenCalled()
    })

    it('validates week format before setting', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      const initialWeek = result.current.selectedWeek
      act(() => result.current.setWeek('invalid'))
      expect(result.current.selectedWeek).toBe(initialWeek) // unchanged
    })
  })
})

// =============================================================================
// Story 60.1-FE: AC1 - Month Selection
// =============================================================================

describe('Story 60.1-FE: setMonth Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('setMonth', () => {
    it('updates selectedMonth state', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      act(() => result.current.setMonth('2025-12'))
      expect(result.current.selectedMonth).toBe('2025-12')
    })

    it('updates previousMonth when selectedMonth changes', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setMonth('2026-01'))
      expect(result.current.previousMonth).toBe('2025-12')
    })

    it('syncs to URL params when month changes', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setMonth('2025-12'))
      expect(mockReplace).toHaveBeenCalled()
    })
  })
})

// =============================================================================
// Story 60.1-FE: AC7 - Previous Period Computation
// =============================================================================

describe('Story 60.1-FE: AC7 - Previous Period Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('previousWeek computation', () => {
    it('computes previousWeek as selectedWeek minus 1', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W05'))
      expect(result.current.previousWeek).toBe(PREVIOUS_WEEK)
    })

    it('handles year boundary for previousWeek (W01 -> prev year W52)', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W01'))
      expect(result.current.previousWeek).toBe('2025-W52')
    })

    it('handles W53 year edge case', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2021-W01'))
      expect(result.current.previousWeek).toBe('2020-W53')
    })
  })

  describe('previousMonth computation', () => {
    it('computes previousMonth as selectedMonth minus 1', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setMonth('2026-02'))
      expect(result.current.previousMonth).toBe('2026-01')
    })

    it('handles year boundary for previousMonth (01 -> prev year 12)', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setMonth('2026-01'))
      expect(result.current.previousMonth).toBe(PREVIOUS_MONTH)
    })
  })
})

// =============================================================================
// Story 60.1-FE: AC5 - localStorage Persistence
// =============================================================================

describe('Story 60.1-FE: AC5 - localStorage Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('periodType persistence', () => {
    it('reads periodType from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('month')
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current.periodType).toBe('month')
    })

    it('writes periodType to localStorage on change', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dashboard-period-type', 'month')
    })

    it('handles invalid localStorage value gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid')
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current.periodType).toBe('week') // Default
    })

    it('handles localStorage access error gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })
      // Should not crash, should use defaults
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      expect(result.current.periodType).toBe('week')
    })
  })
})

// =============================================================================
// Story 60.1-FE: AC8, AC9 - Refresh Action
// =============================================================================

describe('Story 60.1-FE: AC8, AC9 - Refresh Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('refresh()', () => {
    it('updates lastRefresh timestamp', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      const before = result.current.lastRefresh
      vi.advanceTimersByTime(1000)
      act(() => result.current.refresh())
      expect(result.current.lastRefresh.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})

// =============================================================================
// Story 60.1-FE: getDateRange Helper
// =============================================================================

describe('Story 60.1-FE: getDateRange Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockSearchParams.delete('week')
    mockSearchParams.delete('month')
    mockSearchParams.delete('type')
  })

  afterEach(() => {
    cleanup()
  })

  describe('week date range', () => {
    it('returns correct start date for week (Monday)', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W05'))
      const range = result.current.getDateRange()
      expect(range.startDate).toBe('2026-01-26')
    })

    it('returns correct end date for week (Sunday)', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setWeek('2026-W05'))
      const range = result.current.getDateRange()
      expect(range.endDate).toBe('2026-02-01')
    })
  })

  describe('month date range', () => {
    it('returns correct start date for month (1st)', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      act(() => result.current.setMonth('2026-01'))
      const range = result.current.getDateRange()
      expect(range.startDate).toBe('2026-01-01')
    })

    it('returns correct end date for month (last day)', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      act(() => result.current.setMonth('2026-01'))
      const range = result.current.getDateRange()
      expect(range.endDate).toBe('2026-01-31')
    })

    it('handles February correctly (28 or 29 days)', () => {
      const { result } = renderHook(() => useDashboardPeriod(), { wrapper: createWrapper() })
      act(() => result.current.setPeriodType('month'))
      act(() => result.current.setMonth('2026-02'))
      const range = result.current.getDateRange()
      expect(range.endDate).toBe('2026-02-28') // 2026 is not a leap year
    })
  })
})
