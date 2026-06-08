/**
 * Unit tests for useEfficiencyFilter hook + getEfficiencyFilterParam
 *
 * Note: useEfficiencyFilter uses Next.js router/searchParams which are complex to mock.
 * We test the exported pure function getEfficiencyFilterParam directly and
 * mock the Next.js navigation module for the hook integration test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEfficiencyFilter, getEfficiencyFilterParam } from '../useEfficiencyFilter'
import type { FilterableEfficiencyStatus } from '@/types/efficiency-filter'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/analytics/advertising/campaigns',
  useSearchParams: () => mockSearchParams,
}))

// ---------------------------------------------------------------------------
// Pure function tests
// ---------------------------------------------------------------------------
describe('getEfficiencyFilterParam', () => {
  it('returns undefined for null filter', () => {
    expect(getEfficiencyFilterParam(null)).toBeUndefined()
  })

  it('returns the status string for a valid filter', () => {
    expect(getEfficiencyFilterParam('loss')).toBe('loss')
    expect(getEfficiencyFilterParam('excellent')).toBe('excellent')
    expect(getEfficiencyFilterParam('good')).toBe('good')
  })
})

// ---------------------------------------------------------------------------
// Hook tests
// ---------------------------------------------------------------------------
describe('useEfficiencyFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset searchParams
    for (const key of Array.from(mockSearchParams.keys())) {
      mockSearchParams.delete(key)
    }
  })

  it('returns null activeFilter when no URL param', () => {
    const { result } = renderHook(() => useEfficiencyFilter())
    expect(result.current.activeFilter).toBeNull()
    expect(result.current.hasActiveFilter).toBe(false)
  })

  it('reads filter from URL param', () => {
    mockSearchParams.set('efficiency', 'loss')
    const { result } = renderHook(() => useEfficiencyFilter())
    expect(result.current.activeFilter).toBe('loss')
    expect(result.current.hasActiveFilter).toBe(true)
  })

  it('ignores invalid URL param', () => {
    mockSearchParams.set('efficiency', 'invalid-status')
    const { result } = renderHook(() => useEfficiencyFilter())
    expect(result.current.activeFilter).toBeNull()
  })

  it('isActive returns true for matching filter', () => {
    mockSearchParams.set('efficiency', 'good')
    const { result } = renderHook(() => useEfficiencyFilter())
    expect(result.current.isActive('good')).toBe(true)
    expect(result.current.isActive('loss')).toBe(false)
  })

  it('setFilter pushes URL with param', () => {
    const { result } = renderHook(() => useEfficiencyFilter())
    act(() => {
      result.current.setFilter('poor' as FilterableEfficiencyStatus)
    })
    expect(mockPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockPush.mock.calls[0][0] as string
    expect(pushedUrl).toContain('efficiency=poor')
  })

  it('setFilter toggles off when same filter is active', () => {
    mockSearchParams.set('efficiency', 'loss')
    const { result } = renderHook(() => useEfficiencyFilter())
    act(() => {
      result.current.setFilter('loss' as FilterableEfficiencyStatus)
    })
    expect(mockPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockPush.mock.calls[0][0] as string
    // Should not contain efficiency param (toggled off)
    expect(pushedUrl).not.toContain('efficiency')
  })

  it('clearFilter removes param from URL', () => {
    mockSearchParams.set('efficiency', 'loss')
    const { result } = renderHook(() => useEfficiencyFilter())
    act(() => {
      result.current.clearFilter()
    })
    expect(mockPush).toHaveBeenCalledTimes(1)
    const pushedUrl = mockPush.mock.calls[0][0] as string
    expect(pushedUrl).not.toContain('efficiency')
  })
})
