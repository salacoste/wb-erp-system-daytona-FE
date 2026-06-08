'use client'

import { StorageTrendsWidget, StorageTopConsumersWidget } from '@/components/custom/dashboard'
import { getWeekRange } from '@/lib/iso-week-utils'

/** Number of weeks for storage trends lookback */
const STORAGE_TRENDS_WEEKS = 8

interface StorageSectionProps {
  selectedWeek: string
}

export function StorageSection({ selectedWeek }: StorageSectionProps): React.ReactElement {
  const weeks = getWeekRange(STORAGE_TRENDS_WEEKS, {
    startWeek: selectedWeek,
    direction: 'backward',
  })
  const weekStart = weeks[weeks.length - 1] ?? selectedWeek
  const weekEnd = weeks[0] ?? selectedWeek

  return (
    <>
      <StorageTrendsWidget weekStart={weekStart} weekEnd={weekEnd} />
      <StorageTopConsumersWidget weekStart={weekStart} weekEnd={weekEnd} />
    </>
  )
}
