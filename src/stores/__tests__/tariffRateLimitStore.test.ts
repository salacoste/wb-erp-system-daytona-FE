/**
 * Tests for useTariffRateLimitStore
 * Story 52-FE.6: Rate limit header parsing, decrement, reset
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTariffRateLimitStore } from '../tariffRateLimitStore'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

describe('useTariffRateLimitStore', () => {
  beforeEach(() => {
    useTariffRateLimitStore.getState().reset()
    vi.mocked(toast.warning).mockClear()
  })

  it('has correct initial state', () => {
    const state = useTariffRateLimitStore.getState()
    expect(state.limit).toBe(10)
    expect(state.remaining).toBe(10)
    expect(state.resetAt).toBeNull()
  })

  it('updates state from response headers', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '7',
      'X-RateLimit-Reset': '1700000000',
    })

    useTariffRateLimitStore.getState().updateFromHeaders(headers)

    const state = useTariffRateLimitStore.getState()
    expect(state.limit).toBe(10)
    expect(state.remaining).toBe(7)
    expect(state.resetAt).toBe(1700000000000) // seconds -> ms
  })

  it('preserves limit and remaining when headers are missing', () => {
    // First set some values
    const headers = new Headers({
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '15',
      'X-RateLimit-Reset': '1700000000',
    })
    useTariffRateLimitStore.getState().updateFromHeaders(headers)

    // Update with empty headers — limit/remaining preserved, resetAt resets to null
    const emptyHeaders = new Headers()
    useTariffRateLimitStore.getState().updateFromHeaders(emptyHeaders)

    const state = useTariffRateLimitStore.getState()
    expect(state.limit).toBe(20)
    expect(state.remaining).toBe(15)
    // resetAt falls back to null when header is absent (not preserved)
    expect(state.resetAt).toBeNull()
  })

  it('decrements remaining count', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '5',
    })
    useTariffRateLimitStore.getState().updateFromHeaders(headers)

    useTariffRateLimitStore.getState().decrementRemaining()

    expect(useTariffRateLimitStore.getState().remaining).toBe(4)
  })

  it('does not decrement below zero', () => {
    useTariffRateLimitStore.setState({ remaining: 0 })

    useTariffRateLimitStore.getState().decrementRemaining()

    expect(useTariffRateLimitStore.getState().remaining).toBe(0)
  })

  it('resets to default state', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '3',
      'X-RateLimit-Reset': '1700000000',
    })
    useTariffRateLimitStore.getState().updateFromHeaders(headers)

    useTariffRateLimitStore.getState().reset()

    const state = useTariffRateLimitStore.getState()
    expect(state.limit).toBe(10)
    expect(state.remaining).toBe(10)
    expect(state.resetAt).toBeNull()
  })

  it('shows warning toast when remaining drops to 3 or below', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '2',
    })
    useTariffRateLimitStore.getState().updateFromHeaders(headers)

    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('2'))
  })

  it('does not show warning when remaining is above 3', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '8',
    })
    useTariffRateLimitStore.getState().updateFromHeaders(headers)

    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('does not show warning when remaining is 0', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '0',
    })
    useTariffRateLimitStore.getState().updateFromHeaders(headers)

    expect(toast.warning).not.toHaveBeenCalled()
  })
})
