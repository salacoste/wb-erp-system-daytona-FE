/**
 * TDD Tests for Orders Type Guards
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests validate type guards for discriminated unions and status validation.
 */

import { describe, it, expect } from 'vitest'
import {
  isLocalHistoryEntry,
  isWbNativeHistoryEntry,
  isValidSupplierStatus,
  isValidWbStatus,
  isFullHistoryEntry,
} from '../orders-guards'
import type { FullHistoryEntry } from '../orders-history'

// Test Fixtures
const localEntry: FullHistoryEntry = {
  source: 'local',
  oldSupplierStatus: null,
  newSupplierStatus: 'new',
  oldWbStatus: null,
  newWbStatus: 'waiting',
  timestamp: '2026-01-02T10:00:00.000Z',
}

const wbNativeEntry: FullHistoryEntry = {
  source: 'wb_native',
  wbStatusCode: 'created',
  timestamp: '2026-01-02T10:00:00.000Z',
}

describe('Orders Type Guards', () => {
  describe('isValidSupplierStatus', () => {
    it.each(['new', 'confirm', 'complete', 'cancel'])('returns true for %s', status => {
      expect(isValidSupplierStatus(status)).toBe(true)
    })

    it('returns false for invalid values', () => {
      expect(isValidSupplierStatus('invalid')).toBe(false)
      expect(isValidSupplierStatus('pending')).toBe(false)
      expect(isValidSupplierStatus(null)).toBe(false)
      expect(isValidSupplierStatus(undefined)).toBe(false)
      expect(isValidSupplierStatus(123)).toBe(false)
      expect(isValidSupplierStatus('')).toBe(false)
    })
  })

  describe('isValidWbStatus', () => {
    it.each(['waiting', 'sorted', 'sold', 'canceled', 'canceled_by_client', 'defect'])(
      'returns true for %s',
      status => {
        expect(isValidWbStatus(status)).toBe(true)
      }
    )

    it('returns false for invalid values', () => {
      expect(isValidWbStatus('invalid')).toBe(false)
      expect(isValidWbStatus('WAITING')).toBe(false) // Case sensitive
      expect(isValidWbStatus(null)).toBe(false)
      expect(isValidWbStatus(undefined)).toBe(false)
    })
  })

  describe('isLocalHistoryEntry', () => {
    it('returns true for local entry', () => {
      expect(isLocalHistoryEntry(localEntry)).toBe(true)
    })

    it('returns false for wb_native entry', () => {
      expect(isLocalHistoryEntry(wbNativeEntry)).toBe(false)
    })

    it('narrows type for local entry', () => {
      const entry: FullHistoryEntry = localEntry
      if (isLocalHistoryEntry(entry)) {
        expect(entry.newSupplierStatus).toBe('new')
        expect(entry.newWbStatus).toBe('waiting')
      }
    })

    it('returns false for invalid structures', () => {
      expect(isLocalHistoryEntry({})).toBe(false)
      expect(isLocalHistoryEntry(null)).toBe(false)
      expect(isLocalHistoryEntry({ source: 'invalid' })).toBe(false)
    })
  })

  describe('isWbNativeHistoryEntry', () => {
    it('returns true for wb_native entry', () => {
      expect(isWbNativeHistoryEntry(wbNativeEntry)).toBe(true)
    })

    it('returns false for local entry', () => {
      expect(isWbNativeHistoryEntry(localEntry)).toBe(false)
    })

    it('narrows type for wb_native entry', () => {
      const entry: FullHistoryEntry = wbNativeEntry
      if (isWbNativeHistoryEntry(entry)) {
        expect(entry.wbStatusCode).toBe('created')
      }
    })

    it('returns false for invalid structures', () => {
      expect(isWbNativeHistoryEntry({})).toBe(false)
      expect(isWbNativeHistoryEntry(null)).toBe(false)
    })
  })

  describe('isFullHistoryEntry', () => {
    it('returns true for valid local entry', () => {
      expect(isFullHistoryEntry(localEntry)).toBe(true)
    })

    it('returns true for valid wb_native entry', () => {
      expect(isFullHistoryEntry(wbNativeEntry)).toBe(true)
    })

    it('returns false for invalid source', () => {
      expect(isFullHistoryEntry({ source: 'invalid', timestamp: '2026-01-01' })).toBe(false)
    })

    it('returns false for missing required fields', () => {
      expect(isFullHistoryEntry({ source: 'local', timestamp: '2026-01-01' })).toBe(false)
      expect(isFullHistoryEntry({ source: 'wb_native' })).toBe(false)
    })

    it('returns false for null/undefined', () => {
      expect(isFullHistoryEntry(null)).toBe(false)
      expect(isFullHistoryEntry(undefined)).toBe(false)
    })
  })
})
