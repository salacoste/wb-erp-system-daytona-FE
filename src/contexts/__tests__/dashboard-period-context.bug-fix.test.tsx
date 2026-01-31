/**
 * Tests for Period Selection Bug Fix
 * Bug: When clicking "Month" button, code was using current incomplete week instead of last completed week
 * Fix: Always derive month from last completed week when switching to month period type
 *
 * Context:
 * - Backend filled data for weeks 2025-W47 to 2026-W04
 * - Current date: 2026-01-30 (Friday, week 2026-W05 is incomplete)
 * - User clicking "Month" should show month containing last completed week (2026-W04)
 *
 * @see docs/pages/dashboard/period-selection-bug-fix.md
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPeriodProvider, useDashboardPeriod } from '../dashboard-period-context'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

// Mock Next.js navigation
const mockSearchParams = new URLSearchParams()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => mockSearchParams),
  useRouter: vi.fn(() => ({ replace: mockReplace, push: vi.fn() })),
  usePathname: vi.fn(() => '/dashboard'),
}))

// Mock getLastCompletedWeek to return a specific week
vi.mock('@/lib/margin-helpers', () => ({
  getLastCompletedWeek: vi.fn(() => '2026-W04'),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Test wrapper with QueryClient and DashboardPeriodProvider
function createWrapper(initialWeek?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <DashboardPeriodProvider initialWeek={initialWeek}>{children}</DashboardPeriodProvider>
      </QueryClientProvider>
    )
  }
}

describe('Dashboard Period Context - Bug Fix', () => {
  beforeEach(() => {
    // Mock last completed week as 2026-W04
    // (on 2026-01-30 Friday, last completed is 2026-W04)
    vi.mocked(getLastCompletedWeek).mockReturnValue('2026-W04')
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('should derive month from last completed week when switching to month period', () => {
    const { result } = renderHook(() => useDashboardPeriod(), {
      wrapper: createWrapper('2026-W04'),
    })

    // Initial state: week period with last completed week
    expect(result.current.periodType).toBe('week')
    expect(result.current.selectedWeek).toBe('2026-W04')

    // Switch to month period
    act(() => {
      result.current.setPeriodType('month')
    })

    // CRITICAL FIX: Month should be derived from last completed week (2026-W04)
    // not from any other week. 2026-W04 Thursday is 2026-01-23, so month is 2026-01
    expect(result.current.periodType).toBe('month')
    expect(result.current.selectedMonth).toBe('2026-01')
  })

  test('should not use incomplete current week when switching to month', () => {
    const { result } = renderHook(() => useDashboardPeriod(), {
      wrapper: createWrapper('2026-W05'),
    })

    // Even though initialWeek is 2026-W05 (incomplete), switching to month
    // should use last completed week (2026-W04) to derive the month
    act(() => {
      result.current.setPeriodType('month')
    })

    // Month should be 2026-01 (from 2026-W04), not 2026-02 (from 2026-W05)
    expect(result.current.selectedMonth).toBe('2026-01')
  })

  test('should correctly derive month for different last completed weeks', () => {
    const testCases = [
      { week: '2025-W47', expectedMonth: '2025-11' }, // Nov 2025
      { week: '2025-W52', expectedMonth: '2025-12' }, // Dec 2025
      { week: '2026-W01', expectedMonth: '2026-01' }, // Jan 2026
      { week: '2026-W04', expectedMonth: '2026-01' }, // Jan 2026
    ]

    testCases.forEach(({ week, expectedMonth }) => {
      vi.mocked(getLastCompletedWeek).mockReturnValue(week)

      const { result } = renderHook(() => useDashboardPeriod(), {
        wrapper: createWrapper(week),
      })

      act(() => {
        result.current.setPeriodType('month')
      })

      expect(result.current.selectedMonth).toBe(expectedMonth)
    })
  })

  test('should handle switching back and forth between week and month', () => {
    const { result } = renderHook(() => useDashboardPeriod(), {
      wrapper: createWrapper('2026-W04'),
    })

    // Start with week
    expect(result.current.periodType).toBe('week')

    // Switch to month
    act(() => {
      result.current.setPeriodType('month')
    })
    expect(result.current.periodType).toBe('month')
    expect(result.current.selectedMonth).toBe('2026-01')

    // Switch back to week
    act(() => {
      result.current.setPeriodType('week')
    })
    expect(result.current.periodType).toBe('week')
    expect(result.current.selectedWeek).toBe('2026-W04')

    // Switch to month again
    act(() => {
      result.current.setPeriodType('month')
    })
    expect(result.current.periodType).toBe('month')
    // Should still be 2026-01 (from last completed week)
    expect(result.current.selectedMonth).toBe('2026-01')
  })
})

describe('Dashboard Period Context - Edge Cases', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('should handle week at month boundary correctly', () => {
    // 2025-W52: Dec 29, 2025 - Jan 4, 2026
    // Thursday is Dec 31, 2025, so month should be 2025-12
    vi.mocked(getLastCompletedWeek).mockReturnValue('2025-W52')

    const { result } = renderHook(() => useDashboardPeriod(), {
      wrapper: createWrapper('2025-W52'),
    })

    act(() => {
      result.current.setPeriodType('month')
    })

    expect(result.current.selectedMonth).toBe('2025-12')
  })

  test('should handle week spanning year boundary', () => {
    // 2026-W01: Jan 5, 2026 - Jan 11, 2026
    // Thursday is Jan 8, 2026, so month should be 2026-01
    vi.mocked(getLastCompletedWeek).mockReturnValue('2026-W01')

    const { result } = renderHook(() => useDashboardPeriod(), {
      wrapper: createWrapper('2026-W01'),
    })

    act(() => {
      result.current.setPeriodType('month')
    })

    expect(result.current.selectedMonth).toBe('2026-01')
  })
})
