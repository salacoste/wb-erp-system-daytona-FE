/**
 * Tests for supply-polling-constants.ts
 * Pure-data coverage: POLLING_CONFIG values, supplyPollingQueryKeys structure
 */

import { describe, it, expect } from 'vitest'
import { POLLING_CONFIG, supplyPollingQueryKeys } from '../supply-polling-constants'

// ---------------------------------------------------------------------------
// POLLING_CONFIG
// ---------------------------------------------------------------------------

describe('POLLING_CONFIG', () => {
  it('has defaultInterval of 30 seconds', () => {
    expect(POLLING_CONFIG.defaultInterval).toBe(30000)
  })

  it('has deliveringInterval of 60 seconds', () => {
    expect(POLLING_CONFIG.deliveringInterval).toBe(60000)
  })

  it('has correct terminal statuses', () => {
    expect(POLLING_CONFIG.terminalStatuses).toEqual(['DELIVERED', 'CANCELLED'])
  })

  it('has correct active statuses', () => {
    expect(POLLING_CONFIG.activeStatuses).toEqual(['CLOSED', 'DELIVERING'])
  })

  it('has maxAttempts of 120', () => {
    expect(POLLING_CONFIG.maxAttempts).toBe(120)
  })

  it('has maxConsecutiveErrors of 3', () => {
    expect(POLLING_CONFIG.maxConsecutiveErrors).toBe(3)
  })

  it('has manualSyncRateLimitMs of 5 minutes', () => {
    expect(POLLING_CONFIG.manualSyncRateLimitMs).toBe(5 * 60 * 1000)
  })
})

// ---------------------------------------------------------------------------
// supplyPollingQueryKeys
// ---------------------------------------------------------------------------

describe('supplyPollingQueryKeys', () => {
  it('all returns base key', () => {
    expect(supplyPollingQueryKeys.all).toEqual(['supply-polling'])
  })

  it('active appends "active" segment', () => {
    expect(supplyPollingQueryKeys.active()).toEqual(['supply-polling', 'active'])
  })

  it('sync appends "sync" segment', () => {
    expect(supplyPollingQueryKeys.sync()).toEqual(['supply-polling', 'sync'])
  })
})
