/**
 * ReportPendingBanner — Shows when selected week's report isn't available yet.
 *
 * Corner case: Monday/early Tuesday the previous week is "completed" by calendar
 * but Wildberries hasn't published the financial report yet.
 * This banner replaces the generic error with an informative message.
 */

'use client'

import { Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { formatExpectedReportDate } from '@/lib/week-report-utils'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'

export interface ReportPendingBannerProps {
  /** Selected week that has no report yet (e.g. "2026-W07") */
  week: string
  /** Latest week with available data for fallback (e.g. "2026-W06") */
  latestAvailableWeek: string | null
}

export function ReportPendingBanner({
  week,
  latestAvailableWeek,
}: ReportPendingBannerProps): React.ReactElement {
  const expectedDate = formatExpectedReportDate(week)
  const { setWeek } = useDashboardPeriod()

  return (
    <Alert
      variant="default"
      className="border-status-warning/40 bg-status-warning/10"
      role="status"
      aria-live="polite"
    >
      <Clock className="h-4 w-4 text-status-warning" />
      <AlertTitle className="text-status-warning">Финансовый отчёт ещё не готов</AlertTitle>
      <AlertDescription className="text-status-warning">
        <p>
          Данные о заказах и рекламе доступны в реальном времени. Финансовые метрики (выкупы,
          логистика, хранение, прибыль) появятся после формирования недельного отчёта{' '}
          <span className="font-medium">~{expectedDate}</span>.
        </p>
        {latestAvailableWeek && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-status-warning/40 text-status-warning hover:bg-status-warning/10"
            onClick={() => setWeek(latestAvailableWeek)}
          >
            Показать последнюю доступную неделю ({latestAvailableWeek})
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
