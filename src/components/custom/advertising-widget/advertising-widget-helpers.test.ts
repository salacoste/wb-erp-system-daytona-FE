/**
 * Tests for getOrganicContributionColorClass (advertising-widget-helpers).
 *
 * Mirrors AdvertisingSummaryCards thresholds so the dashboard widget and the analytics
 * card agree on organic-share colour. Replaces the widget's prior hardcoded green, which
 * rendered even a negative/low share as "healthy".
 */

import { describe, it, expect } from 'vitest'
import { getOrganicContributionColorClass } from './advertising-widget-helpers'

describe('getOrganicContributionColorClass', () => {
  it('returns muted for null / undefined / NaN (no data)', () => {
    expect(getOrganicContributionColorClass(null)).toBe('text-muted-foreground')
    expect(getOrganicContributionColorClass(undefined)).toBe('text-muted-foreground')
    expect(getOrganicContributionColorClass(NaN)).toBe('text-muted-foreground')
  })

  it('returns the error valence for a negative share (WB re-attribution anomaly)', () => {
    expect(getOrganicContributionColorClass(-5)).toBe('text-status-error')
    expect(getOrganicContributionColorClass(-40)).toBe('text-status-error')
  })

  it('returns success / warning across the positive thresholds (low collapses to warning)', () => {
    expect(getOrganicContributionColorClass(92.45)).toBe('text-status-success') // >= 50
    expect(getOrganicContributionColorClass(50)).toBe('text-status-success') // boundary
    expect(getOrganicContributionColorClass(25)).toBe('text-status-warning') // 20-50
    expect(getOrganicContributionColorClass(20)).toBe('text-status-warning') // boundary
    expect(getOrganicContributionColorClass(5)).toBe('text-status-warning') // 0-20 collapsed (174.2)
    expect(getOrganicContributionColorClass(0)).toBe('text-status-warning') // zero is low, not error
  })

  it('classifies by the raw value, not the rounded display (49.5 stays warning)', () => {
    // formatPercentageInt(49.5) displays "50 %", but the colour reflects the true value
    // (49.5 < 50 → warning). The colour is intentionally more precise than the rounded label.
    expect(getOrganicContributionColorClass(49.5)).toBe('text-status-warning')
  })
})
