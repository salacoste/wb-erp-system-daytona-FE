'use client'

import { StorageTrendsWidget, StorageTopConsumersWidget } from '@/components/custom/dashboard'
import { getWeekRange } from '@/lib/iso-week-utils'
import { getWeeksInMonth } from '@/lib/period-helpers'

/** Number of weeks for storage trends lookback */
const STORAGE_TRENDS_WEEKS = 8

interface StorageSectionProps {
  periodType?: 'week' | 'month'
  selectedWeek: string
  selectedMonth?: string
}

export function StorageSection({
  periodType = 'week',
  selectedWeek,
  selectedMonth,
}: StorageSectionProps): React.ReactElement {
  const weeks =
    periodType === 'month' && selectedMonth
      ? getWeeksInMonth(selectedMonth)
      : getWeekRange(STORAGE_TRENDS_WEEKS, {
          startWeek: selectedWeek,
          direction: 'backward',
        })
  const weekStart =
    periodType === 'month' ? (weeks[0] ?? selectedWeek) : (weeks[weeks.length - 1] ?? selectedWeek)
  const weekEnd =
    periodType === 'month' ? (weeks[weeks.length - 1] ?? selectedWeek) : (weeks[0] ?? selectedWeek)

  return (
    <>
      <StorageTrendsWidget weekStart={weekStart} weekEnd={weekEnd} />
      <StorageTopConsumersWidget weekStart={weekStart} weekEnd={weekEnd} />
    </>
  )
}
