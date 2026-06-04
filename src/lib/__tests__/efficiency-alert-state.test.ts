/**
 * Unit tests for efficiency-alert-state (Story 33.4-FE) — regression coverage added iter-133.
 *
 * sessionStorage-backed alert dismiss state. jsdom provides sessionStorage; each test starts clean.
 * Covers round-trip persistence, corrupt-JSON resilience, and the shouldShowLossAlert reappear-on-
 * increase logic (AC4).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ALERT_DISMISS_KEY,
  getAlertDismissState,
  setAlertDismissState,
  clearAlertDismissState,
  shouldShowLossAlert,
} from '@/lib/efficiency-alert-state'

beforeEach(() => {
  sessionStorage.clear()
})

describe('getAlertDismissState', () => {
  it('returns the default (not dismissed) when nothing is stored', () => {
    expect(getAlertDismissState()).toEqual({ dismissed: false, lossCount: null })
  })

  it('returns the default when the stored value is corrupt JSON', () => {
    sessionStorage.setItem(ALERT_DISMISS_KEY, 'not-json{')
    expect(getAlertDismissState()).toEqual({ dismissed: false, lossCount: null })
  })
})

describe('setAlertDismissState / clearAlertDismissState round-trip', () => {
  it('persists the dismissed flag + loss count, readable by getAlertDismissState', () => {
    setAlertDismissState(7)
    expect(getAlertDismissState()).toEqual({ dismissed: true, lossCount: 7 })
  })

  it('clear removes the stored state (back to default)', () => {
    setAlertDismissState(7)
    clearAlertDismissState()
    expect(getAlertDismissState()).toEqual({ dismissed: false, lossCount: null })
  })
})

describe('shouldShowLossAlert', () => {
  it('never shows when there are no losses (count 0)', () => {
    expect(shouldShowLossAlert(0)).toBe(false)
    setAlertDismissState(5)
    expect(shouldShowLossAlert(0)).toBe(false)
  })

  it('shows when never dismissed', () => {
    expect(shouldShowLossAlert(5)).toBe(true)
  })

  it('hides when dismissed and the loss count has not increased', () => {
    setAlertDismissState(5)
    expect(shouldShowLossAlert(5)).toBe(false)
    expect(shouldShowLossAlert(3)).toBe(false) // decreased → still hidden
  })

  it('reappears when the loss count increases past the dismissed count (AC4)', () => {
    setAlertDismissState(5)
    expect(shouldShowLossAlert(6)).toBe(true)
  })
})

describe('ALERT_DISMISS_KEY', () => {
  it('is the documented sessionStorage key', () => {
    expect(ALERT_DISMISS_KEY).toBe('advertising_loss_alert_dismissed')
  })
})
