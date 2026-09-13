import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatNumber } from '@/lib/utils'
import type { SearchAnalyticsCoverage, SearchOrdersSummary } from '@/types/search-analytics'

type CoverageNoticeSource = Pick<
  SearchOrdersSummary,
  | 'coverageKnown'
  | 'requestedDayCount'
  | 'coveredDayCount'
  | 'missingDayCount'
  | 'coverageComplete'
  | 'missingDates'
> &
  Partial<Pick<SearchAnalyticsCoverage, 'status'>>

export function SearchCoverageNotice({ summary }: { summary: CoverageNoticeSource }) {
  if (summary.coverageKnown && summary.coverageComplete) return null

  const missingDates =
    summary.missingDates.length > 0 ? summary.missingDates.join(', ') : 'не определены'

  return (
    <Alert variant="warning" data-testid="search-coverage-notice">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {summary.status === 'error'
          ? 'Ошибка проверки покрытия поисковой аналитики'
          : summary.status === 'unknown' || !summary.coverageKnown
            ? 'Полнота поисковой аналитики не подтверждена'
            : 'Неполное покрытие поисковой аналитики'}
      </AlertTitle>
      <AlertDescription className="space-y-1">
        <p>
          Покрыто {formatNumber(summary.coveredDayCount)} из{' '}
          {formatNumber(summary.requestedDayCount)} запрошенных дней; без покрытия:{' '}
          {formatNumber(summary.missingDayCount)}.
        </p>
        <p>Даты без покрытия: {missingDates}.</p>
        <p>
          Метрики и доли рассчитаны только по покрытым датам. Выбранный диапазон не является полным.
        </p>
        {!summary.coverageKnown && (
          <p>
            {summary.status === 'error'
              ? 'Не удалось получить реестр покрытия; результаты не считаются авторитетными.'
              : 'Метаданные покрытия отсутствуют или противоречивы; полнота диапазона не подтверждена.'}
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}
