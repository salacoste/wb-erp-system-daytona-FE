/**
 * Unit tests for useRateLimitCooldown hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRateLimitCooldown } from '../useRateLimitCooldown'

const mockAddRateLimit = vi.fn()
const mockIsRateLimited = vi.fn()
const mockGetRemainingSeconds = vi.fn().mockReturnValue(0)
const mockClearRateLimit = vi.fn()

vi.mock('@/stores/rateLimitStore', () => ({
  useRateLimitStore: () => ({
    addRateLimit: mockAddRateLimit,
    isRateLimited: mockIsRateLimited,
    getRemainingSeconds: mockGetRemainingSeconds,
    clearRateLimit: mockClearRateLimit,
  }),
}))

describe('useRateLimitCooldown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockGetRemainingSeconds.mockReturnValue(0)
    mockIsRateLimited.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns default cooldown state', () => {
    const { result } = renderHook(() => useRateLimitCooldown())
    expect(result.current.cooldown.isLimited).toBe(false)
    expect(result.current.cooldown.remainingSeconds).toBe(0)
    expect(result.current.cooldown.cooldownUntil).toBeNull()
    expect(result.current.cooldown.retryAfter).toBeNull()
  })

  it('startCooldown sets limited state and calls store', () => {
    const { result } = renderHook(() => useRateLimitCooldown())
    act(() => {
      result.current.startCooldown('/v1/tariffs/box', 60, 'price-calc')
    })

    expect(mockAddRateLimit).toHaveBeenCalledWith('/v1/tariffs/box', 60, 'price-calc')
    expect(result.current.cooldown.isLimited).toBe(true)
    expect(result.current.cooldown.remainingSeconds).toBe(60)
    expect(result.current.cooldown.retryAfter).toBe(60)
    expect(result.current.cooldown.cooldownUntil).toBeGreaterThan(Date.now())
  })

  it('startCooldown works without context', () => {
    const { result } = renderHook(() => useRateLimitCooldown())
    act(() => {
      result.current.startCooldown('/v1/test', 30)
    })

    expect(mockAddRateLimit).toHaveBeenCalledWith('/v1/test', 30, undefined)
    expect(result.current.cooldown.isLimited).toBe(true)
  })

  it('clearCooldown resets state', () => {
    const { result } = renderHook(() => useRateLimitCooldown())
    act(() => {
      result.current.startCooldown('/v1/test', 30)
    })
    expect(result.current.cooldown.isLimited).toBe(true)

    act(() => {
      result.current.clearCooldown()
    })

    expect(result.current.cooldown.isLimited).toBe(false)
    expect(result.current.cooldown.remainingSeconds).toBe(0)
  })

  it('isEndpointLimited delegates to store', () => {
    mockIsRateLimited.mockReturnValue(true)
    const { result } = renderHook(() => useRateLimitCooldown())
    expect(result.current.isEndpointLimited('/v1/test')).toBe(true)
    expect(mockIsRateLimited).toHaveBeenCalledWith('/v1/test')
  })

  it('getEndpointRemaining delegates to store', () => {
    mockGetRemainingSeconds.mockReturnValue(42)
    const { result } = renderHook(() => useRateLimitCooldown())
    expect(result.current.getEndpointRemaining('/v1/test')).toBe(42)
    expect(mockGetRemainingSeconds).toHaveBeenCalledWith('/v1/test')
  })

  it('countdown decrements remaining seconds', () => {
    const { result } = renderHook(() => useRateLimitCooldown())
    act(() => {
      result.current.startCooldown('/v1/test', 5)
    })
    expect(result.current.cooldown.remainingSeconds).toBe(5)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.cooldown.remainingSeconds).toBe(4)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.cooldown.remainingSeconds).toBe(3)
  })

  it('countdown auto-clears when reaching zero', () => {
    const { result } = renderHook(() => useRateLimitCooldown('/v1/test'))
    act(() => {
      result.current.startCooldown('/v1/test', 2)
    })
    expect(result.current.cooldown.isLimited).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.cooldown.isLimited).toBe(false)
    expect(mockClearRateLimit).toHaveBeenCalledWith('/v1/test')
  })

  it('syncs with store on mount when endpoint is provided', () => {
    mockIsRateLimited.mockReturnValue(true)
    mockGetRemainingSeconds.mockReturnValue(15)

    const { result } = renderHook(() => useRateLimitCooldown('/v1/test'))

    expect(result.current.cooldown.isLimited).toBe(true)
    expect(result.current.cooldown.remainingSeconds).toBe(15)
  })

  it('does not sync on mount when no endpoint provided', () => {
    const { result } = renderHook(() => useRateLimitCooldown())
    expect(result.current.cooldown.isLimited).toBe(false)
    // isRateLimited should not be called without an endpoint
    expect(mockIsRateLimited).not.toHaveBeenCalled()
  })
})
