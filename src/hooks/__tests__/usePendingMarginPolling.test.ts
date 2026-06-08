/**
 * Tests for usePendingMarginPolling helpers
 * Pure-function coverage: getPollingInterval, isProductPending, createProductsKey,
 * shouldShowRetry, getPendingElapsedTime, getPendingAffectedWeeks, hasPendingChanged
 *
 * Note: The usePendingMarginPollingEffect hook itself is a React effect with
 * complex timer lifecycle — its pure helpers are tested here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  FAST_POLL_INTERVAL,
  SLOW_POLL_INTERVAL,
  FAST_POLL_THRESHOLD,
  MAX_POLL_DURATION,
  MAX_POLL_BATCH_SIZE,
  getPollingInterval,
  isProductPending,
  createProductsKey,
  shouldShowRetry,
  getPendingElapsedTime,
  getPendingAffectedWeeks,
  hasPendingChanged,
  type PendingProduct,
} from '../usePendingMarginProducts-utils'

// ---------------------------------------------------------------------------
// Polling Constants
// ---------------------------------------------------------------------------

describe('polling constants', () => {
  it('FAST_POLL_INTERVAL is 7500ms', () => {
    expect(FAST_POLL_INTERVAL).toBe(7500)
  })

  it('SLOW_POLL_INTERVAL is 30000ms', () => {
    expect(SLOW_POLL_INTERVAL).toBe(30000)
  })

  it('FAST_POLL_THRESHOLD is 30000ms', () => {
    expect(FAST_POLL_THRESHOLD).toBe(30000)
  })

  it('MAX_POLL_DURATION is 5 minutes', () => {
    expect(MAX_POLL_DURATION).toBe(5 * 60 * 1000)
  })

  it('MAX_POLL_BATCH_SIZE is 5', () => {
    expect(MAX_POLL_BATCH_SIZE).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// getPollingInterval
// ---------------------------------------------------------------------------

describe('getPollingInterval', () => {
  it('returns FAST_POLL_INTERVAL when elapsed < threshold', () => {
    expect(getPollingInterval(0)).toBe(FAST_POLL_INTERVAL)
    expect(getPollingInterval(15000)).toBe(FAST_POLL_INTERVAL)
    expect(getPollingInterval(29999)).toBe(FAST_POLL_INTERVAL)
  })

  it('returns SLOW_POLL_INTERVAL when elapsed >= threshold', () => {
    expect(getPollingInterval(30000)).toBe(SLOW_POLL_INTERVAL)
    expect(getPollingInterval(60000)).toBe(SLOW_POLL_INTERVAL)
    expect(getPollingInterval(300000)).toBe(SLOW_POLL_INTERVAL)
  })
})

// ---------------------------------------------------------------------------
// isProductPending
// ---------------------------------------------------------------------------

describe('isProductPending', () => {
  it('returns true for a pending product (null margin, no reason, has cogs)', () => {
    const product = {
      current_margin_pct: null,
      missing_data_reason: null,
      has_cogs: true,
      cogs: { valid_from: '2025-W10' },
    }
    expect(isProductPending(product)).toBe(true)
  })

  it('returns false when margin is a number', () => {
    const product = {
      current_margin_pct: 15.5,
      missing_data_reason: null,
      has_cogs: true,
      cogs: { valid_from: '2025-W10' },
    }
    expect(isProductPending(product)).toBe(false)
  })

  it('returns false when margin is 0 (falsy but not null)', () => {
    const product = {
      current_margin_pct: 0,
      missing_data_reason: null,
      has_cogs: true,
      cogs: { valid_from: '2025-W10' },
    }
    expect(isProductPending(product)).toBe(false)
  })

  it('returns false when missing_data_reason is set', () => {
    const product = {
      current_margin_pct: null,
      missing_data_reason: 'COGS_NOT_ASSIGNED',
      has_cogs: true,
      cogs: { valid_from: '2025-W10' },
    }
    expect(isProductPending(product)).toBe(false)
  })

  it('returns false when has_cogs is false', () => {
    const product = {
      current_margin_pct: null,
      missing_data_reason: null,
      has_cogs: false,
      cogs: null,
    }
    expect(isProductPending(product)).toBe(false)
  })

  it('returns false when cogs has no valid_from', () => {
    const product = {
      current_margin_pct: null,
      missing_data_reason: null,
      has_cogs: true,
      cogs: { valid_from: '' },
    }
    expect(isProductPending(product)).toBe(false)
  })

  it('returns false when cogs is null', () => {
    const product = {
      current_margin_pct: null,
      missing_data_reason: null,
      has_cogs: true,
      cogs: null,
    }
    expect(isProductPending(product)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createProductsKey
// ---------------------------------------------------------------------------

describe('createProductsKey', () => {
  it('returns stable key for same products', () => {
    const products = [
      {
        nm_id: '123',
        current_margin_pct: null,
        missing_data_reason: null,
        has_cogs: true,
        cogs: { valid_from: '2025-W10' },
      },
    ]
    const key1 = createProductsKey(products)
    const key2 = createProductsKey(products)
    expect(key1).toBe(key2)
  })

  it('returns different keys for different products', () => {
    const productsA = [
      {
        nm_id: '123',
        current_margin_pct: null,
        missing_data_reason: null,
        has_cogs: true,
        cogs: { valid_from: '2025-W10' },
      },
    ]
    const productsB = [
      {
        nm_id: '456',
        current_margin_pct: null,
        missing_data_reason: null,
        has_cogs: true,
        cogs: { valid_from: '2025-W10' },
      },
    ]
    expect(createProductsKey(productsA)).not.toBe(createProductsKey(productsB))
  })

  it('handles empty array', () => {
    expect(createProductsKey([])).toBe('')
  })

  it('includes all fields in key', () => {
    const products = [
      {
        nm_id: '123',
        current_margin_pct: 10 as number | null | undefined,
        missing_data_reason: 'REASON' as string | null | undefined,
        has_cogs: false,
        cogs: null,
      },
    ]
    const key = createProductsKey(products)
    expect(key).toContain('123:10:REASON:false:')
  })
})

// ---------------------------------------------------------------------------
// shouldShowRetry
// ---------------------------------------------------------------------------

describe('shouldShowRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns false if nmId not in pending map', () => {
    const map = new Map<string, PendingProduct>()
    expect(shouldShowRetry(map, '123')).toBe(false)
  })

  it('returns false if elapsed < MAX_POLL_DURATION', () => {
    const now = Date.now()
    const map = new Map<string, PendingProduct>()
    map.set('123', { nmId: '123', detectedAt: now - 1000, validFrom: '2025-W10' })
    expect(shouldShowRetry(map, '123')).toBe(false)
  })

  it('returns true if elapsed > MAX_POLL_DURATION', () => {
    const now = Date.now()
    const map = new Map<string, PendingProduct>()
    map.set('123', {
      nmId: '123',
      detectedAt: now - MAX_POLL_DURATION - 1000,
      validFrom: '2025-W10',
    })
    expect(shouldShowRetry(map, '123')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getPendingElapsedTime
// ---------------------------------------------------------------------------

describe('getPendingElapsedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns 0 if nmId not in pending map', () => {
    const map = new Map<string, PendingProduct>()
    expect(getPendingElapsedTime(map, '123')).toBe(0)
  })

  it('returns elapsed time since detectedAt', () => {
    const now = Date.now()
    const map = new Map<string, PendingProduct>()
    map.set('123', { nmId: '123', detectedAt: now - 5000, validFrom: '2025-W10' })
    expect(getPendingElapsedTime(map, '123')).toBe(5000)
  })
})

// ---------------------------------------------------------------------------
// getPendingAffectedWeeks
// ---------------------------------------------------------------------------

describe('getPendingAffectedWeeks', () => {
  it('returns empty array if nmId not in pending map', () => {
    const map = new Map<string, PendingProduct>()
    expect(getPendingAffectedWeeks(map, '123')).toEqual([])
  })

  it('returns affected weeks for a past validFrom', () => {
    const map = new Map<string, PendingProduct>()
    // validFrom is a date string from cogs.valid_from (YYYY-MM-DD format)
    map.set('123', { nmId: '123', detectedAt: Date.now(), validFrom: '2025-01-06' })
    const weeks = getPendingAffectedWeeks(map, '123')
    expect(Array.isArray(weeks)).toBe(true)
    // Past validFrom should produce at least one affected week
    expect(weeks.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// hasPendingChanged
// ---------------------------------------------------------------------------

describe('hasPendingChanged', () => {
  it('returns false for identical maps', () => {
    const map = new Map<string, PendingProduct>()
    map.set('123', { nmId: '123', detectedAt: 1000, validFrom: '2025-W10' })
    expect(hasPendingChanged(map, map)).toBe(false)
  })

  it('returns true when sizes differ', () => {
    const prev = new Map<string, PendingProduct>()
    prev.set('123', { nmId: '123', detectedAt: 1000, validFrom: '2025-W10' })
    const next = new Map<string, PendingProduct>()
    expect(hasPendingChanged(prev, next)).toBe(true)
  })

  it('returns true when keys differ', () => {
    const prev = new Map<string, PendingProduct>()
    prev.set('123', { nmId: '123', detectedAt: 1000, validFrom: '2025-W10' })
    const next = new Map<string, PendingProduct>()
    next.set('456', { nmId: '456', detectedAt: 1000, validFrom: '2025-W10' })
    expect(hasPendingChanged(prev, next)).toBe(true)
  })

  it('returns false when same keys (values may differ)', () => {
    const prev = new Map<string, PendingProduct>()
    prev.set('123', { nmId: '123', detectedAt: 1000, validFrom: '2025-W10' })
    const next = new Map<string, PendingProduct>()
    next.set('123', { nmId: '123', detectedAt: 2000, validFrom: '2025-W11' })
    expect(hasPendingChanged(prev, next)).toBe(false)
  })

  it('returns false for two empty maps', () => {
    expect(hasPendingChanged(new Map(), new Map())).toBe(false)
  })
})
