/**
 * Unit tests for usePendingMarginProducts-utils (Request #18) — coverage added iter-164.
 *
 * Pure helpers extracted from usePendingMarginProducts (polling intervals, pending detection, stable
 * keys, retry/elapsed timing, affected-weeks, Map change detection). Time-dependent fns are asserted
 * relative to Date.now() with wide margins; date-dependent affected-weeks by structure.
 */

import { describe, it, expect } from 'vitest'
import type { PendingProduct } from '@/hooks/usePendingMarginProducts-utils'
import {
  FAST_POLL_INTERVAL,
  SLOW_POLL_INTERVAL,
  MAX_POLL_DURATION,
  getPollingInterval,
  isProductPending,
  createProductsKey,
  shouldShowRetry,
  getPendingElapsedTime,
  getPendingAffectedWeeks,
  hasPendingChanged,
} from '@/hooks/usePendingMarginProducts-utils'

const pending = (nmId: string, detectedAt: number, validFrom = '2025-01-01'): PendingProduct => ({
  nmId,
  detectedAt,
  validFrom,
})

describe('getPollingInterval', () => {
  it('is fast below the threshold, slow at/above it', () => {
    expect(getPollingInterval(0)).toBe(FAST_POLL_INTERVAL)
    expect(getPollingInterval(29_999)).toBe(FAST_POLL_INTERVAL)
    expect(getPollingInterval(30_000)).toBe(SLOW_POLL_INTERVAL)
    expect(getPollingInterval(60_000)).toBe(SLOW_POLL_INTERVAL)
  })
})

describe('isProductPending (Request #18: calculation-in-progress)', () => {
  const base = {
    current_margin_pct: null,
    missing_data_reason: null,
    has_cogs: true,
    cogs: { valid_from: '2026-01-01' },
  }
  it('is true only when margin null + reason null + has_cogs + cogs.valid_from', () => {
    expect(isProductPending(base)).toBe(true)
  })
  it('is false if any condition fails', () => {
    expect(isProductPending({ ...base, current_margin_pct: 12 })).toBe(false)
    expect(isProductPending({ ...base, missing_data_reason: 'no_sales' })).toBe(false)
    expect(isProductPending({ ...base, has_cogs: false })).toBe(false)
    expect(isProductPending({ ...base, cogs: null })).toBe(false)
  })
})

describe('createProductsKey', () => {
  it('builds a stable per-product key string', () => {
    const products = [
      {
        nm_id: '1',
        current_margin_pct: null,
        missing_data_reason: null,
        has_cogs: true,
        cogs: { valid_from: '2026-01-01' },
      },
    ]
    expect(createProductsKey(products)).toBe('1:null:null:true:2026-01-01')
  })
  it('is stable for same input and differs for changed input', () => {
    const a = [{ nm_id: '1', has_cogs: true }]
    const b = [{ nm_id: '2', has_cogs: true }]
    expect(createProductsKey(a)).toBe(createProductsKey(a))
    expect(createProductsKey(a)).not.toBe(createProductsKey(b))
  })
})

describe('shouldShowRetry / getPendingElapsedTime (Date.now()-relative)', () => {
  it('shouldShowRetry: false if absent, true past MAX_POLL_DURATION, false when fresh', () => {
    const map = new Map([
      ['old', pending('old', Date.now() - MAX_POLL_DURATION - 60_000)],
      ['fresh', pending('fresh', Date.now())],
    ])
    expect(shouldShowRetry(map, 'missing')).toBe(false)
    expect(shouldShowRetry(map, 'old')).toBe(true)
    expect(shouldShowRetry(map, 'fresh')).toBe(false)
  })
  it('getPendingElapsedTime: 0 if absent, ~elapsed otherwise', () => {
    const map = new Map([['p', pending('p', Date.now() - 5000)]])
    expect(getPendingElapsedTime(map, 'missing')).toBe(0)
    const elapsed = getPendingElapsedTime(map, 'p')
    expect(elapsed).toBeGreaterThanOrEqual(4900)
    expect(elapsed).toBeLessThan(60_000)
  })
})

describe('getPendingAffectedWeeks', () => {
  it('returns [] if absent, a non-empty week list for a past validFrom', () => {
    const map = new Map([['p', pending('p', Date.now(), '2020-01-01')]])
    expect(getPendingAffectedWeeks(map, 'missing')).toEqual([])
    expect(getPendingAffectedWeeks(map, 'p').length).toBeGreaterThanOrEqual(1)
  })
})

describe('hasPendingChanged', () => {
  it('detects size and key-set changes', () => {
    const a = new Map([['1', pending('1', 0)]])
    const aSame = new Map([['1', pending('1', 999)]]) // same key, different value
    const bigger = new Map([
      ['1', pending('1', 0)],
      ['2', pending('2', 0)],
    ])
    const diffKey = new Map([['9', pending('9', 0)]])
    expect(hasPendingChanged(a, aSame)).toBe(false) // compares keys only
    expect(hasPendingChanged(a, bigger)).toBe(true)
    expect(hasPendingChanged(a, diffKey)).toBe(true)
  })
})
