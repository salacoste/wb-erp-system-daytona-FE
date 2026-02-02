/**
 * IncompleteWeekBanner Component
 * Dashboard Data Availability Indicators
 *
 * Displays a banner when viewing an incomplete week, explaining that
 * some financial data is not yet available and showing the expected date.
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

'use client'

import { Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { isPeriodIncomplete, formatExpectedReportDate } from '@/lib/week-report-utils'

/**
 * Props for IncompleteWeekBanner component
 */
export interface IncompleteWeekBannerProps {
  /** Selected period (week "YYYY-Www" or month "YYYY-MM") */
  period: string
  /** Period type */
  periodType: 'week' | 'month'
  /** Additional className */
  className?: string
}

/**
 * IncompleteWeekBanner shows a contextual message when viewing incomplete periods.
 *
 * For incomplete weeks:
 * "Неделя ещё не завершена. Финансовый отчёт будет доступен ~{date}"
 *
 * For incomplete months:
 * "Месяц ещё не завершён. Данные обновляются по мере поступления."
 */
export function IncompleteWeekBanner({
  period,
  periodType,
  className,
}: IncompleteWeekBannerProps): React.ReactElement | null {
  // Only show banner for incomplete periods
  if (!isPeriodIncomplete(period, periodType)) {
    return null
  }

  const isWeek = periodType === 'week'
  const expectedDate = isWeek ? formatExpectedReportDate(period) : null

  return (
    <Alert
      variant="default"
      className={cn('border-blue-200 bg-blue-50', className)}
      role="status"
      aria-live="polite"
    >
      <Clock className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-800">
        {isWeek ? 'Неделя ещё не завершена' : 'Месяц ещё не завершён'}
      </AlertTitle>
      <AlertDescription className="text-blue-700">
        {isWeek ? (
          <>
            Некоторые метрики (выкупы, логистика, хранение, теор. прибыль) будут доступны после
            формирования недельного отчёта <span className="font-medium">~{expectedDate}</span>.
          </>
        ) : (
          <>Данные обновляются по мере поступления. Полный финансовый отчёт по неделям в месяце.</>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default IncompleteWeekBanner
