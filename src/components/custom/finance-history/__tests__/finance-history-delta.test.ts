/** Unit tests for WoW delta computation + coloring. */

import { describe, it, expect } from 'vitest'
import { computeWowDelta, deltaColorClass } from '../finance-history-delta'

describe('computeWowDelta — currency (relative %)', () => {
  it('positive change → +% tone up', () => {
    const d = computeWowDelta('currency', 120, 100)
    expect(d?.tone).toBe('up')
    expect(d?.text).toMatch(/^\+/)
    expect(d?.text).toContain('%')
  })

  it('negative change → tone down (Intl renders the minus)', () => {
    const d = computeWowDelta('currency', 80, 100)
    expect(d?.tone).toBe('down')
  })

  it('returns null for the oldest column (no previous)', () => {
    expect(computeWowDelta('currency', 100, null)).toBeNull()
    expect(computeWowDelta('currency', 100, undefined)).toBeNull()
  })

  it('returns null when current missing or previous is 0', () => {
    expect(computeWowDelta('currency', null, 100)).toBeNull()
    expect(computeWowDelta('currency', 100, 0)).toBeNull()
  })
})

describe('computeWowDelta — percent (п.п.)', () => {
  it('positive points delta → tone up, п.п. unit', () => {
    const d = computeWowDelta('percent', 31.5, 30)
    expect(d?.tone).toBe('up')
    expect(d?.text).toContain('п.п.')
  })

  it('negative points delta → tone down', () => {
    const d = computeWowDelta('percent', 28, 30)
    expect(d?.tone).toBe('down')
  })

  it('zero delta → tone same', () => {
    const d = computeWowDelta('percent', 30, 30)
    expect(d?.tone).toBe('same')
  })
})

describe('deltaColorClass', () => {
  it('up + normal metric → financial-positive', () => {
    expect(deltaColorClass('up', false)).toBe('text-financial-positive')
  })
  it('up + negative metric (e.g. expense) → financial-negative (inversion)', () => {
    expect(deltaColorClass('up', true)).toBe('text-financial-negative')
  })
  it('down + normal metric → financial-negative', () => {
    expect(deltaColorClass('down', false)).toBe('text-financial-negative')
  })
  it('down + negative metric → financial-positive (inversion)', () => {
    expect(deltaColorClass('down', true)).toBe('text-financial-positive')
  })
  it('same → muted regardless', () => {
    expect(deltaColorClass('same', false)).toBe('text-muted-foreground')
    expect(deltaColorClass('same', true)).toBe('text-muted-foreground')
  })
})
