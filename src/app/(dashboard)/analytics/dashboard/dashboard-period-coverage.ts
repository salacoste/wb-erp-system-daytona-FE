import { formatDateRangeRu } from '@/lib/date-range-utils'
import {
  getWeeksInMonth,
  getMonthEndDate,
  getMonthStartDate,
  getWeekEndDate,
  getWeekStartDate,
} from '@/lib/period-helpers'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

interface WeekLike {
  week: string
}

export type DashboardMonthSummaryWeeksSource = 'loading' | 'available' | 'completed-fallback'

export interface DashboardMonthSummaryWeeks {
  weeks: string[]
  source: DashboardMonthSummaryWeeksSource
}

export interface DashboardMonthCoverage {
  coveredRangeLabel: string
  calendarRangeLabel: string
  weeksLabel: string
  weekListLabel: string
  hasCalendarGap: boolean
}

function longestContiguousWeekRun(monthWeeks: string[], availableWeeks: Set<string>): string[] {
  let best: string[] = []
  let current: string[] = []

  for (const week of monthWeeks) {
    if (availableWeeks.has(week)) {
      current.push(week)
      if (current.length >= best.length) best = [...current]
      continue
    }

    current = []
  }

  return best
}

/**
 * Use report-backed completed weeks when availability is loaded. While it is
 * still loading, keep the established month week span so React Query can use
 * optimistic placeholder/loading behavior and then refetch with the narrowed
 * range once `availableWeeks` arrives.
 */
export function getDashboardMonthSummaryWeeks(
  month: string,
  availableWeeks: WeekLike[] | undefined
): DashboardMonthSummaryWeeks {
  const weeks = getWeeksInMonth(month)
  if (!availableWeeks) return { weeks, source: 'loading' }

  const lastCompleted = getLastCompletedWeek()
  const available = new Set(availableWeeks.map(w => w.week))
  const completedMonthWeeks = weeks.filter(week => week <= lastCompleted)
  // The cabinet-summary API accepts a contiguous weekStart/weekEnd range, not
  // a sparse week list. Enforce contiguity here so the range never implies or
  // fetches an unavailable week when available-weeks has gaps.
  const completedAvailableWeeks = longestContiguousWeekRun(completedMonthWeeks, available)

  if (completedAvailableWeeks.length > 0) {
    return { weeks: completedAvailableWeeks, source: 'available' }
  }

  return { weeks: completedMonthWeeks, source: 'completed-fallback' }
}

/**
 * Dashboard month summaries are backed by completed WB weekly reports.
 * This helper makes the effective week coverage explicit for users so the
 * month label is not mistaken for a guaranteed calendar-day query.
 */
export function getDashboardMonthCoverage(
  month: string,
  weekStart: string,
  weekEnd: string
): DashboardMonthCoverage {
  const coveredStart = getWeekStartDate(weekStart)
  const coveredEnd = getWeekEndDate(weekEnd)
  const calendarStart = getMonthStartDate(month)
  const calendarEnd = getMonthEndDate(month)

  const monthWeeks = getWeeksInMonth(month).filter(week => week >= weekStart && week <= weekEnd)

  return {
    coveredRangeLabel: formatDateRangeRu(coveredStart, coveredEnd),
    calendarRangeLabel: formatDateRangeRu(calendarStart, calendarEnd),
    weeksLabel: weekStart === weekEnd ? weekStart : `${weekStart} — ${weekEnd}`,
    weekListLabel: monthWeeks.length > 0 ? monthWeeks.join(', ') : weekStart,
    hasCalendarGap:
      coveredStart.getTime() > calendarStart.getTime() ||
      coveredEnd.getTime() < calendarEnd.getTime(),
  }
}
