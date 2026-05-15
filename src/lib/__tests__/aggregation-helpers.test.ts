import { describe, it, expect } from 'vitest'
import { nullPreservingSum } from '../aggregation-helpers'

describe('nullPreservingSum', () => {
  it('returns null when both inputs are null (all-unknown semantic)', () => {
    expect(nullPreservingSum(null, null)).toBeNull()
  })

  it('returns number when accumulator is null and value is number (first real value)', () => {
    expect(nullPreservingSum(null, 5)).toBe(5)
  })

  it('returns number when accumulator is number and value is null (subsequent null after real)', () => {
    expect(nullPreservingSum(10, null)).toBe(10)
  })

  it('sums when both inputs are numbers', () => {
    expect(nullPreservingSum(10, 5)).toBe(15)
  })

  // Bonus: verify expected reducer usage
  it('used as Array.reduce callback: all-null array stays null', () => {
    const items: Array<{ v: number | null }> = [{ v: null }, { v: null }, { v: null }]
    const result = items.reduce<number | null>((acc, item) => nullPreservingSum(acc, item.v), null)
    expect(result).toBeNull()
  })

  it('used as Array.reduce callback: mixed array sums non-null values', () => {
    const items: Array<{ v: number | null }> = [{ v: null }, { v: 10 }, { v: null }, { v: 5 }]
    const result = items.reduce<number | null>((acc, item) => nullPreservingSum(acc, item.v), null)
    expect(result).toBe(15)
  })
})
