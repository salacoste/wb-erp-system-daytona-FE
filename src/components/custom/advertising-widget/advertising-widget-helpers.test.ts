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

  it('returns red for a negative share (WB re-attribution anomaly)', () => {
    expect(getOrganicContributionColorClass(-5)).toBe('text-red-600')
    expect(getOrganicContributionColorClass(-40)).toBe('text-red-600')
  })

  it('returns green / yellow / orange across the positive thresholds', () => {
    expect(getOrganicContributionColorClass(92.45)).toBe('text-green-600') // >= 50
    expect(getOrganicContributionColorClass(50)).toBe('text-green-600') // boundary
    expect(getOrganicContributionColorClass(25)).toBe('text-yellow-600') // 20-50
    expect(getOrganicContributionColorClass(20)).toBe('text-yellow-600') // boundary
    expect(getOrganicContributionColorClass(5)).toBe('text-orange-600') // 0-20
    expect(getOrganicContributionColorClass(0)).toBe('text-orange-600') // zero is low, not red
  })

  it('classifies by the raw value, not the rounded display (49.5 stays yellow)', () => {
    // formatPercentageInt(49.5) displays "50 %", but the colour reflects the true value
    // (49.5 < 50 → yellow). The colour is intentionally more precise than the rounded label.
    expect(getOrganicContributionColorClass(49.5)).toBe('text-yellow-600')
  })
})
