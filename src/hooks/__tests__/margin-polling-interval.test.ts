/**
 * Tests for margin-polling-interval.ts
 * Pure-function coverage: computeRefetchInterval
 */

import { describe, it, expect, vi } from 'vitest'
import { computeRefetchInterval } from '../margin-polling-interval'
import type { RefetchIntervalQueryState, RefetchIntervalRefs } from '../margin-polling-interval'
import type { UseMarginPollingWithQueryOptions } from '../margin-polling-types'
import { ApiError } from '@/types/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRefs(): RefetchIntervalRefs {
  return {
    marginRef: { current: null },
    errorRef: { current: null },
    attemptsRef: { current: 0 },
    timeoutRef: { current: false },
    onErrorRef: { current: undefined },
    onTimeoutRef: { current: undefined },
    lastDataUpdatedAtRef: { current: 0 },
  }
}

function makeOptions(
  overrides: Partial<UseMarginPollingWithQueryOptions> = {}
): UseMarginPollingWithQueryOptions {
  return {
    nmId: '12345',
    enabled: true,
    strategy: { interval: 2500, maxAttempts: 5, estimatedTime: 10000 },
    ...overrides,
  }
}

function makeQuery(
  overrides: Partial<RefetchIntervalQueryState['state']> = {}
): RefetchIntervalQueryState {
  return {
    state: {
      status: 'success',
      error: null,
      data: null,
      dataUpdatedAt: 0,
      ...overrides,
    },
  }
}

// ---------------------------------------------------------------------------
// computeRefetchInterval
// ---------------------------------------------------------------------------

describe('computeRefetchInterval', () => {
  it('returns false when queryEnabled is false', () => {
    const result = computeRefetchInterval(makeQuery(), false, makeOptions(), makeRefs())
    expect(result).toBe(false)
  })

  it('returns false when nmId is empty', () => {
    const result = computeRefetchInterval(makeQuery(), true, makeOptions({ nmId: '' }), makeRefs())
    expect(result).toBe(false)
  })

  it('returns false when nmId is whitespace', () => {
    const result = computeRefetchInterval(
      makeQuery(),
      true,
      makeOptions({ nmId: '   ' }),
      makeRefs()
    )
    expect(result).toBe(false)
  })

  it('returns false when margin already found', () => {
    const refs = makeRefs()
    refs.marginRef.current = 15.5
    const result = computeRefetchInterval(makeQuery(), true, makeOptions(), refs)
    expect(result).toBe(false)
  })

  it('returns interval for transient 500 error', () => {
    const query = makeQuery({
      status: 'error',
      error: new ApiError('Server error', 500),
    })
    const refs = makeRefs()
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(2500)
    expect(refs.attemptsRef.current).toBe(1)
  })

  it('returns false and calls onError for 400 error', () => {
    const onError = vi.fn()
    const query = makeQuery({
      status: 'error',
      error: new ApiError('Bad request', 400),
    })
    const refs = makeRefs()
    refs.onErrorRef.current = onError
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(false)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(refs.errorRef.current).toBe(query.state.error)
  })

  it('returns false and calls onError for 403 error', () => {
    const onError = vi.fn()
    const query = makeQuery({
      status: 'error',
      error: new ApiError('Forbidden', 403),
    })
    const refs = makeRefs()
    refs.onErrorRef.current = onError
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(false)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('returns false and calls onError for 404 error', () => {
    const onError = vi.fn()
    const query = makeQuery({
      status: 'error',
      error: new ApiError('Not found', 404),
    })
    const refs = makeRefs()
    refs.onErrorRef.current = onError
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(false)
  })

  it('returns false for non-ApiError errors', () => {
    const onError = vi.fn()
    const query = makeQuery({
      status: 'error',
      error: new Error('generic error'),
    })
    const refs = makeRefs()
    refs.onErrorRef.current = onError
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(false)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('returns false when status is completed', () => {
    const query = makeQuery({
      status: 'success',
      data: { status: 'completed' },
      dataUpdatedAt: 1000,
    })
    const refs = makeRefs()
    refs.lastDataUpdatedAtRef.current = 0
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(false)
  })

  it('increments attempts when dataUpdatedAt changes', () => {
    const query = makeQuery({
      status: 'success',
      data: { status: 'pending' },
      dataUpdatedAt: 2000,
    })
    const refs = makeRefs()
    refs.lastDataUpdatedAtRef.current = 1000
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(2500)
    expect(refs.attemptsRef.current).toBe(1)
  })

  it('does not increment attempts when dataUpdatedAt unchanged', () => {
    const query = makeQuery({
      status: 'success',
      data: { status: 'pending' },
      dataUpdatedAt: 1000,
    })
    const refs = makeRefs()
    refs.lastDataUpdatedAtRef.current = 1000
    computeRefetchInterval(query, true, makeOptions(), refs)
    expect(refs.attemptsRef.current).toBe(0)
  })

  it('returns false and calls onTimeout when max attempts reached', () => {
    const onTimeout = vi.fn()
    const refs = makeRefs()
    refs.attemptsRef.current = 5
    refs.onTimeoutRef.current = onTimeout
    const query = makeQuery({
      status: 'success',
      data: { status: 'pending' },
      dataUpdatedAt: 1000,
    })
    refs.lastDataUpdatedAtRef.current = 0
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(false)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(refs.timeoutRef.current).toBe(true)
  })

  it('returns interval when within max attempts', () => {
    const refs = makeRefs()
    refs.attemptsRef.current = 3
    const query = makeQuery({
      status: 'success',
      data: { status: 'pending' },
      dataUpdatedAt: 0,
    })
    refs.lastDataUpdatedAtRef.current = 0
    const result = computeRefetchInterval(query, true, makeOptions(), refs)
    expect(result).toBe(2500)
  })
})
