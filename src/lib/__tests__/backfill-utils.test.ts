/**
 * Russian-locale guard for backfill-utils.formatBackfillProgress (iter-85).
 *
 * The progress string previously rendered dot-locale `(${percentage.toFixed(1)}%)` → "(50.0%)".
 * Now via canonical formatPercentage → "(50,0 %)" (comma + NBSP). The component had no direct
 * test; these lock the locale + the null guard. `\s` matches the NBSP separator.
 */

import { describe, it, expect } from 'vitest'
import { formatBackfillProgress } from '../backfill-utils'
import type { BackfillProgress } from '@/types/backfill'

const progress = (
  percentage: number,
  completed_days: number,
  total_days: number
): BackfillProgress => ({
  total_days,
  completed_days,
  current_date: null,
  percentage,
  estimated_remaining_seconds: null,
})

describe('formatBackfillProgress', () => {
  it('renders the progress with a comma+NBSP percent (Russian locale)', () => {
    expect(formatBackfillProgress(progress(50, 5, 10))).toMatch(/^5 \/ 10 дней \(50,0\s%\)$/)
  })

  it('formats the percent to one decimal', () => {
    expect(formatBackfillProgress(progress(33.33, 33, 99))).toMatch(/\(33,3\s%\)/)
  })

  it('returns "Нет данных" for null progress', () => {
    expect(formatBackfillProgress(null)).toBe('Нет данных')
  })

  it('never renders the dot-locale form', () => {
    expect(formatBackfillProgress(progress(50, 5, 10))).not.toContain('50.0%')
  })

  it('separates the percent with a real NBSP (U+00A0), not a plain space', () => {
    // \s in the regexes above also matches a plain space; pin the NBSP explicitly here.
    expect(formatBackfillProgress(progress(50, 5, 10))).toContain(
      `50,0${String.fromCharCode(0xa0)}%`
    )
  })
})
