/**
 * Unit tests for SKU table formatter pure helpers — share-% computation used by
 * the competitor-parity BD/BE/BC columns (FR-1).
 */

import { describe, it, expect } from 'vitest'
import { sharePercentage, formatPercent } from '../sku-table-formatters'

describe('sharePercentage', () => {
  it('computes part / total × 100', () => {
    expect(sharePercentage(250, 1000)).toBe(25)
    expect(sharePercentage(50, 200)).toBe(25)
  })

  it('returns null when the part is null (missing value)', () => {
    expect(sharePercentage(null, 1000)).toBeNull()
  })

  it('returns null when the total is null', () => {
    expect(sharePercentage(250, null)).toBeNull()
  })

  it('returns null on divide-by-zero (total = 0 — no revenue/profit to share)', () => {
    expect(sharePercentage(250, 0)).toBeNull()
  })

  it('preserves a negative part (loss SKU — negative profit contribution)', () => {
    expect(sharePercentage(-100, 1000)).toBe(-10)
  })

  it('a part equal to the total is 100 %', () => {
    expect(sharePercentage(1000, 1000)).toBe(100)
  })
})

describe('formatPercent (share rendering)', () => {
  it('renders a null share as an em-dash (no misleading 0 %)', () => {
    expect(formatPercent(null)).toBe('—')
  })

  it('renders a numeric share with the % sign', () => {
    expect(formatPercent(25)).toContain('%')
  })
})
