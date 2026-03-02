/**
 * Data Availability Hook
 * Separates finance data availability from realtime data (orders, advertising).
 *
 * Finance data requires a completed weekly report in available-weeks.
 * Orders/advertising data is available in realtime regardless.
 */

import { useMemo } from 'react'
import type { WeekData } from './financial/types'
import { getWeeksInMonth } from '@/lib/period-helpers'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

export interface DataAvailability {
  /** Whether finance data (sales, logistics, storage, profit) is available */
  isFinanceAvailable: boolean
  /** Latest week with finance data, for fallback navigation */
  latestAvailableWeek: string | null
}

/**
 * Determine finance data availability for the selected period.
 * Returns optimistic=true while availableWeeks is still loading to prevent banner flash.
 */
export function useDataAvailability(
  periodType: 'week' | 'month',
  selectedWeek: string,
  selectedMonth: string,
  availableWeeks: WeekData[] | undefined
): DataAvailability {
  const isFinanceAvailable = useMemo(() => {
    // Optimistic while loading — prevents banner flash
    if (!availableWeeks) return true

    if (periodType === 'week') {
      return availableWeeks.some(w => w.week === selectedWeek)
    }

    // Month mode: finance available if at least one week in the month
    // has a completed report (is in available-weeks list)
    const weeksInMonth = getWeeksInMonth(selectedMonth)
    const lastCompleted = getLastCompletedWeek()
    return weeksInMonth.some(w => w <= lastCompleted && availableWeeks.some(aw => aw.week === w))
  }, [periodType, selectedWeek, selectedMonth, availableWeeks])

  const latestAvailableWeek = availableWeeks?.[0]?.week ?? null

  return { isFinanceAvailable, latestAvailableWeek }
}
