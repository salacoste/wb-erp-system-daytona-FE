import type React from 'react'
import { formatDateRangeRu } from '@/lib/date-range-utils'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { getWeekEndDate, getWeekStartDate, getWeeksInMonth } from '@/lib/period-helpers'

interface DashboardMonthWeekScopeValue {
  weeksLabel: string
  dateRangeLabel: string
}

export function getDashboardMonthWeekScope(month: string): DashboardMonthWeekScopeValue | null {
  const lastCompletedWeek = getLastCompletedWeek()
  const weeks = getWeeksInMonth(month).filter(week => week <= lastCompletedWeek)
  if (weeks.length === 0) return null

  const firstWeek = weeks[0]
  const lastWeek = weeks[weeks.length - 1]

  return {
    weeksLabel: weeks.join(', '),
    dateRangeLabel: formatDateRangeRu(getWeekStartDate(firstWeek), getWeekEndDate(lastWeek)),
  }
}

interface DashboardMonthWeekScopeProps {
  month: string
}

export function DashboardMonthWeekScope({
  month,
}: DashboardMonthWeekScopeProps): React.ReactElement | null {
  const scope = getDashboardMonthWeekScope(month)
  if (!scope) return null

  return (
    <div
      data-testid="dashboard-month-week-scope"
      role="note"
      className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900"
    >
      Месячная выборка по недельным WB-отчётам: {scope.weeksLabel}; включены даты:{' '}
      {scope.dateRangeLabel}.
    </div>
  )
}
