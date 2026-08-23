import { afterEach, describe, expect, it, vi } from 'vitest'
import { filterExpired, initCrossTabSync, normalizeEndpoint } from '../rate-limit-helpers'
import type { RateLimitEntry } from '../rateLimitStore'

describe('rate-limit helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes absolute URLs while preserving path-only endpoint keys', () => {
    expect(normalizeEndpoint('https://api.example.com/v1/tariffs?warehouseId=123')).toBe(
      '/v1/tariffs'
    )
    expect(normalizeEndpoint('/v1/tariffs?warehouseId=123')).toBe('/v1/tariffs?warehouseId=123')
  })

  it('returns a new map containing only entries whose cooldown is active', () => {
    const now = Date.UTC(2026, 7, 24, 12, 0, 0)
    const entries: Record<string, RateLimitEntry> = {
      active: {
        endpoint: 'active',
        timestamp: now - 5_000,
        retryAfter: 10,
        statusCode: 429,
      },
      expired: {
        endpoint: 'expired',
        timestamp: now - 10_000,
        retryAfter: 5,
        statusCode: 429,
      },
    }

    expect(filterExpired(entries, now)).toEqual({ active: entries.active })
    expect(filterExpired(entries, now)).not.toBe(entries)
  })

  it('applies valid persisted rate limits received from another tab', () => {
    const setState = vi.fn()
    const addEventListener = vi.spyOn(window, 'addEventListener')
    initCrossTabSync(setState)

    const storageListener = addEventListener.mock.calls.find(
      ([type]) => type === 'storage'
    )?.[1] as EventListener | undefined
    expect(storageListener).toBeTypeOf('function')

    const rateLimits = {
      '/v1/test': {
        endpoint: '/v1/test',
        timestamp: 1,
        retryAfter: 60,
        statusCode: 429,
      },
    }
    storageListener?.(
      new StorageEvent('storage', {
        key: 'rate-limit-storage',
        newValue: JSON.stringify({ state: { rateLimits } }),
      })
    )

    expect(setState).toHaveBeenCalledWith({ rateLimits })
  })

  it('ignores unrelated or malformed storage events', () => {
    const setState = vi.fn()
    const addEventListener = vi.spyOn(window, 'addEventListener')
    initCrossTabSync(setState)

    const storageListener = addEventListener.mock.calls.find(
      ([type]) => type === 'storage'
    )?.[1] as EventListener | undefined
    storageListener?.(new StorageEvent('storage', { key: 'another-key', newValue: '{"state":{}}' }))
    storageListener?.(
      new StorageEvent('storage', { key: 'rate-limit-storage', newValue: '{invalid-json' })
    )

    expect(setState).not.toHaveBeenCalled()
  })
})
