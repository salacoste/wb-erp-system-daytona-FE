/**
 * Tests for useRateLimitStore
 * Story 44.34-FE: Rate limit tracking, cooldown handling, expiry cleanup
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRateLimitStore } from '../rateLimitStore'

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

describe('useRateLimitStore', () => {
  beforeEach(() => {
    useRateLimitStore.setState({ rateLimits: {} })
  })

  it('has correct initial state', () => {
    const state = useRateLimitStore.getState()
    expect(state.rateLimits).toEqual({})
  })

  it('adds a rate limit entry for an endpoint', () => {
    useRateLimitStore.getState().addRateLimit('/v1/tariffs/acceptance', 60, 'test')

    const entry = useRateLimitStore.getState().getRateLimit('/v1/tariffs/acceptance')
    expect(entry).not.toBeNull()
    expect(entry?.endpoint).toBe('/v1/tariffs/acceptance')
    expect(entry?.retryAfter).toBe(60)
    expect(entry?.statusCode).toBe(429)
    expect(entry?.context).toBe('test')
  })

  it('normalizes full URLs by stripping origin', () => {
    useRateLimitStore
      .getState()
      .addRateLimit('https://api.example.com/v1/tariffs?warehouseId=123', 30)

    // Full URLs are parsed via new URL() which separates pathname
    const entry = useRateLimitStore.getState().getRateLimit('/v1/tariffs')
    expect(entry).not.toBeNull()
    expect(entry?.retryAfter).toBe(30)
  })

  it('reports rate limited when within cooldown window', () => {
    useRateLimitStore.getState().addRateLimit('/v1/test', 60)

    expect(useRateLimitStore.getState().isRateLimited('/v1/test')).toBe(true)
  })

  it('reports not rate limited for unknown endpoints', () => {
    expect(useRateLimitStore.getState().isRateLimited('/v1/unknown')).toBe(false)
  })

  it('returns remaining seconds for active rate limit', () => {
    useRateLimitStore.getState().addRateLimit('/v1/test', 120)

    const remaining = useRateLimitStore.getState().getRemainingSeconds('/v1/test')
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(120)
  })

  it('returns 0 remaining seconds for unknown endpoint', () => {
    const remaining = useRateLimitStore.getState().getRemainingSeconds('/v1/unknown')
    expect(remaining).toBe(0)
  })

  it('clears rate limit for a specific endpoint', () => {
    useRateLimitStore.getState().addRateLimit('/v1/test', 60)
    expect(useRateLimitStore.getState().isRateLimited('/v1/test')).toBe(true)

    useRateLimitStore.getState().clearRateLimit('/v1/test')

    expect(useRateLimitStore.getState().isRateLimited('/v1/test')).toBe(false)
    expect(useRateLimitStore.getState().getRateLimit('/v1/test')).toBeNull()
  })

  it('clears only the specified endpoint, leaving others intact', () => {
    useRateLimitStore.getState().addRateLimit('/v1/a', 60)
    useRateLimitStore.getState().addRateLimit('/v1/b', 60)

    useRateLimitStore.getState().clearRateLimit('/v1/a')

    expect(useRateLimitStore.getState().isRateLimited('/v1/a')).toBe(false)
    expect(useRateLimitStore.getState().isRateLimited('/v1/b')).toBe(true)
  })

  it('clears expired entries via clearExpired', () => {
    // Add an entry with a very short retryAfter that already expired
    const pastTimestamp = Date.now() - 10000
    useRateLimitStore.setState({
      rateLimits: {
        '/v1/expired': {
          endpoint: '/v1/expired',
          timestamp: pastTimestamp,
          retryAfter: 1,
          statusCode: 429,
        },
        '/v1/active': {
          endpoint: '/v1/active',
          timestamp: Date.now(),
          retryAfter: 3600,
          statusCode: 429,
        },
      },
    })

    useRateLimitStore.getState().clearExpired()

    const state = useRateLimitStore.getState()
    expect(state.rateLimits['/v1/expired']).toBeUndefined()
    expect(state.rateLimits['/v1/active']).toBeDefined()
  })

  it('auto-clears expired entry when checking isRateLimited', () => {
    const pastTimestamp = Date.now() - 10000
    useRateLimitStore.setState({
      rateLimits: {
        '/v1/expired': {
          endpoint: '/v1/expired',
          timestamp: pastTimestamp,
          retryAfter: 1,
          statusCode: 429,
        },
      },
    })

    expect(useRateLimitStore.getState().isRateLimited('/v1/expired')).toBe(false)
    // Entry should have been auto-cleared
    expect(useRateLimitStore.getState().getRateLimit('/v1/expired')).toBeNull()
  })

  it('overwrites existing entry for same endpoint', () => {
    useRateLimitStore.getState().addRateLimit('/v1/test', 30)
    useRateLimitStore.getState().addRateLimit('/v1/test', 120)

    const entry = useRateLimitStore.getState().getRateLimit('/v1/test')
    expect(entry?.retryAfter).toBe(120)
  })

  it('handles full URL normalization', () => {
    useRateLimitStore.getState().addRateLimit('https://api.example.com/v1/tariffs', 60)

    const entry = useRateLimitStore.getState().getRateLimit('/v1/tariffs')
    expect(entry).not.toBeNull()
  })

  it('stores endpoint with query params when using path-only endpoint', () => {
    // normalizeEndpoint does not strip query params from non-http paths
    useRateLimitStore.getState().addRateLimit('/v1/tariffs/box?date=2025-01-01', 30)

    const entry = useRateLimitStore.getState().getRateLimit('/v1/tariffs/box?date=2025-01-01')
    expect(entry).not.toBeNull()
    expect(entry?.retryAfter).toBe(30)
  })

  it('strips query parameters from full URL', () => {
    useRateLimitStore
      .getState()
      .addRateLimit('https://api.example.com/v1/tariffs?warehouseId=123&date=2025-01', 45)

    const entry = useRateLimitStore.getState().getRateLimit('/v1/tariffs')
    expect(entry).not.toBeNull()
    expect(entry?.retryAfter).toBe(45)
  })

  it('handles endpoint without query parameters', () => {
    useRateLimitStore.getState().addRateLimit('/v1/simple-endpoint', 60)

    const entry = useRateLimitStore.getState().getRateLimit('/v1/simple-endpoint')
    expect(entry).not.toBeNull()
    expect(entry?.endpoint).toBe('/v1/simple-endpoint')
  })

  it('stores timestamp as Date.now()', () => {
    const before = Date.now()
    useRateLimitStore.getState().addRateLimit('/v1/test', 60)
    const after = Date.now()

    const entry = useRateLimitStore.getState().getRateLimit('/v1/test')
    expect(entry!.timestamp).toBeGreaterThanOrEqual(before)
    expect(entry!.timestamp).toBeLessThanOrEqual(after)
  })

  it('getRemainingSeconds returns correct countdown', () => {
    // Set timestamp to 30 seconds ago with 60s retryAfter
    useRateLimitStore.setState({
      rateLimits: {
        '/v1/test': {
          endpoint: '/v1/test',
          timestamp: Date.now() - 30000,
          retryAfter: 60,
          statusCode: 429,
        },
      },
    })

    const remaining = useRateLimitStore.getState().getRemainingSeconds('/v1/test')
    expect(remaining).toBeGreaterThan(25)
    expect(remaining).toBeLessThanOrEqual(35)
  })

  it('getRemainingSeconds returns 0 when past expiry', () => {
    useRateLimitStore.setState({
      rateLimits: {
        '/v1/test': {
          endpoint: '/v1/test',
          timestamp: Date.now() - 120000,
          retryAfter: 60,
          statusCode: 429,
        },
      },
    })

    const remaining = useRateLimitStore.getState().getRemainingSeconds('/v1/test')
    expect(remaining).toBe(0)
  })

  it('handles addRateLimit without context parameter', () => {
    useRateLimitStore.getState().addRateLimit('/v1/test', 30)

    const entry = useRateLimitStore.getState().getRateLimit('/v1/test')
    expect(entry).not.toBeNull()
    expect(entry?.context).toBeUndefined()
  })

  it('clears all rate limits when clearing multiple', () => {
    useRateLimitStore.getState().addRateLimit('/v1/a', 60)
    useRateLimitStore.getState().addRateLimit('/v1/b', 60)
    useRateLimitStore.getState().addRateLimit('/v1/c', 60)

    useRateLimitStore.getState().clearRateLimit('/v1/a')
    useRateLimitStore.getState().clearRateLimit('/v1/b')

    const state = useRateLimitStore.getState()
    expect(state.rateLimits['/v1/a']).toBeUndefined()
    expect(state.rateLimits['/v1/b']).toBeUndefined()
    expect(state.rateLimits['/v1/c']).toBeDefined()
  })

  it('clearExpired removes all expired entries at once', () => {
    const now = Date.now()
    useRateLimitStore.setState({
      rateLimits: {
        '/v1/expired-1': {
          endpoint: '/v1/expired-1',
          timestamp: now - 10000,
          retryAfter: 1,
          statusCode: 429,
        },
        '/v1/expired-2': {
          endpoint: '/v1/expired-2',
          timestamp: now - 20000,
          retryAfter: 5,
          statusCode: 429,
        },
        '/v1/active': {
          endpoint: '/v1/active',
          timestamp: now,
          retryAfter: 3600,
          statusCode: 429,
        },
      },
    })

    useRateLimitStore.getState().clearExpired()

    const state = useRateLimitStore.getState()
    expect(Object.keys(state.rateLimits)).toHaveLength(1)
    expect(state.rateLimits['/v1/active']).toBeDefined()
  })

  it('isRateLimited returns false after retryAfter expires', () => {
    useRateLimitStore.setState({
      rateLimits: {
        '/v1/test': {
          endpoint: '/v1/test',
          timestamp: Date.now() - 61000,
          retryAfter: 60,
          statusCode: 429,
        },
      },
    })

    expect(useRateLimitStore.getState().isRateLimited('/v1/test')).toBe(false)
  })
})
