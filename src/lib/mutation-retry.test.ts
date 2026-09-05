/**
 * Unit tests for mutation-retry (debt FE-D1)
 *
 * Verifies the mutation retry predicate wired into the global QueryClient
 * defaults (src/app/providers.tsx): 4xx client errors are permanent and must
 * never be retried, while transient failures (5xx, network failures — which
 * api-client surfaces as ApiError with status 0) keep the historical
 * retry:1 semantics (at most one automatic retry).
 */

import { describe, it, expect } from 'vitest'
import { ApiError } from '@/types/api'
import { makeQueryClient } from '@/app/providers'
import { shouldRetryMutation } from './mutation-retry'

describe('shouldRetryMutation', () => {
  describe('FE-D1: 4xx client errors are never retried', () => {
    it.each([400, 401, 403, 404, 422, 429])(
      'does not retry ApiError %i even at failureCount 0',
      status => {
        expect(shouldRetryMutation(0, new ApiError('client error', status))).toBe(false)
      }
    )

    it('does not retry a rejected ApiError instance (thrown shape)', () => {
      const error = new ApiError('WB token rejected', 400)
      expect(shouldRetryMutation(0, error)).toBe(false)
    })

    it('retries a flat Error WITHOUT a status field (duck-form)', () => {
      // Documents the predicate's blindness: a mapped error that lost its
      // status (e.g. handleWbTokenUpdateError re-throwing flat Error) is
      // unclassifiable — this is WHY the FE-D1 fix must live at the throw
      // site (api-wb-token-errors.ts), not inside this predicate.
      expect(shouldRetryMutation(0, new Error('opaque mapped failure'))).toBe(true)
    })
  })

  describe('transient failures keep retry:1 semantics', () => {
    it.each([500, 502, 503])('retries ApiError %i at failureCount 0', status => {
      expect(shouldRetryMutation(0, new ApiError('server error', status))).toBe(true)
    })

    it('retries a network TypeError at failureCount 0 (defense-in-depth form — api-client normally wraps as ApiError status 0)', () => {
      expect(shouldRetryMutation(0, new TypeError('Failed to fetch'))).toBe(true)
    })

    it('retries a non-Error unknown value at failureCount 0', () => {
      expect(shouldRetryMutation(0, 'opaque failure')).toBe(true)
      expect(shouldRetryMutation(0, { code: 'UNKNOWN' })).toBe(true)
    })

    it('retries null at failureCount 0 (instanceof is null-safe)', () => {
      expect(shouldRetryMutation(0, null)).toBe(true)
    })
  })

  describe('failureCount cap (retry:1 preserved)', () => {
    it('never retries at failureCount 1 even for 5xx', () => {
      expect(shouldRetryMutation(1, new ApiError('server error', 503))).toBe(false)
    })

    it('never retries at failureCount 1 even for network errors', () => {
      expect(shouldRetryMutation(1, new TypeError('Failed to fetch'))).toBe(false)
    })

    it('never retries at failureCount 1 even for unknown values', () => {
      expect(shouldRetryMutation(1, null)).toBe(false)
    })

    it('never retries above failureCount 1', () => {
      expect(shouldRetryMutation(3, new ApiError('server error', 500))).toBe(false)
    })
  })
})

describe('FE-D1 wiring: global QueryClient mutation defaults', () => {
  it('registers shouldRetryMutation as the mutation retry policy', () => {
    // Wiring pin (review pass 2): reverting providers.tsx to `retry: 1` now
    // fails this unit — the predicate must be THE registered policy.
    const defaults = makeQueryClient().getDefaultOptions()
    expect(defaults.mutations?.retry).toBe(shouldRetryMutation)
  })
})
