/**
 * Unit tests for iso-week/navigation (Story 61.7-FE) — coverage added iter-156.
 *
 * Week navigation (prev/next/range/sequence) built on iso-week/core. Cross-year boundaries
 * node-verified (2025-W52 ↔ 2026-W01; 2026-W53 → 2027-W01 since 2026 is a 53-week year).
 */

import { describe, it, expect } from 'vitest'
import {
  getPreviousIsoWeek,
  getNextIsoWeek,
  getWeekRange,
  generateWeekSequence,
} from '@/lib/iso-week/navigation'

describe('getPreviousIsoWeek / getNextIsoWeek', () => {
  it('steps within a year', () => {
    expect(getPreviousIsoWeek('2026-W03')).toBe('2026-W02')
    expect(getNextIsoWeek('2026-W03')).toBe('2026-W04')
  })
  it('crosses year boundaries (node-verified)', () => {
    expect(getPreviousIsoWeek('2026-W01')).toBe('2025-W52') // 2025 has 52 weeks
    expect(getNextIsoWeek('2025-W52')).toBe('2026-W01')
    expect(getNextIsoWeek('2026-W53')).toBe('2027-W01') // 2026 has 53 weeks
  })
  it('next ∘ previous is identity', () => {
    expect(getNextIsoWeek(getPreviousIsoWeek('2026-W10'))).toBe('2026-W10')
  })
})

describe('getWeekRange', () => {
  it('throws on negative count and returns [] for 0', () => {
    expect(() => getWeekRange(-1)).toThrow(/non-negative/)
    expect(getWeekRange(0)).toEqual([])
  })
  it('walks backward from startWeek (default direction)', () => {
    expect(getWeekRange(3, { startWeek: '2026-W05', direction: 'backward' })).toEqual([
      '2026-W05',
      '2026-W04',
      '2026-W03',
    ])
  })
  it('walks forward when direction is forward', () => {
    expect(getWeekRange(3, { startWeek: '2026-W05', direction: 'forward' })).toEqual([
      '2026-W05',
      '2026-W06',
      '2026-W07',
    ])
  })
})

describe('generateWeekSequence (inclusive)', () => {
  it('expands a same-year range', () => {
    expect(generateWeekSequence('2026-W01', '2026-W03')).toEqual([
      '2026-W01',
      '2026-W02',
      '2026-W03',
    ])
  })
  it('returns a single week when start === end', () => {
    expect(generateWeekSequence('2026-W03', '2026-W03')).toEqual(['2026-W03'])
  })
  it('expands across a year boundary', () => {
    expect(generateWeekSequence('2025-W52', '2026-W01')).toEqual(['2025-W52', '2026-W01'])
  })
})
