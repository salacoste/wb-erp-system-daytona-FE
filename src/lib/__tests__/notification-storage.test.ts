/**
 * Unit tests for notification-storage (data-import notification state) — coverage added iter-151.
 *
 * localStorage getter/setters for last-import + dismissed timestamps. jsdom provides localStorage;
 * each test starts clean. Covers null-when-empty, round-trip persistence, and key isolation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getLastImportTimestamp,
  saveLastImportTimestamp,
  getDismissedTimestamp,
  saveDismissedTimestamp,
} from '@/lib/notification-storage'

beforeEach(() => {
  localStorage.clear()
})

describe('last-import timestamp', () => {
  it('returns null when nothing is stored', () => {
    expect(getLastImportTimestamp()).toBeNull()
  })
  it('round-trips a saved timestamp as a number', () => {
    saveLastImportTimestamp(1717500000000)
    expect(getLastImportTimestamp()).toBe(1717500000000)
  })
})

describe('dismissed timestamp', () => {
  it('returns null when nothing is stored', () => {
    expect(getDismissedTimestamp()).toBeNull()
  })
  it('round-trips a saved timestamp as a number', () => {
    saveDismissedTimestamp(1717600000000)
    expect(getDismissedTimestamp()).toBe(1717600000000)
  })
})

describe('key isolation', () => {
  it('last-import and dismissed use independent keys', () => {
    saveLastImportTimestamp(111)
    expect(getDismissedTimestamp()).toBeNull() // saving import does not touch dismissed
    saveDismissedTimestamp(222)
    expect(getLastImportTimestamp()).toBe(111) // and vice versa
    expect(getDismissedTimestamp()).toBe(222)
  })
})
